import * as vscode from "vscode";
import { TreeViewProvider } from "./providers/TreeViewProvider";
import { handlers } from "./handlers";
import { showInDevelopementNotification } from "./handlers/common";

export function activate(context: vscode.ExtensionContext) {
  // Register the Tree View
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const treeDataProvider = new TreeViewProvider(workspaceRoot);
  vscode.window.registerTreeDataProvider("eplusTestsView", treeDataProvider);

  // Register a command to open extension settings
  context.subscriptions.push(
    vscode.commands.registerCommand("eureka.plus.extensionSettings", () => {
      vscode.commands.executeCommand(
        "workbench.action.openSettings",
        "eureka.plus"
      );
    })
  );

  // Register a command to install all playwright dependencies
  context.subscriptions.push(
    vscode.commands.registerCommand("eureka.plus.installDependencies", () => {
      handlers.installDependencies(context);
    })
  );

  // Register a command to refresh the Tree View
  context.subscriptions.push(
    vscode.commands.registerCommand("eureka.plus.refreshTreeView", () => {
      treeDataProvider.refresh();
    })
  );

  // Register a command to start a new test recording
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "eureka.plus.recordNewTest",
      (resourceUri: vscode.Uri) => {
        handlers.startNewTestRecording({
          context,
          recordFsPath: treeDataProvider.selectedFolderPath,
        });
      }
    )
  );

  // Register a command to run all test cases in test folder
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "eureka.plus.runAllTests",
      (resourceUri: vscode.Uri) => {
        // TODO: Implement this
        showInDevelopementNotification();
      }
    )
  );

  // Register a command to open files
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "eureka.plus.openFile",
      (resourceUri: vscode.Uri) => {
        treeDataProvider.selectedFolderPath = undefined;
        vscode.window.showTextDocument(resourceUri);
      }
    )
  );

  // Register a command that runs when any folder is selected
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "eureka.plus.folderSelect",
      (resourceUri: vscode.Uri) => {
        treeDataProvider.selectedFolderPath = resourceUri.fsPath;
      }
    )
  );

  // Register a command to start re-recording of test
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "eureka.plus.reRecordTest",
      (resourceUri: vscode.Uri) => {
        // TODO: Implement this
        showInDevelopementNotification();
      }
    )
  );

  // Register a command to view AI Generated summaries for tests
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "eureka.plus.viewTestSummary",
      (resourceUri: vscode.Uri) => {
        // TODO: Implement this
        showInDevelopementNotification();
      }
    )
  );

  // Register a command to run the test case
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "eureka.plus.runTest",
      (resourceUri: vscode.Uri) => {
        // TODO: Implement this
        showInDevelopementNotification();
      }
    )
  );

  // Register a command to run the test case
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "eureka.plus.runAllTestsInFolder",
      (resourceUri: vscode.Uri) => {
        // TODO: Implement this
        showInDevelopementNotification();
      }
    )
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
