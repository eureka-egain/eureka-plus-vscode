import * as vscode from "vscode";
import { common } from "../utils/common";
import { movers } from "../utils/movers";
import path from "path";

export default async function ({
  context,
  folderPath,
}: {
  context: vscode.ExtensionContext;
  folderPath: string;
}) {
  const copyTestFolderResult = movers.copyTestFolderFromWorkspaceToExtension(
    context,
    folderPath
  );

  if (copyTestFolderResult) {
    const command = `npx playwright test ${common.formatPathForPW(
      copyTestFolderResult.destinationFolder
    )} --ui`;
    console.log({ command2: command });

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
