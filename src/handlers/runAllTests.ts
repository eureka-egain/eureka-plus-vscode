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
      const command = `npx playwright test ${common.formatPathForPW(
        copyTestFolderResult.destinationFolder
      )} --ui`;

      await common.runProcess({
        command: command,
        args: ["--ui"],
        onExit: ({ resolve }) => {
          copyTestFolderResult.cleanup();
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

      // move generated test results back to workspace
      movers.moveTestResultsFolderToWorkspace(context);
    }
  }
}
