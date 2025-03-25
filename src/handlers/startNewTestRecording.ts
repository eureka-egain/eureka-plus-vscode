import * as vscode from 'vscode';
import path from "path";
import { exec } from 'child_process';
import { getExtensionPath, getWorkspaceRoot } from './common';


export default function (context: vscode.ExtensionContext) {
    const playwrightPath = getExtensionPath(context);
    if (!playwrightPath) {
        vscode.window.showErrorMessage('Error: Could not find Playwright');
        return false;
    } else {
        // Prompt for the recording name
        vscode.window.showInputBox({
            prompt: 'Enter the name for the new test recording',
            placeHolder: 'e.g., create-article-form-invalid-value',
        }).then((recordingName) => {
            if (!recordingName) {
                vscode.window.showErrorMessage('Recording name is required to start the test recording.');
                return;
            }

            // Prompt for the initial load URL
            vscode.window.showInputBox({
                prompt: 'Enter the initial URL to load for the test recording',
                placeHolder: 'e.g., http://localhost:3000/work/login',
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
                        title: 'Eureka+:',
                        cancellable: false,
                    },
                    async (progress) => {
                        progress.report({ message: 'Starting a new test recording...' });

                        // Use the recording name and initial URL to save the recording
                        const workspaceRoot = getWorkspaceRoot();
                        if (!workspaceRoot) {
                            vscode.window.showErrorMessage('No workspace folder found.');
                            return;
                        }

                        const recordingPath = path.join(workspaceRoot, `${recordingName}.spec.ts`);
                        const startRecordingCommand = `${playwrightPath} codegen --save-storage=${recordingName}-storage.json --output=${recordingPath} --ignore-https-errors ${initialUrl}`;

                        await new Promise<void>((resolve, reject) => {
                            exec(startRecordingCommand, (error, stdout, stderr) => {
                                if (error) {
                                    vscode.window.showErrorMessage(`Error starting a new test recording: ${error.message}`);
                                    reject(error);
                                    return;
                                }
                                if (stderr) {
                                    vscode.window.showErrorMessage(`Stderr: ${stderr}`);
                                    reject(stderr);
                                    return;
                                }
                                vscode.window.showInformationMessage(`Test recording completed: ${recordingPath}`);
                                resolve();
                            });
                        });
                    }
                );
            });
        });
    }
};