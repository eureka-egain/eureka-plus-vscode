import * as vscode from "vscode";
import * as os from "os";
import { paths } from "../../utils/paths";
import { common } from "../../utils/common";

export default async function ({ workspaceRoot }: { workspaceRoot: string }) {
  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Eureka+",
      cancellable: false,
    },
    async (progress) => {
      progress.report({
        message: "Installing browsers for Playwright...",
      });

      const browserInstallCommand = `${paths.getNodePath()} ${paths.getPlaywrightCLIPath(
        workspaceRoot
      )} install`;
      await common.runProcess({
        // env with the path to the browsers folder
        // is setup in the common.ts file
        command: browserInstallCommand,
        cwd: paths.getExtensionUserFolder(),
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

        const depsInstallCommand = `${paths.getNodePath()} ${paths.getPlaywrightCLIPath(
          workspaceRoot
        )} install-deps`;
        await common.runProcess({
          command: depsInstallCommand,
          cwd: paths.getExtensionRuntimeFolder(workspaceRoot),
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
    }
  );
}
