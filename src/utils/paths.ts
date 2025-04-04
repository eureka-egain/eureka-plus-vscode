import * as os from "os";
import path from "path";
import * as vscode from "vscode";
import { common } from "./common";

// --------------------------------------------------------------- WORKSPACE

const getWorkspaceRoot = () => {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  const workspacePath = workspaceFolders?.[0]?.uri?.fsPath;
  if (workspacePath) {
    return workspacePath;
  } else {
    vscode.window.showErrorMessage("No workspace folder found.");
    return null;
  }
};

// --------------------------------------------------------------- EXTENSION

const getExtensionRoot = (context: vscode.ExtensionContext) => {
  return context.extensionPath;
};

// ---------------------------------------------------------------

const getExtensionUserFolder = () => {
  const homeDirectory = os.homedir();
  return path.join(homeDirectory, ".eureka-plus");
};

// ---------------------------------------------------------------

const getExtensionRuntimeFolder = (workspaceRoot: string) => {
  return path.join(
    workspaceRoot,
    common.getExtensionSettings().testsFolderName
  );
};

// --------------------------------------------------------------- PLAYWRIGHT
const getPlaywrightCLIPath = (workspaceRoot: string) => {
  return path.join(
    getExtensionRuntimeFolder(workspaceRoot),
    "node_modules",
    "playwright",
    "cli.js"
  );
};

// --------------------------------------------------------------- NODE

const getNodePath = () => {
  switch (os.platform()) {
    case "win32":
      return path.join(getExtensionUserFolder(), "node", "node.exe");
    default:
      return path.join(getExtensionUserFolder(), "node", "bin", "node");
  }
};

// ---------------------------------------------------------------

const getNPMPath = () => {
  switch (os.platform()) {
    case "win32":
      return path.join(
        getExtensionUserFolder(),
        "node",
        "node_modules",
        "npm",
        "index.js"
      );
    default:
      return path.join(
        getExtensionUserFolder(),
        "node",
        "lib",
        "node_modules",
        "npm",
        "index.js"
      );
  }
};

// --------------------------------------------------------------- BROWSERS

const getBrowsersPath = () => {
  return path.join(getExtensionUserFolder(), "browsers");
};

// --------------------------------------------------------------- EXPORT

export const paths = {
  getExtensionRoot,
  getExtensionUserFolder,
  getNodePath,
  getNPMPath,
  getPlaywrightCLIPath,
  getWorkspaceRoot,
  getBrowsersPath,
  getExtensionRuntimeFolder,
};
