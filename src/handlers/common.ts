import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import path from "path";
import { spawn } from 'child_process';
import { defaultTestsFolderName } from '../utils/constants';

export const getExtensionRoot = (context: vscode.ExtensionContext) => {
    return context.extensionPath;
};

// ---------------------------------------------------------------

export const getExtensionSettings = () => {
    const config = vscode.workspace.getConfiguration('egain-eureka-plus');
    return {
        testsFolderName: config.get<string>('testsFolderName') || defaultTestsFolderName,
    };
};

// ---------------------------------------------------------------

export const getWorkspaceRoot = () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    return workspaceFolders?.[0]?.uri?.fsPath;
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
    const extensionRoot = getExtensionRoot(context);

    if (workspaceRoot) {
        const testResultsFolder = path.join(extensionRoot, 'test-results');
        const destinationFolder = path.join(workspaceRoot, 'test-results');;

        if (!fs.existsSync(destinationFolder)) {
            fs.mkdirSync(destinationFolder);
        }

        if (fs.existsSync(destinationFolder) && fs.existsSync(testResultsFolder)) {
            fs.moveSync(testResultsFolder, destinationFolder, { overwrite: true });
        }
    }
};

// ---------------------------------------------------------------

export const sanitizeTestName = (testName: string) => {
    return testName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
};

// ---------------------------------------------------------------

export const showInDevelopementNotification = () => {
    vscode.window.showInformationMessage('This feature is under development');
};
