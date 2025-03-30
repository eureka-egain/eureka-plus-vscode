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

const moveTestResultsFolderToWorkspace = (context: vscode.ExtensionContext) => {
  const workspaceRoot = common.getWorkspaceRoot();
  const extensionRoot = common.getExtensionRoot(context);

  if (workspaceRoot && fs.existsSync(workspaceRoot)) {
    const testResultsFolder = path.join(extensionRoot, "test-results");
    const destinationFolder = path.join(workspaceRoot, "test-results");

    if (fs.existsSync(testResultsFolder)) {
      fs.moveSync(testResultsFolder, destinationFolder, { overwrite: true });
    }
  }
};

// ---------------------------------------------------------------

const copyFolderFromWorkspaceToExtension = (
  context: vscode.ExtensionContext,
  sourceFolderPath: string
) => {
  const extensionRoot = common.getExtensionRoot(context);

  if (sourceFolderPath && fs.existsSync(sourceFolderPath)) {
    const destinationFolderName = sourceFolderPath.split(path.sep).pop() || "";
    const destinationFolder = path.join(extensionRoot, destinationFolderName);

    fs.copySync(sourceFolderPath, destinationFolder, { overwrite: true });
  }
};

// ---------------------------------------------------------------

export const movers = {
  moveTestResultsFolderToWorkspace,
  copyFolderFromWorkspaceToExtension,
};
