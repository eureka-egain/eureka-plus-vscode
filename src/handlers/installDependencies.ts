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
import AdmZip from "adm-zip";
import { secretStorageGeminiAPITokenKey } from "../utils/constants";
import { paths } from "../utils/paths";

const streamPipeline = promisify(pipeline);

const doesNodePathExists = (context: vscode.ExtensionContext) => {
  const nodePath = paths.getNodePath(context);
  switch (os.platform()) {
    case "win32":
      return fs.existsSync(nodePath);
    default:
      return fs.pathExistsSync(nodePath);
  }
};

const getGeminiAPIKey = async (context: vscode.ExtensionContext) => {
  // Retrieve the API key from secure storage
  let apiKey = await context.secrets.get(secretStorageGeminiAPITokenKey);

  // If the API key is not found, prompt the user to enter it
  if (!apiKey) {
    apiKey = await vscode.window.showInputBox({
      prompt: "Enter your Gemini AI API Key",
      placeHolder: "This key is required to use GenAI features",
      ignoreFocusOut: true,
      password: true,
    });

    if (!apiKey) {
      vscode.window.showErrorMessage(
        "GenAI features will not be functional now. You can invoke this setup again from the Eureka+ Explorer View."
      );
      return;
    }

    // Store the API key securely
    await context.secrets.store(secretStorageGeminiAPITokenKey, apiKey);
    vscode.window.showInformationMessage("API Key saved securely.");
  } else {
    console.log("Gemini API Key already exists.");
  }
};

const installBrowsers = async (context: vscode.ExtensionContext) => {
  const extensionRoot = paths.getExtensionRoot(context);

  if (doesNodePathExists(context)) {
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
      getGeminiAPIKey(context);
      return;
    }

    vscode.window
      .showInformationMessage(
        "Playwright browsers are required to run the tests.\n\nThis process can take some time (~10m).",
        "Install",
        "No"
      )
      .then((selection) => {
        if (selection === "Install") {
          // Install browser binaries
          const browserInstallCommand = `${paths.getNodePath(
            context
          )} ${paths.getPlaywrightCLIPath(context)} install`;
          vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: "Eureka+",
              cancellable: false,
            },
            async (progress) => {
              progress.report({ message: "Installing browser binaries" });

              const extensionRoot = paths.getExtensionRoot(context);
              await common.runProcess({
                // env with the path to the browsers folder
                // is setup in the common.ts file
                command: browserInstallCommand,
                cwd: extensionRoot,
                context,
                onError({ error, resolve }) {
                  console.log(error);
                  vscode.window.showErrorMessage(
                    `Error installing browsers: ${error.message}`
                  );
                  resolve();
                },
                onExit({ code, resolve }) {
                  if (code === 0) {
                    vscode.window.showInformationMessage(
                      `Browser binaries installed successfully`
                    );
                    getGeminiAPIKey(context);
                    resolve();
                  } else {
                    vscode.window.showErrorMessage(
                      `Error installing browsers: ${code}`
                    );
                    resolve();
                  }
                },
              });

              // Install dependencies only if the OS is Linux
              if (os.platform() === "linux") {
                progress.report({
                  message: "Installing Linux dependencies...",
                });

                const depsInstallCommand = `${paths.getNodePath(
                  context
                )} ${paths.getPlaywrightCLIPath(context)} install-deps`;
                await common.runProcess({
                  command: depsInstallCommand,
                  context,
                  onStderr: ({ data, resolve }) => {
                    vscode.window.showErrorMessage(`Stderr: ${data}`);
                    resolve();
                  },
                  onError({ error, resolve }) {
                    vscode.window.showErrorMessage(
                      `Error installing dependencies: ${error.message}`
                    );
                    resolve();
                  },
                  onExit({ code, resolve }) {
                    if (code === 0) {
                      vscode.window.showInformationMessage(
                        `Linux dependencies installed successfully`
                      );
                    } else {
                      vscode.window.showErrorMessage(
                        `Error installing dependencies: ${code}`
                      );
                    }
                    resolve();
                  },
                });
              }
              return;
            }
          );
        } else {
          vscode.window.showInformationMessage(
            "Eureka+ will not be functional now. You can invoke this setup again from the Eureka+ Explorer View."
          );
        }
      });
  }
};

const setupPlaywright = async (context: vscode.ExtensionContext) => {
  const pathToNode = paths.getNodePath(context);
  const extensionRoot = paths.getExtensionRoot(context);

  if (doesNodePathExists(context)) {
    // check if ".bin" folder exists
    const binFolderPath = path.join(extensionRoot, "node_modules", ".bin");
    if (!fs.pathExistsSync(binFolderPath) || true) {
      // run npm install in extension root
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Eureka+",
          cancellable: false,
        },
        async (progress) => {
          progress.report({ message: "Setting up Playwright..." });

          const installCommand = `${pathToNode} ${paths.getNPMPath()} install`;
          console.log("Running command:", installCommand);

          return common.runProcess({
            command: installCommand,
            cwd: extensionRoot,
            context,
            onStdout({ data }) {
              progress.report({
                message: `Setting up Playwright: ${data}`,
              });
              console.log(data);
            },
            onError({ error, resolve }) {
              vscode.window.showErrorMessage(
                `Error setting up Playwright: ${error.message}`
              );
              resolve();
            },
            onExit({ code, resolve }) {
              if (code === 0) {
                vscode.window.showInformationMessage(
                  `Playwright setup successfully`
                );
                installBrowsers(context);
              } else {
                vscode.window.showErrorMessage(
                  `Error setting up Playwright: ${code}`
                );
              }
              resolve();
            },
          });
        }
      );
    } else {
      console.log("Playwright is already setup.");
      installBrowsers(context);
    }
  }
};

export default async function (context: vscode.ExtensionContext) {
  const extensionRoot = paths.getExtensionRoot(context);

  if (!doesNodePathExists(context)) {
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

    const userPermission = await vscode.window.showInformationMessage(
      "Eureka+ requires some dependencies to run.\n(Node.js & Playwright)\n\nThese are essential for the functionality of the extension.",
      {
        modal: true,
        detail: "Please do not close VSCode during installation and setup",
      },
      "Install & Setup"
    );

    if (userPermission === "Install & Setup") {
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
              await tar.extract({
                file: localNodeArchive,
                cwd: localNodePath,
                strip: 1,
              });
            } else if (nodeFileName.endsWith(".zip")) {
              const zip = new AdmZip(localNodeArchive);
              const entries = zip.getEntries();

              // Extract only the contents of the folder inside the zip
              entries.forEach((entry) => {
                const entryNameParts = entry.entryName.split("/");

                // Skip the top-level folder and adjust the path
                if (entryNameParts.length > 1) {
                  const relativePath = entryNameParts.slice(1).join("/");
                  const targetPath = path.join(localNodePath, relativePath);

                  if (entry.isDirectory) {
                    fs.ensureDirSync(targetPath);
                  } else {
                    fs.ensureDirSync(path.dirname(targetPath));
                    fs.writeFileSync(targetPath, entry.getData());
                  }
                }
              });
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

            setupPlaywright(context);
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
  } else {
    console.log("Node.js is already installed.");
    setupPlaywright(context);
  }
}
