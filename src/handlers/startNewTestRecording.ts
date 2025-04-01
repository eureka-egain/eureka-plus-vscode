import * as vscode from "vscode";
import fs from "fs-extra";
import { common } from "../utils/common";
import path from "path";
import {
  eurekaPlusConfigFileName,
  eurekaPlusConfigFileVersion,
} from "../utils/constants";
import { EurekaPlusConfigFile } from "../utils/types";

export default function ({
  context,
  recordToPath,
}: {
  context: vscode.ExtensionContext;
  recordToPath: string | undefined;
  reRecord?: boolean;
}) {
  let testNameFromConfig = "";
  /**
   * URLS:
   * https://microsoft.github.io/vscode-codicons/dist/codicon.html
   * https://www.w3schools.com/js/tryit.asp?filename=tryjs_date_new
   */
  let initialUrlFromConfig = "";
  if (recordToPath) {
    const configFilePath = path.join(recordToPath, eurekaPlusConfigFileName);
    if (fs.existsSync(configFilePath)) {
      const configData = common.readEurekaPlusConfigFile(configFilePath);
      testNameFromConfig = configData.testName;
      initialUrlFromConfig = configData.initialUrl;
    }
  }

  // Prompt for the recording name
  vscode.window
    .showInputBox({
      prompt: "Enter a name for your new test recording",
      placeHolder: "e.g. Article form invalid value validation",
      value: testNameFromConfig,
      ignoreFocusOut: true,
      title: "Test Name",
    })
    .then((recordingName) => {
      if (!recordingName) {
        vscode.window.showErrorMessage(
          "Recording name is required to start the test recording."
        );
        return;
      } else {
        // make the recording name file name friendly
        recordingName = common.sanitizeTestName(recordingName);
      }

      // Prompt for the initial load URL
      vscode.window
        .showInputBox({
          prompt: "Enter the initial URL to load for the test recording",
          title: `Initial URL for test`,
          placeHolder: "e.g., http://localhost:3000/work/login",
          value: initialUrlFromConfig,
          ignoreFocusOut: true,
          validateInput: (input) => {
            try {
              new URL(input); // Validate if the input is a valid URL
              return null; // No error
            } catch {
              return "Please enter a valid URL";
            }
          },
        })
        .then((initialUrl) => {
          if (!initialUrl) {
            vscode.window.showErrorMessage(
              "Initial URL is required to start the test recording."
            );
            return;
          }

          // Show a progress notification for starting the recording
          vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              cancellable: true,
            },
            async (progress) => {
              progress.report({ message: "Test recording in progress" });

              // Use the recording name and initial URL to save the recording
              const workspaceRoot = common.getWorkspaceRoot();
              const extensionRoot = common.getExtensionRoot(context);
              if (!workspaceRoot) {
                vscode.window.showErrorMessage("No workspace folder found.");
                return;
              }

              const tempRecordingFolder = path.join(
                extensionRoot,
                recordingName
              );
              const tempPaths = {
                specFile: path.join(
                  tempRecordingFolder,
                  `${recordingName}.spec.ts`
                ),
                harFile: path.join(tempRecordingFolder, `${recordingName}.har`),
                storageFile: path.join(
                  tempRecordingFolder,
                  `${recordingName}.json`
                ),
              };

              // Create the temp recording folder
              fs.mkdirSync(tempRecordingFolder);

              // Run codegen to start the recording
              return common.runProcess({
                command: "npx playwright codegen",
                args: [
                  `--output=${tempPaths.specFile}`,
                  `--save-storage=${tempPaths.storageFile}`,
                  `--save-har=${tempPaths.harFile}`,
                  `--save-har-glob="${common.getExtensionSettings().recordingHARBlob}"`,
                  "--ignore-https-errors",
                  initialUrl,
                ],
                cwd: extensionRoot,
                onExit: ({ code, resolve }) => {
                  if (code === 0) {
                    vscode.window.showInformationMessage(
                      `Test recording completed!`
                    );

                    // generate config file
                    const configData: EurekaPlusConfigFile = {
                      version: eurekaPlusConfigFileVersion,
                      testName: recordingName,
                      initialUrl: initialUrl,
                    };
                    const configFilePath = path.join(
                      tempRecordingFolder,
                      eurekaPlusConfigFileName
                    );
                    fs.writeFileSync(
                      configFilePath,
                      JSON.stringify(configData)
                    );

                    // move test folder to workspace
                    const testLocationInWorkspace = recordToPath
                      ? path.join(recordToPath, recordingName)
                      : path.join(
                          workspaceRoot,
                          common.getExtensionSettings().testsFolderName,
                          recordingName
                        );
                    if (!fs.existsSync(testLocationInWorkspace)) {
                      fs.mkdir(testLocationInWorkspace);
                    }
                    fs.moveSync(tempRecordingFolder, testLocationInWorkspace, {
                      overwrite: true,
                    });

                    vscode.workspace
                      .openTextDocument(
                        path.join(
                          testLocationInWorkspace,
                          `${recordingName}.spec.ts`
                        )
                      )
                      .then(vscode.window.showTextDocument);
                  } else {
                    vscode.window.showErrorMessage(
                      `Test recording process exited with code ${code}`
                    );
                    if (fs.existsSync(tempRecordingFolder)) {
                      fs.removeSync(tempRecordingFolder);
                    }
                  }
                  resolve();
                },
                onError: ({ error, resolve }) => {
                  vscode.window.showErrorMessage(
                    `Error starting the test recording: ${error.message}`
                  );
                  if (fs.existsSync(tempRecordingFolder)) {
                    fs.removeSync(tempRecordingFolder);
                  }
                  resolve();
                },
              });
            }
          );
        });
    });
}
