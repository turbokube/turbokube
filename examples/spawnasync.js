// @ts-check

import { spawn } from "node:child_process";

/**
 * @type {import('node:child_process').SpawnOptionsWithoutStdio}
 */
const OPTIONS = {
  shell: false,
  stdio: 'pipe',
};

/**
 * We like the return value from
 * https://nodejs.org/api/child_process.html#child_processspawnsynccommand-args-options
 * but want to use await.
 * @param {string} command
 * @param {string[]} args
 * @returns {Promise<import('node:child_process').SpawnSyncReturns<string>>}
 */
export default async function sh(command, args) {
  return new Promise((resolve, reject) => {
    console.log('spawning', command, args, OPTIONS)
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
    function done() {
      console.log('spawn done', command, args, OPTIONS, result.status);
      result.output = ['', result.stdout, result.stderr];
      if (result.error) reject(result.error);
      if (result.status !== 0) reject(result);
      resolve(result);
    }
    p.stdout.on('data', (data) => {
      result.stdout += data.toString();
      process.stdout.write(data);
    });
    p.stderr.on('data', (data) => {
      result.stderr += data.toString();
      process.stderr.write(data);
    });
    p.on('exit', (exitCode, signalCode) => {
      result.status = exitCode;
      result.signal = signalCode;
      done();
    });
    p.on('error', (err) => {
      result.error = err;
      done();
    });
  });
}
