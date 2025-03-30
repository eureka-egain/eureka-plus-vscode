import fs from 'fs-extra';
import * as vscode from 'vscode';
import { getExtensionRoot, moveTestResultsFolderToWorkspace, runProcess } from "./common";

export default async function ({ context, folderPath }: {
    context: vscode.ExtensionContext;
    folderPath: string;
}) {
    const extensionPath = getExtensionRoot(context);

    // moving test folder to extension path
    const testTempFolderDestination = `${extensionPath}`;
    if (fs.existsSync(testTempFolderDestination)) {
        fs.removeSync(testTempFolderDestination);
    }
    fs.mkdirSync(testTempFolderDestination);
    fs.copySync(folderPath, testTempFolderDestination);

    const command = `npx playwright test ${folderPath} --ui`;
    console.log(command);
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