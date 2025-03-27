import * as fs from 'fs-extra';
import * as vscode from 'vscode';
import { getExtensionPath, moveTestResultsFolderToWorkspace, runProcess } from "./common";

export default async function ({ context, testFileName, testFolderPath }: {
    context: vscode.ExtensionContext;
    testFolderPath: string;
    testFileName: string;
}) {
    const extensionPath = getExtensionPath(context);

    // moving test folder to extension path
    const testTempFolderDestination = `${extensionPath}/tests`;
    if (fs.existsSync(testTempFolderDestination)) {
        fs.removeSync(testTempFolderDestination);
    }
    fs.mkdirSync(testTempFolderDestination);
    fs.copySync(testFolderPath, testTempFolderDestination);

    const command = `npx playwright test ${testFileName} --ui`;
    await runProcess({
        command: command,
        args: [
            '--ui',
        ],
        onExit: () => {
            if (fs.existsSync(testTempFolderDestination)) {
                fs.removeSync(testTempFolderDestination);
            }
        },
        onError: (error) => {
            vscode.window.showErrorMessage(`Error: ${error}`);
            if (fs.existsSync(testTempFolderDestination)) {
                fs.removeSync(testTempFolderDestination);
            }
        },
        onStderr: (data) => {
            vscode.window.showErrorMessage(`Error: ${data}`);
            if (fs.existsSync(testTempFolderDestination)) {
                fs.removeSync(testTempFolderDestination);
            }
        },
        cwd: testTempFolderDestination,
    });

    // move generated test results back to workspace
    moveTestResultsFolderToWorkspace(context);;
}