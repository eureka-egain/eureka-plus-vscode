/**
 * Notes about fs move and copy (applies to both).
 * Specifying the *new folder name* in the destination path
 * will help create a new folder with the same name as the source folder.
 *
 * By default fs will copy all files within the source folder (not the source folder itself)
 * to the destination path.
 * If the destination folder does not exist, it will be created.
 */

import * as vscode from "vscode";
import fs from "fs-extra";
import path from "path";
import { common } from "./common";
import { paths } from "./paths";

const moveTestResultsFolderToWorkspace = (context: vscode.ExtensionContext) => {
  const workspaceRoot = paths.getWorkspaceRoot();
  const extensionRoot = paths.getExtensionRoot(context);

  if (workspaceRoot && fs.existsSync(workspaceRoot)) {
    const testResultsFolder = path.join(extensionRoot, "test-results");
    const destinationFolder = path.join(workspaceRoot, "test-results");

    if (fs.existsSync(testResultsFolder)) {
      fs.moveSync(testResultsFolder, destinationFolder, { overwrite: true });
    }
  }
};

// ---------------------------------------------------------------

/**
 * Copy the test folder from the workspace to the extension folder.
 * This is used to run the test in the extension folder.
 * @param context
 * @param sourceFolderPath
 * @returns
 * - destinationFolder: the path to the copied folder in the extension folder
 * - cleanup: a function to remove the copied folder from the extension folder
 */
const copyTestFolderFromWorkspaceToExtension = (
  context: vscode.ExtensionContext,
  sourceFolderPath: string
) => {
  const extensionRoot = paths.getExtensionRoot(context);

  if (sourceFolderPath && fs.existsSync(sourceFolderPath)) {
    const destinationFolderName = sourceFolderPath.split(path.sep).pop() || "";
    const destinationFolder = path.join(extensionRoot, destinationFolderName);

    fs.copySync(sourceFolderPath, destinationFolder, { overwrite: true });

    return {
      destinationFolder,
      cleanup: () => {
        if (fs.existsSync(destinationFolder)) {
          fs.removeSync(destinationFolder);
        }
      },
    };
  }
};

// ---------------------------------------------------------------

export const movers = {
  moveTestResultsFolderToWorkspace,
  copyTestFolderFromWorkspaceToExtension,
};
