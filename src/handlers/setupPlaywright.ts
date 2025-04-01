import fs from "fs-extra";
import path from "path";
import * as vscode from "vscode";
import { common } from "../utils/common";

export default function (context: vscode.ExtensionContext) {
  const extensionRoot = common.getExtensionRoot(context);

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

        // Path to npm (relative to VS Code's Node.js binary)
        const npmPath = path.join(
          vscode.env.appRoot,
          "node_modules",
          "npm",
          "bin",
          "npm-cli.js"
        );

        const installCommand = `${common.getNPM(context)} install`;
        return common.runProcess({
          command: installCommand,
          cwd: extensionRoot,
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
              resolve();
            } else {
              vscode.window.showErrorMessage(
                `Error setting up Playwright: ${code}`
              );
              resolve();
            }
          },
        });
      }
    );
  }
}
