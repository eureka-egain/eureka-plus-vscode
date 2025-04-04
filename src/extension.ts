import * as vscode from "vscode";
import { TreeViewProvider } from "./providers/TreeViewProvider";
import { handlers } from "./handlers";
import path from "path";
import { paths } from "./utils/paths";

export function activate(context: vscode.ExtensionContext) {
  // Register the Tree View
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  // ---------------------------------------------------------------

  handlers.setupNodeJS();

  // ---------------------------------------------------------------

  const treeDataProvider = new TreeViewProvider(workspaceRoot);
  vscode.window.registerTreeDataProvider("eplusTestsView", treeDataProvider);

  // ---------------------------------------------------------------

  // OPEN SETTINGS
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "egain-eureka-plus.extensionSettings",
      () => {
        vscode.commands.executeCommand(
          "workbench.action.openSettings",
          "eureka+"
        );
      }
    )
  );

  // INITIALIZE
  context.subscriptions.push(
    vscode.commands.registerCommand("egain-eureka-plus.initialize", () => {
      handlers.initialize();
    })
  );

  // UPDATE GEMINI KEY
  context.subscriptions.push(
    vscode.commands.registerCommand("egain-eureka-plus.updateGenAIKey", () => {
      handlers.updateGenAIKey(context);
    })
  );

  // REFRESH TREE VIEW
  context.subscriptions.push(
    vscode.commands.registerCommand("egain-eureka-plus.refreshTreeView", () => {
      treeDataProvider.refresh();
    })
  );

  // ---------------------------------------------------------------

  // START NEW RECORDING
  context.subscriptions.push(
    vscode.commands.registerCommand("egain-eureka-plus.recordNewTest", () => {
      const workspaceRoot = paths.getWorkspaceRoot();
      if (workspaceRoot) {
        const extensionRuntimePath =
          paths.getExtensionRuntimeFolder(workspaceRoot);
        handlers.startNewTestRecording({
          context,
          recordToPath:
            treeDataProvider.selectedFolderPath || extensionRuntimePath,
        });
      }
    })
  );

  // RUN ALL TEST CASES
  context.subscriptions.push(
    vscode.commands.registerCommand("egain-eureka-plus.runAllTests", () => {
      handlers.runAllTests();
    })
  );

  // ---------------------------------------------------------------

  // FOLDER SELECT
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "egain-eureka-plus.selectFolder",
      (resourceUri: vscode.Uri) => {
        treeDataProvider.selectedFolderPath = resourceUri.fsPath;
      }
    )
  );

  // RUN ALL TESTS IN FOLDER
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "egain-eureka-plus.runAllTestsInFolder",
      (treeItem: vscode.TreeItem) => {
        const pathToFolder = treeItem.resourceUri?.fsPath;
        if (pathToFolder) {
          handlers.runTestInFolder({
            folderPath: pathToFolder,
          });
        }
      }
    )
  );

  // ---------------------------------------------------------------

  // OPEN FILE
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "egain-eureka-plus.openFile",
      (resourceUri: vscode.Uri) => {
        treeDataProvider.selectedFolderPath = undefined;
        vscode.window.showTextDocument(resourceUri);
      }
    )
  );

  // RE-RECORD TEST
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "egain-eureka-plus.reRecordTest",
      (treeItem: vscode.TreeItem) => {
        console.log({ treeItem });
        // handlers.startNewTestRecording({
        //   context,
        //   recordToPath: treeDataProvider.selectedFolderPath,
        // });
      }
    )
  );

  // VIEW TEST SUMMARY
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "egain-eureka-plus.viewTestSummary",
      (treeItem: vscode.TreeItem) => {
        console.log({ treeItem });
        if (treeItem.resourceUri?.fsPath) {
          handlers.generateSummary({
            context,
            pathToTestFile: treeItem.resourceUri?.fsPath,
          });
        } else {
          vscode.window.showErrorMessage(
            "Unable to generate summary. Test file path is not available."
          );
        }
      }
    )
  );

  // VIEW TEST SUMMARY FROM EDITOR
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "egain-eureka-plus.viewTestSummaryFromEditor",
      (uri: vscode.Uri) => {
        if (uri.fsPath) {
          handlers.generateSummary({
            context,
            pathToTestFile: uri.fsPath,
          });
        } else {
          vscode.window.showErrorMessage(
            "Unable to generate summary. Test file path is not available."
          );
        }
      }
    )
  );

  // RUN TEST
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "egain-eureka-plus.runTest",
      (treeItem: vscode.TreeItem) => {
        const testPath = treeItem.resourceUri?.fsPath;
        if (testPath) {
          const testFolderPath = testPath.substring(
            0,
            testPath.lastIndexOf(path.sep)
          );
          const testFileName = path.basename(testPath);
          handlers.runTest({
            testFolderPath,
            testFileName,
          });
        }
      }
    )
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
