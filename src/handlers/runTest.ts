import path from "path";
import * as vscode from "vscode";
import { common } from "../utils/common";
import { movers } from "../utils/movers";

export default async function ({
  context,
  testFileName,
  testFolderPath,
}: {
  context: vscode.ExtensionContext;
  testFolderPath: string;
  testFileName: string;
}) {
  const copyTestFolderResult = movers.copyTestFolderFromWorkspaceToExtension(
    context,
    testFolderPath
  );

  if (copyTestFolderResult) {
    const command = `npx playwright test ${common.formatPathForPW(
      path.join(copyTestFolderResult.destinationFolder, testFileName)
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
