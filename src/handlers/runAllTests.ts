import path from "path";
import * as vscode from "vscode";
import { common } from "../utils/common";
import { movers } from "../utils/movers";

export default async function ({
  context,
}: {
  context: vscode.ExtensionContext;
}) {
  const workspaceRoot = common.getWorkspaceRoot();
  const testsFolderName = common.getExtensionSettings().testsFolderName;

  if (workspaceRoot) {
    const pathToTestFolder = path.join(workspaceRoot, testsFolderName);
    const copyTestFolderResult = movers.copyTestFolderFromWorkspaceToExtension(
      context,
      pathToTestFolder
    );

    if (copyTestFolderResult) {
      const command = `${common.getNodePath(
        context
      )} ${common.getPlaywrightCLIPath(context)} test ${common.formatPathForPW(
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
            context,
            args: ["--ui"],
            onExit: ({ code, resolve }) => {
              if (code === 0) {
                copyTestFolderResult.cleanup();
                // move generated test results back to workspace
                movers.moveTestResultsFolderToWorkspace(context);
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
            cwd: common.getExtensionRoot(context),
          });
        }
      );
    }
  }
}
