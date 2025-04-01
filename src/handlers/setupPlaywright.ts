import fs from "fs-extra";
import path from "path";
import * as vscode from "vscode";
import os from "os";
import { common } from "../utils/common";
import https from "https";
import { pipeline } from "stream";
import { promisify } from "util";
import { createWriteStream } from "fs";
import tar from "tar-fs";
import unzip from "unzipper";

const streamPipeline = promisify(pipeline);

export default function (context: vscode.ExtensionContext) {
  const extensionRoot = common.getExtensionRoot(context);

  // Determine the user's OS and architecture
  const platform = os.platform();
  const arch = os.arch();
  const nodeVersion = "v22.14.0";
  const nodeBaseUrl = `https://nodejs.org/dist/${nodeVersion}`;

  let nodeFileName: string;
  if (platform === "darwin" && arch === "x64") {
    nodeFileName = `node-${nodeVersion}-darwin-x64.tar.gz`;
  } else if (platform === "darwin" && arch === "arm64") {
    nodeFileName = `node-${nodeVersion}-darwin-arm64.tar.gz`;
  } else if (platform === "linux" && arch === "x64") {
    nodeFileName = `node-${nodeVersion}-linux-x64.tar.xz`;
  } else if (platform === "win32" && arch === "x64") {
    nodeFileName = `node-${nodeVersion}-win-x64.zip`;
  } else {
    vscode.window.showErrorMessage(
      `Unsupported platform/architecture: ${platform}/${arch}`
    );
    return;
  }

  const nodeDownloadUrl = `${nodeBaseUrl}/${nodeFileName}`;
  const localNodePath = path.join(extensionRoot, "utils", "node");
  const localNodeArchive = path.join(localNodePath, nodeFileName);

  // Ensure the local nodejs folder exists
  fs.ensureDirSync(localNodePath, {
    mode: 0o755,
  });

  // Check if Node.js is already downloaded
  if (!fs.existsSync(localNodeArchive)) {
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Eureka+",
        cancellable: false,
      },
      async (progress) => {
        progress.report({ message: "Downloading Node.js prebuilt binary..." });

        try {
          // Download the Node.js binary
          await new Promise<void>((resolve, reject) => {
            https
              .get(nodeDownloadUrl, { timeout: 60000 }, (response) => {
                if (response.statusCode !== 200) {
                  reject(
                    new Error(`Failed to download file: ${response.statusCode}`)
                  );
                  return;
                }
                streamPipeline(response, createWriteStream(localNodeArchive))
                  .then(resolve)
                  .catch(reject);
              })
              .on("error", reject);
          });

          progress.report({ message: "Extracting Node.js binary..." });

          // Extract the downloaded archive
          if (
            nodeFileName.endsWith(".tar.gz") ||
            nodeFileName.endsWith(".tar.xz")
          ) {
            fs.createReadStream(localNodeArchive).pipe(
              tar.extract(localNodePath)
            );
          } else if (nodeFileName.endsWith(".zip")) {
            const directory = await unzip.Open.file(localNodeArchive);
            await directory.extract({ path: localNodePath });
          }

          vscode.window.showInformationMessage(
            `Node.js ${nodeVersion} setup successfully`
          );

          // Clean up the downloaded archive
          fs.remove(localNodeArchive);

          // Set the permissions for the extracted files
          const extractedFiles = fs.readdirSync(localNodePath);
          for (const file of extractedFiles) {
            fs.chmodSync(path.join(localNodePath, file), 0o755);
          }
        } catch (error) {
          vscode.window.showErrorMessage(`Error downloading Node.js: ${error}`);
        }
      }
    );
  } else {
    vscode.window.showInformationMessage(
      `Node.js ${nodeVersion} is already downloaded`
    );
  }
}
