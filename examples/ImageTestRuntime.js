// @ts-check

import sh from './spawnasync';

/**
 * @typedef {object} ContainerRuntimeOptions
 */

/**
 * @typedef {object} DockerCLIOptions
 * @property {string} command
 */

/**
 * @type {import('./Testcontainers').Container}
 */
class ContainerDockerCLI {

  /**
   * @param {DockerCLIOptions} options
   */
  constructor(options) {
    this.options = options;
  }

  /**
   * @param {import('./Testcontainers').StartOptions} param0
   */
  async run({
    image
  }) {
    const run = await sh(this.options.command, [
      'run',
      '--rm',
      image
    ]);
  }

  /**
   * @param {import('./Testcontainers').UploadOptions} options
   */
  async uploadFile(options) {

  }

  /**
   * @returns {string}
   */
  logs() {
    return '';
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
   * @param {ContainerRuntimeOptions} options
   */
  constructor(options) {

  }

  /**
   * @private
   */
  async init() {
    const dockerCommand = await sh('command', ['-v', this.docker.command]);
    console.log('docker CLI found at', dockerCommand.stdout);
    this.docker.command = dockerCommand.stdout.trim();
  }

  /**
   *
   * @param {import('./Testcontainers').StartOptions} options
   * @returns {Promise<import('./Testcontainers').Container>}
   */
  async start(options) {
    const container = new ContainerDockerCLI(this.docker);
    await container.run(options);
    return container;
  }

}
