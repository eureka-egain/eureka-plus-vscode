import * as os from "os";
import path from "path";
import * as vscode from "vscode";

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

const getExtensionUserRuntimeFolder = () => {
  return path.join(getExtensionUserFolder(), "runtime");
};

// --------------------------------------------------------------- PLAYWRIGHT

const getPlaywrightCLIPath = () => {
  return path.join(
    getExtensionUserRuntimeFolder(),
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

// --------------------------------------------------------------- WORKSPACE

const getWorkspaceRoot = () => {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  return workspaceFolders?.[0]?.uri?.fsPath;
};

// --------------------------------------------------------------- BROWSERS

const getBrowsersPath = () => {
  return path.join(getExtensionUserRuntimeFolder(), "browsers");
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
  getExtensionUserRuntimeFolder,
};
