import * as vscode from 'vscode';
import * as fs from "fs";
import path from "path";
import { exec, spawn } from 'child_process';
import { getExtensionPath, getExtensionSettings, getWorkspaceRoot } from './common';


export default function (context: vscode.ExtensionContext) {
    const playwrightPath = getExtensionPath(context);
    if (!playwrightPath) {
        vscode.window.showErrorMessage('Error: Could not find Playwright');
        return false;
    } else {
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
                        title: 'Eureka+',
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

                        const recordingPath = path.join(workspaceRoot, getExtensionSettings().testsFolderName, recordingName);
                        const recordingSpecFilePath = path.join(recordingPath, `${recordingName}.spec.ts`);
                        const recordingStorageFilePath = path.join(recordingPath, `${recordingName}-storage.json`);
                        const recordingHARFilePath = path.join(recordingPath, `${recordingName}.har`);
                        const recordingFolder = path.dirname(recordingSpecFilePath); // Get the folder path

                        // Ensure the folder exists
                        if (!fs.existsSync(recordingFolder)) {
                            fs.mkdirSync(recordingFolder, { recursive: true }); // Create the folder recursively
                        }

                        await new Promise<void>((resolve, reject) => {
                            const recordingProcess = spawn(playwrightPath, [
                                'codegen',
                                `--output=${recordingSpecFilePath}`,
                                `--save-storage=${recordingStorageFilePath}`,
                                `--save-har=${recordingHARFilePath}`,
                                '--ignore-https-errors',
                                initialUrl,
                            ], { shell: true });

                            // Log stdout and stderr for debugging
                            recordingProcess.stdout.on('data', (data) => {
                                console.log(`stdout: ${data}`);
                            });

                            recordingProcess.stderr.on('data', (data) => {
                                console.error(`stderr: ${data}`);
                            });

                            // Handle process exit
                            recordingProcess.on('close', (code) => {
                                if (code === 0) {
                                    vscode.window.showInformationMessage(`Test recording completed: ${recordingPath}`);
                                    resolve();
                                } else {
                                    vscode.window.showErrorMessage(`Test recording process exited with code ${code}`);
                                    reject(new Error(`Process exited with code ${code}`));
                                }
                            });

                            // Handle errors
                            recordingProcess.on('error', (error) => {
                                vscode.window.showErrorMessage(`Error starting the test recording: ${error.message}`);
                                reject(error);
                            });
                        });
                    }
                );
            });
        });
    }
};