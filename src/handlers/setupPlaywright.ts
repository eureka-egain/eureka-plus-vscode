import * as vscode from "vscode";
import fs from "fs-extra";
import { common } from "./common";
import path from "path";

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

        const installCommand = `npm install`;
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
