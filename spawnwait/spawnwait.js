// @ts-check

import { spawn } from "node:child_process";

/**
 * @type {NodeJS.Signals}
 */
const KILL_DEFAULT = 'SIGTERM';

const DEBUG = /\bspawnwait\b/.test(process.env.DEBUG || '');

/**
 * @type {import('node:child_process').SpawnOptionsWithoutStdio}
 */
const OPTIONS = {
  shell: false,
  stdio: 'pipe',
};

class SpawnWaitTimeout extends Error {
  /**
   * @param {import('node:child_process').SpawnSyncReturns<string>} spawn
   * @param {number} timeout
   */
  constructor(spawn, timeout) {
    super(`spawnwait timeout ${timeout}ms`);
    this.spawn = spawn;
  }
}

/**
 * Like https://nodejs.org/api/child_process.html#child_processspawnsynccommand-args-options
 * but supports await and custom termination criterias.
 *
 * @param {string} command
 * @param {string[]} args
 * @param {import('.').SpawnWait} wait
 * @returns {Promise<import('node:child_process').SpawnSyncReturns<string>>}
 * @throws {SpawnWaitTimeout} if a timeout occurs based on wait.timeout
 */
export default async function spawnwait(command, args, wait = {}) {
  return new Promise((resolve, reject) => {
    DEBUG && console.debug('spawnwait:', command, args.join(' '));
    const p = spawn(command, args, OPTIONS);
    /** @type {import('node:child_process').SpawnSyncReturns<string>} */
    const result = {
      pid: -1,
      output: [],
      stdout: '',
      stderr: '',
      status: null,
      signal: null,
      error: undefined,
    };
    /** @type {NodeJS.Timeout | undefined} */
    let timeout;
    function done() {
      if (timeout) clearTimeout(timeout);
      result.output = ['', result.stdout, result.stderr];
      resolve(result);
    }
    function exited() {
      if (result.error) reject(result.error);
      if (result.status !== 0) reject(result);
      done();
    }
    function waitdone() {
      if (wait.kill) {
        /** @type {NodeJS.Signals} */
        let signal = KILL_DEFAULT;
        if (wait.kill !== true) signal = wait.kill;
        if (!p.kill(signal)) {
          throw new Error('kill failed');
        }
      }
      result.output = ['', result.stdout, result.stderr];
      resolve(result);
    }
    if (wait.timeout) {
      timeout = setTimeout(() => {
        /** @type {NodeJS.Signals} */
        let signal = KILL_DEFAULT;
        if (wait.kill && wait.kill !== true) signal = wait.kill;
        if (!p.kill(signal)) {
          throw new Error('kill failed');
        }
        result.output = ['', result.stdout, result.stderr];
        reject(new SpawnWaitTimeout(result, wait.timeout || -1));
      }, wait.timeout);
    }
    p.stdout.on('data', (data) => {
      result.stdout += data.toString();
      if (wait.stdout && wait.stdout.test(result.stdout)) waitdone();
      if (wait.passhthrough) process.stdout.write(data);
    });
    p.stderr.on('data', (data) => {
      result.stderr += data.toString();
      if (wait.stderr && wait.stderr.test(result.stderr)) waitdone();
      if (wait.passhthrough) process.stderr.write(data);
    });
    p.on('exit', (exitCode, signalCode) => {
      result.status = exitCode;
      result.signal = signalCode;
      exited();
    });
    p.on('error', (err) => {
      result.error = err;
      exited();
    });
  });
}
