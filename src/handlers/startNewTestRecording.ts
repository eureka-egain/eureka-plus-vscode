import * as vscode from 'vscode';
import fs from 'fs-extra';
import { getExtensionRoot, getExtensionSettings, getWorkspaceRoot, runProcess, sanitizeTestName } from './common';
import path from 'path';


export default function ({ context, recordFsPath }: {
    context: vscode.ExtensionContext;
    recordFsPath: string | undefined;
}) {
    // Prompt for the recording name
    vscode.window.showInputBox({
        prompt: 'Enter a name for your new test recording',
        placeHolder: 'e.g., create-article-form-invalid-value',
        ignoreFocusOut: true,
        title: 'Test Name'
    }).then((recordingName) => {
        if (!recordingName) {
            vscode.window.showErrorMessage('Recording name is required to start the test recording.');
            return;
        } else {
            // make the recording name file name friendly
            recordingName = sanitizeTestName(recordingName);
        }

        // Prompt for the initial load URL
        vscode.window.showInputBox({
            prompt: 'Enter the initial URL to load for the test recording',
            title: `Initial URL for test`,
            placeHolder: 'e.g., http://localhost:3000/work/login',
            value: "https://microsoft.github.io/vscode-codicons/dist/codicon.html", // TODO: Remove this pre-release
            ignoreFocusOut: true,
            validateInput: (input) => {
                try {
                    new URL(input); // Validate if the input is a valid URL
                    return null; // No error
                } catch {
                    return 'Please enter a valid URL';
                }
            },
        }).then((initialUrl) => {
            if (!initialUrl) {
                vscode.window.showErrorMessage('Initial URL is required to start the test recording.');
                return;
            }

            // Show a progress notification for starting the recording
            vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    cancellable: true,
                },
                async (progress) => {
                    progress.report({ message: 'Test recording in progress' });

                    // Use the recording name and initial URL to save the recording
                    const workspaceRoot = getWorkspaceRoot();
                    const extensionRoot = getExtensionRoot(context);
                    if (!workspaceRoot) {
                        vscode.window.showErrorMessage('No workspace folder found.');
                        return;
                    }

                    const tempRecordingFolder = path.join(extensionRoot, recordingName);
                    const tempPaths = {
                        specFile: path.join(tempRecordingFolder, `${recordingName}.spec.ts`),
                        harFile: path.join(tempRecordingFolder, `${recordingName}.har`),
                        storageFile: path.join(tempRecordingFolder, `${recordingName}.json`),
                    };

                    // Create the temp recording folder
                    fs.mkdirSync(tempRecordingFolder);

                    // Run codegen to start the recording
                    // console.log(`npx playwright codegen --output=${tempPaths.specFile} --save-storage=${tempPaths.storageFile} --save-har=${tempPaths.harFile} --ignore-https-errors ${initialUrl}`);
                    return runProcess({
                        command: 'npx playwright codegen',
                        args: [
                            `--output=${tempPaths.specFile}`,
                            `--save-storage=${tempPaths.storageFile}`,
                            `--save-har=${tempPaths.harFile}`,
                            '--ignore-https-errors',
                            initialUrl,
                        ],
                        cwd: extensionRoot,
                        onExit({ code, resolve }) {
                            if (code === 0) {
                                vscode.window.showInformationMessage(`Test recording completed!`);
                                // move test folder to workspace
                                const testLocationInWorkspace = recordFsPath ? path.join(recordFsPath, recordingName) : path.join(workspaceRoot, getExtensionSettings().testsFolderName, recordingName);
                                if (!fs.existsSync(testLocationInWorkspace)) {
                                    fs.mkdir(testLocationInWorkspace);
                                }
                                fs.moveSync(tempRecordingFolder, testLocationInWorkspace, { overwrite: true });

                                vscode.workspace.openTextDocument(path.join(testLocationInWorkspace, `${recordingName}.spec.ts`)).then(vscode.window.showTextDocument);
                            } else {
                                vscode.window.showErrorMessage(`Test recording process exited with code ${code}`);
                                if (fs.existsSync(tempRecordingFolder)) {
                                    fs.removeSync(tempRecordingFolder);
                                }
                            }
                            resolve();
                        },
                        onError({ error, resolve }) {
                            vscode.window.showErrorMessage(`Error starting the test recording: ${error.message}`);
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
};