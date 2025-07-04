// sshClient.js
import { Client } from "ssh2";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

const sshConfig = {
  host: process.env.VM_HOST,
  port: 22, // Default SSH port
  username: process.env.VM_USER,
  // Use path.resolve to ensure the privateKey path is absolute
  privateKey: fs.readFileSync(path.resolve(process.env.VM_KEY_PATH)),
};

// 🔹 Create reusable function to connect and run a command
function runSshCommand(command) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn
      .on("ready", () => {
        conn.exec(command, (err, stream) => {
          if (err) {
            conn.end(); // Ensure connection is closed on error
            return reject(err);
          }
          let data = "";
          stream
            .on("data", (chunk) => (data += chunk.toString()))
            .on("close", (code, signal) => {
              conn.end();
              if (code === 0) { // Command executed successfully
                resolve(data.trim()); // Trim to remove trailing newlines
              } else {
                reject(new Error(`Command exited with code ${code}: ${data}`));
              }
            })
            .stderr.on("data", (errChunk) => {
              // Capture stderr for better error reporting
              reject(new Error(errChunk.toString()));
            });
        });
      })
      .on("error", (err) => reject(err))
      .connect(sshConfig);
  });
}

// 🔹 Read entire file content over SFTP
export function getFileContent(remotePath) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn
      .on("ready", () => {
        conn.sftp((err, sftp) => {
          if (err) {
            conn.end();
            return reject(err);
          }
          const stream = sftp.createReadStream(remotePath);
          let data = "";
          stream.on("data", (chunk) => (data += chunk));
          stream.on("end", () => {
            conn.end();
            resolve(data.toString()); // Resolve with the full content
          });
          stream.on("error", (err) => {
            conn.end();
            reject(err);
          });
        });
      })
      .on("error", (err) => reject(err))
      .connect(sshConfig);
  });
}

// 🔹 Overwrite entire file content over SFTP (CAUTION: This is NOT atomic)
export function overwriteFileContent(remotePath, content) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn
      .on("ready", () => {
        conn.sftp((err, sftp) => {
          if (err) {
            conn.end();
            return reject(err);
          }
          // Use 'w' flag to overwrite the file
          const stream = sftp.createWriteStream(remotePath, { flags: 'w' });
          stream.write(content, (writeErr) => {
            if (writeErr) {
              conn.end();
              return reject(writeErr);
            }
            stream.end(); // Close the stream to finish writing
          });
          stream.on("close", () => {
            conn.end();
            resolve();
          });
          stream.on("error", (err) => {
            conn.end();
            reject(err);
          });
        });
      })
      .on("error", (err) => reject(err))
      .connect(sshConfig);
  });
}

// 🔹 Read only the last N lines of a file over SFTP (more efficient for large logs)
export function getLastCsvLines(remotePath, numLines) {
  return runSshCommand(`tail -n ${numLines} ${remotePath}`);
}

// 🔹 Append to a file remotely (useful for new feedback/complaints if not using Firestore)
// This function is kept for potential future use or if you add new entry forms.
export function appendToFile(remotePath, content) {
  // Escape single quotes within the content for shell command safety
  const escapedContent = content.replace(/'/g, `'\\''`);
  return runSshCommand(`echo '${escapedContent}' >> ${remotePath}`);
}

// Removed: listFilesInDirectory as per user request
