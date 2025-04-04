import * as vscode from "vscode";
import fs from "fs-extra";
import { common } from "../utils/common";
import path from "path";
import {
  eurekaPlusConfigFileName,
  eurekaPlusConfigFileVersion,
} from "../utils/constants";
import { EurekaPlusConfigFile } from "../utils/types";
import { paths } from "../utils/paths";

export default function ({
  context,
  recordToPath,
}: {
  context: vscode.ExtensionContext;
  recordToPath: string;
}) {
  let testNameFromConfig = "";
  /**
   * URLS:
   * https://microsoft.github.io/vscode-codicons/dist/codicon.html
   * https://www.w3schools.com/js/tryit.asp?filename=tryjs_date_new
   */
  let initialUrlFromConfig = "";
  const configFilePath = path.join(recordToPath, eurekaPlusConfigFileName);
  if (fs.existsSync(configFilePath)) {
    const configData = common.readEurekaPlusConfigFile(configFilePath);
    testNameFromConfig = configData.testName;
    initialUrlFromConfig = configData.initialUrl;
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
              const workspaceRoot = paths.getWorkspaceRoot();
              const extensionRoot = paths.getExtensionRoot(context);
              if (!workspaceRoot) {
                vscode.window.showErrorMessage("No workspace folder found.");
                return;
              }

              const recordingFolderPath = path.join(
                recordToPath,
                recordingName
              );
              const recordingPaths = {
                specFile: path.join(
                  recordingFolderPath,
                  `${recordingName}.spec.ts`
                ),
                harFile: path.join(recordingFolderPath, `${recordingName}.har`),
                storageFile: path.join(
                  recordingFolderPath,
                  `${recordingName}.json`
                ),
              };

              // Create the temp recording folder
              fs.mkdirSync(recordingFolderPath);

              // Run codegen to start the recording
              console.log(
                `${paths.getNodePath()} ${paths.getPlaywrightCLIPath(
                  workspaceRoot
                )} codegen`
              );
              return common.runProcess({
                command: `${paths.getNodePath()} ${paths.getPlaywrightCLIPath(
                  workspaceRoot
                )} codegen`,
                args: [
                  `--output=${recordingPaths.specFile}`,
                  `--save-storage=${recordingPaths.storageFile}`,
                  `--save-har=${recordingPaths.harFile}`,
                  `--save-har-glob="${
                    common.getExtensionSettings().recordingRequestIncludeFilter
                  }"`,
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
                      recordingFolderPath,
                      eurekaPlusConfigFileName
                    );
                    fs.writeFileSync(
                      configFilePath,
                      JSON.stringify(configData)
                    );

                    vscode.workspace
                      .openTextDocument(
                        path.join(
                          recordingFolderPath,
                          `${recordingName}.spec.ts`
                        )
                      )
                      .then(vscode.window.showTextDocument);
                  } else {
                    vscode.window.showErrorMessage(
                      `Test recording process exited with code ${code}`
                    );
                  }
                  resolve();
                },
                onError: ({ error, resolve }) => {
                  vscode.window.showErrorMessage(
                    `Error starting the test recording: ${error.message}`
                  );
                  resolve();
                },
              });
            }
          );
        });
    });
}
