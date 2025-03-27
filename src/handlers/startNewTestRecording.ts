import * as vscode from 'vscode';
import { getExtensionPath, getWorkspaceRoot, sanitizeTestName } from './common';


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
                    const extensionRoot = getExtensionPath(context);
                    if (!workspaceRoot) {
                        vscode.window.showErrorMessage('No workspace folder found.');
                        return;
                    }

                }
            );
        });
    });
};