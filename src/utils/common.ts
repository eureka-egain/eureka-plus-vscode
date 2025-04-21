import { spawn } from "child_process";
import fs from "fs-extra";
import * as vscode from "vscode";
import {
  defaultTestsFolderName,
  eurekaPlusConfigFileVersion,
} from "./constants";
import { paths } from "./paths";
import { EurekaPlusConfigFile } from "./types";

// ---------------------------------------------------------------

const getExtensionSettings = () => {
  const config = vscode.workspace.getConfiguration("Eureka+");
  return {
    testsFolderName:
      config.get<string>("testsFolderName") || defaultTestsFolderName,
    recordingRequestIncludeFilter:
      config.get<string>("recordingRequestIncludeFilter") ||
      "/^(?!.*:3000).+$/",
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

const runProcess = ({
  command,
  args,
  cwd,
  onError,
  onExit,
  onStderr,
  onStdout,
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
}) => {
  return new Promise<void>((resolve, reject) => {
    const process = spawn(command, args ?? [], {
      shell: true,
      cwd,
      env: {
        PLAYWRIGHT_BROWSERS_PATH: paths.getBrowsersPath(),
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
      vscode.window.showErrorMessage(
        `StdError running command: ${command} ${args?.join(" ") || ""}`
      );
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
        vscode.window.showErrorMessage(
          `Error running command: ${command} ${args?.join(" ") || ""}`
        );
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
  getExtensionSettings,
  runProcess,
  sanitizeTestName,
  showInDevelopementNotification,
  formatPathForPW,
  readEurekaPlusConfigFile,
};
