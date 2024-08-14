import { deleteFilesWithExtension } from "./files";

/**
 * Clears all recordings from the recordings folder
 */
export function clearRecordings() {
  deleteFilesWithExtension("./recordings", ".ogg");
}
