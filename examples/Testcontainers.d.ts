import { SpawnWaitStdout } from "../spawnwait"

export interface StartOptions {

  image: string

}

export interface UploadOptions {

  pathLocal: string

  pathInContainer: string

}

export interface Container {

  async uploadFile(options: UploadOptions): void

  async logs(wait?: SpawnWaitStdout): Promise<string>

  async stop(): Promise<void>

}
