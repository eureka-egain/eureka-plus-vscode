import * as vscode from "vscode";
import fs, { createWriteStream } from "fs-extra";
import path, { resolve } from "path";
import https from "https";
import AdmZip from "adm-zip";
import { pipeline } from "stream";
import { promisify } from "util";
import * as os from "os";
import { paths } from "../../utils/paths";
import * as tar from "tar";
import { common } from "../../utils/common";
import {
  playwrightLibraryPath,
  playwrightTestLibraryPath,
} from "../../utils/constants";

const streamPipeline = promisify(pipeline);

export default async function ({
  progress,
}: {
  progress: vscode.Progress<{ message?: string; increment?: number }>;
}) {
  // ----------------------------------------
  progress.report({
    message: "Downloading Node.js...",
    increment: 0,
  });
  // ----------------------------------------
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
    return false;
  }

  const nodeDownloadUrl = `${nodeBaseUrl}/${nodeFileName}`;
  const localNodePath = path.join(paths.getExtensionUserFolder(), "node");
  const localNodeArchive = path.join(localNodePath, nodeFileName);
  // ----------------------------------------
  try {
    if (fs.existsSync(localNodePath)) {
      fs.rmSync(localNodePath, { recursive: true, force: true });
    }
    fs.ensureDirSync(localNodePath);

    await new Promise<void>((resolve, reject) => {
      https
        .get(nodeDownloadUrl, { timeout: 120000 }, (response) => {
          if (response.statusCode !== 200) {
            reject(
              new Error(`Failed to download file: ${response.statusCode}`)
            );
            return;
          }

          response.on("data", (chunk) => {
            downloadedSize += chunk.length;
            const percentage = ((downloadedSize / totalSize) * 100).toFixed(0);
            progress.report({
              message: "Downloading Node.js...",
              increment: 100 - parseInt(percentage, 10),
            });
          });

          const totalSize = parseInt(
            response.headers["content-length"] || "0",
            10
          );
          let downloadedSize = 0;

          streamPipeline(response, createWriteStream(localNodeArchive))
            .then(resolve)
            .catch(reject);
        })
        .on("error", reject);
    });

    progress.report({
      message: "Extracting downloaded Node.js binary...",
      increment: undefined,
    });

    // Extract the downloaded archive
    if (nodeFileName.endsWith(".tar.gz") || nodeFileName.endsWith(".tar.xz")) {
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

    // Clean up the downloaded archive
    fs.remove(localNodeArchive);

    // Set the permissions for the extracted files
    const extractedFiles = fs.readdirSync(localNodePath);
    for (const file of extractedFiles) {
      fs.chmodSync(path.join(localNodePath, file), 0o755);
    }

    // Initialize npm in the extracted folder
    const npmPath = paths.getNPMPath();
    const pathToNode = paths.getNodePath();
    fs.ensureDirSync(paths.getExtensionUserRuntimeFolder());

    progress.report({
      message: "Setup up playwright...",
    });

    await common.runProcess({
      // env with the path to the browsers folder
      // is setup in the common.ts file
      command: `${pathToNode} ${npmPath} init -y && ${pathToNode} ${npmPath} install @playwright/test@${playwrightTestLibraryPath} playwright@${playwrightLibraryPath}`,
      cwd: paths.getExtensionUserRuntimeFolder(),
      onStderr(props) {
        console.log("npm stderr:", props.data);
        props.resolve();
      },
      onError(props) {
        console.error("npm error:", props.error);
        props.resolve();
      },
      onExit({ code, resolve }) {
        if (code === 0) {
          vscode.window.showInformationMessage(
            `Node.js ${nodeVersion} setup successfully`
          );
          resolve();
        } else {
          vscode.window.showErrorMessage(`Error initializing npm: ${code}`);
          resolve();
        }
      },
    });

    return true;
  } catch (error) {
    vscode.window.showErrorMessage(`Error downloading Node.js: ${error}`);
    return false;
  }
}
