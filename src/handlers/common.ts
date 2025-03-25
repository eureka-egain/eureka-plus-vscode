import * as vscode from 'vscode';
import path from "path";
import * as os from 'os';
import { exec } from 'child_process';

export const getExtensionPath = (context: vscode.ExtensionContext) => {
    const extensionPath = context.extensionPath;
    return path.join(extensionPath, 'node_modules', '.bin', 'playwright');
};

// ----------------------------------------

export const getWorkspaceRoot = () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showInformationMessage('No workspace folder found');
        return;
    }
    return workspaceFolders[0].uri.fsPath;
};

// ----------------------------------------

export const getExtensionSettings = () => {
    const config = vscode.workspace.getConfiguration('eureka-plus-vscode');
    return {
        testsFolderName: config.get<string>('testsFolderName') || "eplus-tests",
    };
};