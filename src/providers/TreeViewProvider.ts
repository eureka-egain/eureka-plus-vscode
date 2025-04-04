import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { common } from "../utils/common";

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
        command: "egain-eureka-plus.openFile",
        title: "Open File",
        arguments: [this.resourceUri],
      };
      this.contextValue = "testFile";
    } else {
      this.command = {
        command: "egain-eureka-plus.selectFolder",
        title: "Select Folder",
        arguments: [this.resourceUri],
      };
      this.contextValue = "testFolder";
    }
  }
}

export class TreeViewProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    TreeItem | undefined | void
  > = new vscode.EventEmitter<TreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | void> =
    this._onDidChangeTreeData.event;
  public selectedFolderPath: string | undefined = undefined;
  private fileWatcher: vscode.FileSystemWatcher | undefined;

  constructor(private workspaceRoot: string | undefined) {
    if (workspaceRoot) {
      const testsFolderName = common.getExtensionSettings().testsFolderName;
      if (fs.existsSync(workspaceRoot)) {
        // Create a file system watcher for the workspace folder
        this.fileWatcher = vscode.workspace.createFileSystemWatcher(
          new vscode.RelativePattern(workspaceRoot, `*/**`)
        );

        // Listen for file changes
        this.fileWatcher.onDidCreate(() => this.refresh());
        this.fileWatcher.onDidChange(() => this.refresh());
        this.fileWatcher.onDidDelete(() => this.refresh());
      }
    }
  }

  private setHasTestsFolderViewContext = (hasTestsFolder: boolean) => {
    vscode.commands.executeCommand(
      "setContext",
      "eplusTestsView.hasTestsFolder",
      hasTestsFolder
    );
  };

  private setHasWorkspaceViewContext = (hasWorkspace: boolean) => {
    vscode.commands.executeCommand(
      "setContext",
      "eplusTestsView.hasWorkspace",
      hasWorkspace
    );
  };

  private getFilesAndFolders(dir: string): TreeItem[] {
    const items: TreeItem[] = [];
    const filesAndFolders = fs.readdirSync(dir);

    for (const fileOrFolder of filesAndFolders) {
      const fullPath = path.join(dir, fileOrFolder);
      const isDirectory = fs.statSync(fullPath).isDirectory();

      if (
        fileOrFolder.includes("node_modules") ||
        fileOrFolder.includes("test-results")
      ) {
        continue;
      }

      if (isDirectory) {
        items.push(
          new TreeItem(
            fileOrFolder,
            vscode.TreeItemCollapsibleState.Collapsed,
            fullPath
          )
        );
      } else if (fileOrFolder.endsWith(".spec.ts")) {
        items.push(
          new TreeItem(
            fileOrFolder,
            vscode.TreeItemCollapsibleState.None,
            fullPath
          )
        );
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
      this.setHasWorkspaceViewContext(false);
      return Promise.resolve([]);
    } else {
      this.setHasWorkspaceViewContext(true);
    }

    const eplusTestsPath = path.join(
      this.workspaceRoot,
      common.getExtensionSettings().testsFolderName
    );
    if (!fs.existsSync(eplusTestsPath)) {
      this.setHasTestsFolderViewContext(false);
      return Promise.resolve([]);
    } else {
      this.setHasTestsFolderViewContext(true);
    }

    if (element) {
      // Get children of a folder
      if (!element.resourceUri) {
        return Promise.resolve([]);
      }
      return Promise.resolve(
        this.getFilesAndFolders(element.resourceUri.fsPath)
      );
    } else {
      // Get root folder contents
      return Promise.resolve(this.getFilesAndFolders(eplusTestsPath));
    }
  }
}
