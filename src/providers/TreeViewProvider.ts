import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getExtensionSettings } from '../handlers/common';

class TreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        resourceUri: string
    ) {
        super(vscode.Uri.file(resourceUri), collapsibleState);
        const fileExtension = path.extname(resourceUri); // Get the file extension
        if (collapsibleState === vscode.TreeItemCollapsibleState.None) {
            this.command = {
                command: 'eureka-plus-vscode.openFile',
                title: 'Open File',
                arguments: [this.resourceUri],
            };
            this.contextValue = 'testFile';
        } else {
            this.command = {
                command: 'eureka-plus-vscode.folderSelect',
                title: 'Select Folder',
                arguments: [this.resourceUri],
            };
            this.contextValue = 'testFolder';
        }
    }
}

export class TreeViewProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | void> = new vscode.EventEmitter<TreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | void> = this._onDidChangeTreeData.event;
    public selectedFolderPath: string | undefined = undefined;
    private fileWatcher: vscode.FileSystemWatcher | undefined;

    constructor(private workspaceRoot: string | undefined) {
        if (workspaceRoot) {
            const testsFolderName = getExtensionSettings().testsFolderName;
            if (fs.existsSync(path.join(workspaceRoot, testsFolderName))) {
                // Create a file system watcher for the workspace folder
                this.fileWatcher = vscode.workspace.createFileSystemWatcher(
                    new vscode.RelativePattern(workspaceRoot, `${getExtensionSettings().testsFolderName}/*`)
                );

                // Listen for file changes
                this.fileWatcher.onDidCreate(() => this.refresh());
                this.fileWatcher.onDidChange(() => this.refresh());
                this.fileWatcher.onDidDelete(() => this.refresh());
            }
        }
    }

    private getFilesAndFolders(dir: string): TreeItem[] {
        const items: TreeItem[] = [];
        const filesAndFolders = fs.readdirSync(dir);

        for (const fileOrFolder of filesAndFolders) {
            const fullPath = path.join(dir, fileOrFolder);
            const isDirectory = fs.statSync(fullPath).isDirectory();

            if (isDirectory) {
                items.push(new TreeItem(fileOrFolder, vscode.TreeItemCollapsibleState.Collapsed, fullPath));
            } else if (fileOrFolder.endsWith('.spec.ts')) {
                items.push(new TreeItem(fileOrFolder, vscode.TreeItemCollapsibleState.None, fullPath));
            }
        }

        return items;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TreeItem): Thenable<TreeItem[]> {
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage('No workspace folder found');
            return Promise.resolve([]);
        }

        const eplusTestsPath = path.join(this.workspaceRoot, 'eplus-tests');
        if (!fs.existsSync(eplusTestsPath)) {
            return Promise.resolve([]);
        }

        if (element) {
            // Get children of a folder
            if (!element.resourceUri) {
                return Promise.resolve([]);
            }
            return Promise.resolve(this.getFilesAndFolders(element.resourceUri.fsPath));
        } else {
            // Get root folder contents
            return Promise.resolve(this.getFilesAndFolders(eplusTestsPath));
        }
    }

}