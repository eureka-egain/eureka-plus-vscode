import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import path from "path";
import { spawn } from 'child_process';

export const getExtensionPath = (context: vscode.ExtensionContext) => {
    return context.extensionPath;
};

// ---------------------------------------------------------------

export const getWorkspaceRoot = () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showInformationMessage('No workspace folder found');
        return;
    }
    return workspaceFolders[0].uri.fsPath;
};

// ---------------------------------------------------------------

export const getExtensionSettings = () => {
    const config = vscode.workspace.getConfiguration('eureka-plus-vscode');
    return {
        testsFolderName: config.get<string>('testsFolderName') || "eplus-tests",
    };
};

// ---------------------------------------------------------------

export const showInDevelopementNotification = () => {
    vscode.window.showInformationMessage('This feature is under development');
};

// ---------------------------------------------------------------

export const getPlaywrightPath = (context: vscode.ExtensionContext) => {
    const playwrightPath = path.join(getExtensionPath(context), 'node_modules', '.bin', 'playwright');
    if (!playwrightPath) {
        vscode.window.showErrorMessage('Error: Could not find Playwright');
        return false;
    }
    return playwrightPath;
};

// ---------------------------------------------------------------

export const runProcess = ({ command, args, cwd, onError, onExit, onStderr, onStdout }: {
    command: string;
    /**
     * Command is an array of strings that when combined represent the command to run
     * @example
     * const recordingProcess = spawn(playwrightPath, [
            'codegen',
            `--output=${recordingSpecFilePath}`,
            `--save-storage=${recordingStorageFilePath}`,
            `--save-har=${recordingHARFilePath}`,
            '--ignore-https-errors',
            initialUrl,
        ], { shell: true });
     */
    args?: string[];
    cwd?: string;
    onStdout?: (data: string) => void;
    onStderr?: (data: string) => void;
    onExit?: (code: number | null) => void;
    onError?: (error: Error) => void;
}) => {
    return new Promise<void>((resolve, reject) => {
        const process = spawn(command, args ?? [], { shell: true, cwd });

        // Log stdout and stderr for debugging
        process.stdout.on('data', (data) => {
            onStdout?.(data.toString());
        });

        process.stderr.on('data', (data) => {
            onStderr?.(data.toString());
        });

        // Handle process exit
        process.on('close', (code) => {
            if (code === 0) {
                onExit?.(code);
                resolve();
            } else {
                onExit?.(code);
                resolve();
            }
        });

        // Handle errors
        process.on('error', (error) => {
            onError?.(error);
            resolve();
        });
    });
};

// ---------------------------------------------------------------

export const moveTestResultsFolderToWorkspace = (context: vscode.ExtensionContext) => {
    const workspaceRoot = getWorkspaceRoot();
    const extensionPath = getExtensionPath(context);

    if (workspaceRoot) {
        const testResultsFolder = path.join(extensionPath, 'test-results');
        const destinationFolder = path.join(workspaceRoot, 'test-results');;

        if (!fs.existsSync(destinationFolder)) {
            fs.mkdirSync(destinationFolder);
        }

        if (fs.existsSync(destinationFolder) && fs.existsSync(testResultsFolder)) {
            fs.moveSync(testResultsFolder, destinationFolder, { overwrite: true });
        }
    }

};