// @ts-check

import { realpath, stat } from 'node:fs/promises';

// VSCode did not pick up the workspace dependency
// (actually it doesn't pick up any npm dependency)
// import spawnwait from '@turbokube/spawnwait';
import spawnwait from '../spawnwait/spawnwait';

/**
 * @typedef {object} ContainerRuntimeOptions
 * @typedef {import('./Testcontainers').Container} Container
 */

/**
 * @typedef {object} DockerCLIOptions
 * @property {string} command
 */

/**
 * @implements {Container}
 */
class ContainerDockerCLI {

  /**
   * @type {string}
   */
  name = '';

  /**
   * @type {string}
   */
  id = '';

  /**
   * @param {DockerCLIOptions} options
   */
  constructor(options) {
    this.options = options;
  }

  /**
   * @param {import('./Testcontainers').StartOptions} param0
   * @return void
   */
  async run({
    image
  }) {
    this.name = 'turbokube_examples_' + new Date().toISOString().replaceAll(/[^0-9]+/g,'');
    const run = await spawnwait(this.options.command, [
      'run',
      '--name',
      this.name,
      '--rm',
      '-d',
      image
    ]);
    this.id = run.stdout.trim();
    if (!/[a-f0-9]{64}/.test(this.id)) throw new Error('expected container id from run, got: ' + run.stdout);
    return this;
  }

  async stop() {
    const stop = await spawnwait(this.options.command, [
      'stop',
      this.id,
    ]);
  };

  /**
   * @param {import('./Testcontainers').UploadOptions} options
   */
  async uploadFile(options) {
    if (!/^(\/[^/]+)+/.test(options.containerPath)) {
      throw new Error(`unsupported containerPath ${options.containerPath}`);
    }
    if (Buffer.isBuffer(options.local)) {
      // we can use stdin for this with the arg -
      throw new Error('text body upload is not implemented');
    }
    const path = await realpath(options.local);
    const s = await stat(path);
    if (s.isDirectory()) {
      throw new Error('folder upload is not implemented');
    }
    if (!s.isFile()) {
      throw new Error(`unexpected local ${path}: ${s}`);
    }
    const args = ['cp'];
    args.push(path);
    args.push(`${this.id}:${options.containerPath}`);
    const cp = await spawnwait(this.options.command, args);
    if (cp.status !== 0) throw new Error(`cp stats ${cp.status}; ${cp.error}`);
  }

  /**
   * @returns {Promise<string>}
   * @param {import('../spawnwait/index').SpawnWaitStdout} [wait]
   * @param {number} [tail]
   */
  async logs(wait, tail) {
    const args = ['logs'];
    if (wait && wait.stdout) args.push('--follow');
    if (tail !== undefined) {
      if (!Number.isInteger(tail)) throw new Error(`tail must be integer, got: ${tail}`);
      args.push('--tail', tail.toString());
    }
    args.push(this.id);
    const logs = await spawnwait(this.options.command, args, wait);
    return logs.stdout;
  }

}

/**
 * Minimally scoped abstraction for testing container start + file sync workflows,
 * with small trivial applications that print assertable stuff to stdout.
 */
export default class ImageTestRuntime {

  /**
   * @type {ImageTestRuntime}
   * @private
   */
  static _instance;

  /**
   * @type {Array<import('./Testcontainers').Container>}
   */
  static _started = [];

  /**
   * @type {DockerCLIOptions}
   * @private
   */
  docker = {
    command: 'docker'
  };

  /**
   * @param {ContainerRuntimeOptions} options
   * @returns {Promise<ImageTestRuntime>}
   */
  static async getInstance(options) {
    if (ImageTestRuntime._instance === undefined) {
      ImageTestRuntime._instance = new ImageTestRuntime(options);
      await ImageTestRuntime._instance.init();
    }
    return ImageTestRuntime._instance;
  }

  /**
   *
   */
  static async stopAll() {
    /** @type {Array<Promise<any>>} */
    const stopping = [];
    ImageTestRuntime._started.forEach(container => {
      stopping.push(container.stop());
    });
    ImageTestRuntime._started = [];
    await Promise.all(stopping);
  }

  /**
   * @param {ContainerRuntimeOptions} options
   */
  constructor(options) {
  }

  /**
   * @private
   */
  async init() {
    const dockerCommand = await spawnwait('command', ['-v', this.docker.command]);
    if (dockerCommand.status !== 0) throw new Error(`Failed to find docker CLI: ${dockerCommand.stderr}`)
    this.docker.command = dockerCommand.stdout.trim();
  }

  /**
   * @param {string} image
   * @returns {Promise<string>}
   */
  async getTestImage(image) {
    if (!/^[a-z]+-[a-z+]/.test(image)) {
      throw new Error(`Unexpected test image name: ${image}`);
    }
    const tag = 'latest';
    return `ghcr.io/turbokube/${image}:${tag}`;
  }

  /**
   *
   * @param {import('./Testcontainers').StartOptions} options
   * @returns {Promise<import('./Testcontainers').Container>}
   */
  async start(options) {
    const container = new ContainerDockerCLI(this.docker);
    await container.run(options);
    ImageTestRuntime._started.push(container);
    return container;
  }

}
