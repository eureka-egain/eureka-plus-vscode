import * as os from "os";
import * as vscode from "vscode";
import { common } from "../utils/common";
import path from "path";

export default function (context: vscode.ExtensionContext) {
  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Eureka+",
      cancellable: false,
    },
    async (progress) => {
      progress.report({ message: "Installing browser binaries" });

      const extensionRoot = common.getExtensionRoot(context);
      vscode.window.showInformationMessage(`Extension root: ${extensionRoot}`);

      // Install browser binaries
      const browserInstallCommand = `${common.getNPX(context)} playwright install`;
      return common.runProcess({
        command: browserInstallCommand,
        cwd: extensionRoot,
        onStderr: ({ data, resolve }) => {
          vscode.window.showErrorMessage(`Stderr: ${data}`);
          resolve();
        },
        onError: async ({ error, resolve }) => {
          console.log(error);
          vscode.window.showErrorMessage(
            `Error installing browsers: ${error.message}`
          );
          resolve();
        },
        onExit: async ({ code, resolve }) => {
          if (code === 0) {
            vscode.window.showInformationMessage(
              `Browser binaries installed successfully`
            );

            // Install dependencies only if the OS is Linux
            if (os.platform() === "linux") {
              progress.report({ message: "Installing Linux dependencies..." });

              const depsInstallCommand = `npx playwright install-deps`;
              await common.runProcess({
                command: depsInstallCommand,
                onStderr: ({ data }) => {
                  vscode.window.showErrorMessage(`Stderr: ${data}`);
                },
                onError({ error }) {
                  vscode.window.showErrorMessage(
                    `Error installing dependencies: ${error.message}`
                  );
                },
                onExit({ code }) {
                  if (code === 0) {
                    vscode.window.showInformationMessage(
                      `Linux dependencies installed successfully`
                    );
                  } else {
                    vscode.window.showErrorMessage(
                      `Error installing dependencies: ${code}`
                    );
                  }
                },
              });
            }

            resolve();
          } else {
            vscode.window.showErrorMessage(
              `Error installing browsers: ${code}`
            );
            resolve();
          }
        },
      });
    }
  );
}
