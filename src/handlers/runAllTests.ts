import path from "path";
import * as vscode from "vscode";
import { common } from "../utils/common";
import { paths } from "../utils/paths";

export default async function () {
  const workspaceRoot = paths.getWorkspaceRoot();
  const testsFolderName = common.getExtensionSettings().testsFolderName;

  if (workspaceRoot) {
    const pathToTestFolder = path.join(workspaceRoot, testsFolderName);

    if (pathToTestFolder) {
      const command = `"${paths.getNodePath()}" "${paths.getPlaywrightCLIPath(
        workspaceRoot
      )}" test "${common.formatPathForPW(pathToTestFolder)}" --ui`;

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Eureka+",
          cancellable: true,
        },
        (progress) => {
          progress.report({ message: "Running test..." });

          return common.runProcess({
            command: command,
            args: ["--ui"],
            onExit: ({ code, resolve }) => {
              if (code !== 0) {
                vscode.window.showErrorMessage(`Error: ${code}`);
              }
              resolve();
            },
            onError: ({ error, resolve }) => {
              vscode.window.showErrorMessage(`Error: ${error}`);
              resolve();
            },
            onStderr: ({ data, resolve }) => {
              vscode.window.showErrorMessage(`Error: ${data}`);
              resolve();
            },
            cwd: paths.getExtensionRuntimeFolder(workspaceRoot),
          });
        }
      );
    }
  }
}
