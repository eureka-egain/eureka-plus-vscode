import fs from 'fs-extra';
import * as vscode from 'vscode';
import { getExtensionRoot, moveTestResultsFolderToWorkspace, runProcess } from "./common";

export default async function ({ context, testFileName, testFolderPath }: {
    context: vscode.ExtensionContext;
    testFolderPath: string;
    testFileName: string;
}) {
    const extensionPath = getExtensionRoot(context);

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
        onExit: ({ resolve }) => {
            if (fs.existsSync(testTempFolderDestination)) {
                fs.removeSync(testTempFolderDestination);
            }
            resolve();
        },
        onError: ({ error, resolve }) => {
            vscode.window.showErrorMessage(`Error: ${error}`);
            if (fs.existsSync(testTempFolderDestination)) {
                fs.removeSync(testTempFolderDestination);
            }
            resolve();
        },
        onStderr: ({ data, resolve }) => {
            vscode.window.showErrorMessage(`Error: ${data}`);
            if (fs.existsSync(testTempFolderDestination)) {
                fs.removeSync(testTempFolderDestination);
            }
            resolve();
        },
        cwd: testTempFolderDestination,
    });

    // move generated test results back to workspace
    moveTestResultsFolderToWorkspace(context);;
}