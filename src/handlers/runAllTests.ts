import path from "path";
import * as vscode from "vscode";
import { common } from "../utils/common";
import { movers } from "../utils/movers";
import { paths } from "../utils/paths";

export default async function () {
  const workspaceRoot = paths.getWorkspaceRoot();
  const testsFolderName = common.getExtensionSettings().testsFolderName;

  if (workspaceRoot) {
    const pathToTestFolder = path.join(workspaceRoot, testsFolderName);
    const copyTestFolderResult =
      movers.copyTestFolderFromWorkspaceToRuntime(pathToTestFolder);

    if (copyTestFolderResult) {
      const command = `${paths.getNodePath()} ${paths.getPlaywrightCLIPath()} test ${common.formatPathForPW(
        copyTestFolderResult.destinationFolder
      )} --ui`;

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
              if (code === 0) {
                copyTestFolderResult.cleanup();
                // move generated test results back to workspace
                movers.moveTestResultsFolderToWorkspace();
              } else {
                vscode.window.showErrorMessage(`Error: ${code}`);
              }
              resolve();
            },
            onError: ({ error, resolve }) => {
              vscode.window.showErrorMessage(`Error: ${error}`);
              copyTestFolderResult.cleanup();
              resolve();
            },
            onStderr: ({ data, resolve }) => {
              vscode.window.showErrorMessage(`Error: ${data}`);
              copyTestFolderResult.cleanup();
              resolve();
            },
            cwd: paths.getExtensionUserRuntimeFolder(),
          });
        }
      );
    }
  }
}
