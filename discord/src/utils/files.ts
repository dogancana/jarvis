import fs from "fs";
import path from "path";

/**
 * Deletes all files with the specified extension in a directory
 * @param directory - The directory path
 * @param extension - The file extension to filter
 */
export function deleteFilesWithExtension(directory: string, extension: string) {
  fs.readdir(directory, (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(directory, file);
      const fileExtension = path.extname(file);

      if (fileExtension === extension) {
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error("Error deleting file:", err);
          } else {
            console.log("File deleted:", filePath);
          }
        });
      }
    });
  });
}

export function writeFileContent(filePath: string, content: string) {
  fs.writeFile(filePath, content, (err) => {
    if (err) {
      console.error("Error writing file:", err);
    } else {
      console.log("File updated:", filePath);
    }
  });
}
