import * as vscode from "vscode";
import * as os from "os";
import fs from "fs-extra";
import { spawn } from "child_process";
import {
  defaultTestsFolderName,
  eurekaPlusConfigFileVersion,
} from "./constants";
import { EurekaPlusConfigFile } from "./types";
import path from "path";

const getExtensionRoot = (context: vscode.ExtensionContext) => {
  return context.extensionPath;
};

// ---------------------------------------------------------------

const getPlaywrightCLIPath = (context: vscode.ExtensionContext) => {
  const extensionRoot = getExtensionRoot(context);
  return path.join(extensionRoot, "node_modules", "playwright", "cli.js");
};

// ---------------------------------------------------------------

const getNodePath = (context: vscode.ExtensionContext) => {
  const extensionRoot = getExtensionRoot(context);
  switch (os.platform()) {
    case "win32":
      return path.join(extensionRoot, "utils", "node", "node.exe");
    default:
      return path.join(extensionRoot, "utils", "node", "bin", "node");
  }
};

// ---------------------------------------------------------------

const getNPX = (context: vscode.ExtensionContext) => {
  const extensionRoot = getExtensionRoot(context);
  switch (os.platform()) {
    case "win32":
      return path.join(extensionRoot, "utils", "node", "node", "npx");
    default:
      return path.join(getNodePath(context), "bin", "npx");
  }
};

// ---------------------------------------------------------------

const getNPM = (context: vscode.ExtensionContext) => {
  const extensionRoot = getExtensionRoot(context);
  switch (os.platform()) {
    case "win32":
      return path.join(
        extensionRoot,
        "utils",
        "node",
        "node_modules",
        "npm",
        "index.js"
      );
    default:
      return path.join(
        extensionRoot,
        "utils",
        "node",
        "lib",
        "node_modules",
        "npm",
        "index.js"
      );
  }
};

// ---------------------------------------------------------------

const getExtensionSettings = () => {
  const config = vscode.workspace.getConfiguration("egain-eureka-plus");
  return {
    testsFolderName:
      config.get<string>("testsFolderName") || defaultTestsFolderName,
    recordingHARBlob: config.get<string>("recordingHARBlob") || "**/system/**",
  };
};

// ---------------------------------------------------------------

const readEurekaPlusConfigFile = (
  testFolderPath: string
): EurekaPlusConfigFile => {
  try {
    const data = fs.readFileSync(testFolderPath, "utf8");
    const config: EurekaPlusConfigFile = JSON.parse(data);
    return config;
  } catch (error) {
    console.error("Error reading config file:", error);
    return {
      version: eurekaPlusConfigFileVersion,
      testName: "",
      initialUrl: "",
    };
  }
};

// ---------------------------------------------------------------

const getWorkspaceRoot = () => {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  return workspaceFolders?.[0]?.uri?.fsPath;
};

// ---------------------------------------------------------------

const runProcess = ({
  command,
  args,
  cwd,
  onError,
  onExit,
  onStderr,
  onStdout,
  context,
}: {
  command: string;
  /**
     * Command is an array of strings that when combined represent the command to run
     * @example
     * const recordingProcess = spawn(playwrightPath, [
            'codegen',
            `--output=${recordingSpecFilePath}`,
            `--save-storage=${recordingStorageFilePath}`,
            `--save-har=${recordingHARFilePath}`,
            '--ignore-https-errors',
            initialUrl,
        ], { shell: true });
     */
  args?: string[];
  cwd?: string;
  onStdout?: (props: {
    data: string;
    resolve: (value: void | PromiseLike<void>) => void;
    reject: (reason?: any) => void;
  }) => void;
  onStderr?: (props: {
    data: string;
    resolve: (value: void | PromiseLike<void>) => void;
    reject: (reason?: any) => void;
  }) => void;
  onExit?: (props: {
    code: number | null;
    resolve: (value: void | PromiseLike<void>) => void;
    reject: (reason?: any) => void;
  }) => void;
  onError?: (props: {
    error: Error;
    resolve: (value: void | PromiseLike<void>) => void;
    reject: (reason?: any) => void;
  }) => void;
  context: vscode.ExtensionContext;
}) => {
  const extensionRoot = getExtensionRoot(context);

  return new Promise<void>((resolve, reject) => {
    const process = spawn(command, args ?? [], {
      shell: true,
      cwd,
      env: {
        PLAYWRIGHT_BROWSERS_PATH: path.join(extensionRoot, "browsers"),
      },
    });

    // Log stdout and stderr for debugging
    process.stdout.on("data", (data) => {
      onStdout?.({
        data: data.toString(),
        resolve,
        reject,
      });
    });

    process.stderr.on("data", (data) => {
      onStderr?.({
        data: data.toString(),
        resolve,
        reject,
      });
    });

    // Handle process exit
    process.on("close", (code) => {
      if (code === 0) {
        onExit?.({
          code,
          resolve,
          reject,
        });
      } else {
        onExit?.({
          code,
          resolve,
          reject,
        });
      }
    });

    // Handle errors
    process.on("error", (error) => {
      onError?.({
        error,
        resolve,
        reject,
      });
    });
  });
};

// ---------------------------------------------------------------

const sanitizeTestName = (testName: string) => {
  return testName.replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase();
};

// ---------------------------------------------------------------

const showInDevelopementNotification = () => {
  vscode.window.showInformationMessage("This feature is under development");
};

// ---------------------------------------------------------------

const formatPathForPW = (path: string) => {
  return path.replace(/\\/g, "/");
};

// ---------------------------------------------------------------

export const common = {
  getExtensionRoot,
  getExtensionSettings,
  getWorkspaceRoot,
  runProcess,
  sanitizeTestName,
  showInDevelopementNotification,
  formatPathForPW,
  readEurekaPlusConfigFile,
  getNodePath,
  getNPX,
  getNPM,
  getPlaywrightCLIPath,
};
