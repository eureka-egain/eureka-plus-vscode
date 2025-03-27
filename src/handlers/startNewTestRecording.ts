import { spawn } from 'child_process';
import * as fs from "fs";
import path from "path";
import * as vscode from 'vscode';
import { getExtensionSettings, getPlaywrightPath, getWorkspaceRoot, runProcess } from './common';


export default function ({ context, recordFsPath }: {
    context: vscode.ExtensionContext;
    recordFsPath: string | undefined;
}) {
    const playwrightPath = getPlaywrightPath(context);
    if (playwrightPath) {
        // Prompt for the recording name
        vscode.window.showInputBox({
            prompt: 'Enter the name for the new test recording FUCK',
            placeHolder: 'e.g., create-article-form-invalid-value',
            ignoreFocusOut: true
        }).then((recordingName) => {
            if (!recordingName) {
                vscode.window.showErrorMessage('Recording name is required to start the test recording.');
                return;
            }

            // Prompt for the initial load URL
            vscode.window.showInputBox({
                prompt: 'Enter the initial URL to load for the test recording',
                placeHolder: 'e.g., http://localhost:3000/work/login',
                value: "https://microsoft.github.io/vscode-codicons/dist/codicon.html",
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
                        if (!workspaceRoot) {
                            vscode.window.showErrorMessage('No workspace folder found.');
                            return;
                        }

                        const recordingPath = recordFsPath ? path.join(recordFsPath, recordingName) : path.join(workspaceRoot, getExtensionSettings().testsFolderName, recordingName);
                        const recordingSpecFilePath = path.join(recordingPath, `${recordingName}.spec.ts`);
                        const recordingStorageFilePath = path.join(recordingPath, `${recordingName}-storage.json`);
                        const recordingHARFilePath = path.join(recordingPath, `${recordingName}.har`);
                        const recordingFolder = path.dirname(recordingSpecFilePath); // Get the folder path

                        // Ensure the folder exists
                        if (!fs.existsSync(recordingFolder)) {
                            fs.mkdirSync(recordingFolder, { recursive: true }); // Create the folder recursively
                        }

                        await runProcess({
                            command: playwrightPath,
                            args: [
                                'codegen',
                                `--output=${recordingSpecFilePath}`,
                                `--save-storage=${recordingStorageFilePath}`,
                                `--save-har=${recordingHARFilePath}`,
                                '--ignore-https-errors',
                                initialUrl,
                            ],
                            onExit(code) {
                                if (code === 0) {
                                    vscode.window.showInformationMessage(`Test recording completed: ${recordingPath}`);
                                    vscode.workspace.openTextDocument(recordingSpecFilePath).then(vscode.window.showTextDocument);
                                } else {
                                    vscode.window.showErrorMessage(`Test recording process exited with code ${code}`);
                                }
                            },
                            onError(error) {
                                vscode.window.showErrorMessage(`Error starting the test recording: ${error.message}`);
                            },
                        });
                    }
                );
            });
        });
    }
};