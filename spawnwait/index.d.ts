
import { SpawnSyncReturns } from "child_process"

export class SpawnWaitTimeout extends Error {

  spawn: SpawnSyncReturns<string>

}

export interface SpawnWaitForOutput {

  stdout?: RegExp

  stderr?: RegExp

  /**
   * Milliseconds to wait before giving up.
   * If the process is still running at timeout, kill is attempted.
   * (we could enable override of this behavior by allowing kill === false)
   */
  timeout?: number

  /**
   * Kill the process when wait is satisfied,
   * (if falsy the promise resolves but the process keeps running)
   */
  kill?: true | NodeJS.Signals

}

export interface SpawnWait extends SpawnWaitForOutput {

  /**
   * True to pass through stdout and stderr
   */
  passhthrough?: true

}
