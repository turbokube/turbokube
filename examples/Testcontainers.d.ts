import { PathLike } from "fs";
import { FileHandle } from "fs/promises";
import { Buffer } from "buffer";
import { SpawnWaitForOutput } from "../spawnwait";

export interface StartOptions {

  image: string

}

export interface UploadOptions {

  /**
   * Buffer to upload content, string to upload a local file
   */
  local: Buffer | string

  /**
   * Destination path in container, no trailing slash
   */
  containerPath: string

}

export interface Container {

  async uploadFile(options: UploadOptions): void

  async logs(wait?: SpawnWaitForOutput): Promise<string>

  async stop(): Promise<void>

}
