import fs from "fs-extra";
import path from "path";
import * as vscode from "vscode";
import os from "os";
import { common } from "../utils/common";
import https from "https";
import { pipeline } from "stream";
import { promisify } from "util";
import { createWriteStream } from "fs";
import * as tar from "tar";
import unzip from "unzipper";

const streamPipeline = promisify(pipeline);

export default function (context: vscode.ExtensionContext) {
  let pathToNode = common.getNodePath(context);
  const extensionRoot = common.getExtensionRoot(context);

  if (!fs.pathExists(pathToNode)) {
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

    fs.remove(localNodeArchive);
    fs.ensureDirSync(localNodePath, {
      mode: 0o755,
    });

    vscode.window
      .showInformationMessage(
        "Eureka+ requires some dependencies to run.\n(Node.js & Playwright)\n\nThese are essential for the functionality of the extension.",
        {
          modal: true,
          detail: "Please do not close VSCode during installation and setup",
        },
        "Install & Setup",
        "No"
      )
      .then((selection) => {
        if (selection === "Install & Setup") {
          vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: "Eureka+",
              cancellable: false,
            },
            async (progress) => {
              progress.report({
                message: `Downloading Node.js ${nodeVersion}...`,
              });

              try {
                if (!fs.existsSync(localNodeArchive)) {
                  // Download the Node.js binary
                  await new Promise<void>((resolve, reject) => {
                    https
                      .get(nodeDownloadUrl, { timeout: 120000 }, (response) => {
                        if (response.statusCode !== 200) {
                          reject(
                            new Error(
                              `Failed to download file: ${response.statusCode}`
                            )
                          );
                          return;
                        }

                        response.on("data", (chunk) => {
                          downloadedSize += chunk.length;
                          const percentage = (
                            (downloadedSize / totalSize) *
                            100
                          ).toFixed(0);
                          progress.report({
                            message: `Downloading Node.js: ${percentage}% completed`,
                          });
                        });

                        const totalSize = parseInt(
                          response.headers["content-length"] || "0",
                          10
                        );
                        let downloadedSize = 0;

                        streamPipeline(
                          response,
                          createWriteStream(localNodeArchive)
                        )
                          .then(resolve)
                          .catch(reject);
                      })
                      .on("error", reject);
                  });
                }

                progress.report({ message: "Extracting Node.js binary..." });

                // Extract the downloaded archive
                if (
                  nodeFileName.endsWith(".tar.gz") ||
                  nodeFileName.endsWith(".tar.xz")
                ) {
                  console.log({ localNodeArchive, localNodePath });
                  await tar.extract({
                    file: localNodeArchive,
                    cwd: localNodePath,
                    strip: 1,
                  });
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
                vscode.window.showErrorMessage(
                  `Error downloading Node.js: ${error}`
                );
              }
            }
          );
        } else {
          vscode.window.showInformationMessage(
            "Eureka+ will not be functional now. You can invoke this setup again from the Eureka+ Explorer View."
          );
        }
      });

    pathToNode = common.getNodePath(context);
  }

  // SETUP PLAYWRIGHT
  if (fs.pathExistsSync(pathToNode)) {
    // check if ".bin" folder exists
    const binFolderPath = path.join(extensionRoot, "node_modules", ".bin");
    if (!fs.existsSync(binFolderPath)) {
      // run npm install in extension root
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Eureka+",
          cancellable: false,
        },
        async (progress) => {
          progress.report({ message: "Setting up Playwright..." });

          const installCommand = `${pathToNode} ${common.getNPM(
            context
          )} install`;
          await common.runProcess({
            command: installCommand,
            cwd: extensionRoot,
            onError({ error }) {
              vscode.window.showErrorMessage(
                `Error setting up Playwright: ${error.message}`
              );
            },
            onExit({ code }) {
              if (code === 0) {
                vscode.window.showInformationMessage(
                  `Playwright setup successfully`
                );
              } else {
                vscode.window.showErrorMessage(
                  `Error setting up Playwright: ${code}`
                );
              }
            },
          });
        }
      );
    }
  }

  if (fs.pathExistsSync(pathToNode)) {
    // Path to the browsers folder
    const browsersPath = path.join(extensionRoot, "browsers");

    // List of required browsers
    const requiredBrowsers = ["chromium", "webkit", "firefox", "ffmpeg"];

    // Check if all required browsers are installed
    const installedBrowsers = fs.existsSync(browsersPath)
      ? fs
          .readdirSync(browsersPath)
          .filter((folderName) =>
            requiredBrowsers.some((browser) => folderName.startsWith(browser))
          )
      : [];

    const areBrowsersInstalled = requiredBrowsers.every((browser) =>
      installedBrowsers.some((folderName) => folderName.startsWith(browser))
    );

    if (areBrowsersInstalled) {
      console.log("All required Playwright browsers are already installed.");
      return;
    }

    vscode.window
      .showInformationMessage(
        "Playwright browsers are required to run the tests.\n\nThese are essential for the functionality of the extension.",
        "Install",
        "No"
      )
      .then((selection) => {
        if (selection === "Install") {
          // Install browser binaries
          const browserInstallCommand = `${common.getNodePath(
            context
          )} ${common.getPlaywrightCLIPath(context)} install`;
          const terminal = vscode.window.createTerminal({
            name: "Eureka+ Install Browsers",
            env: {
              PLAYWRIGHT_BROWSERS_PATH: path.join(extensionRoot, "browsers"),
            },
          });
          terminal.show();
          terminal.sendText(browserInstallCommand);
        } else {
          vscode.window.showInformationMessage(
            "Eureka+ will not be functional now. You can invoke this setup again from the Eureka+ Explorer View."
          );
        }
      });
  }
}
