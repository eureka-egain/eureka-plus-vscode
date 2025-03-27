import * as vscode from "vscode";
import { TreeViewProvider } from "./providers/TreeViewProvider";
import { handlers } from "./handlers";
import { showInDevelopementNotification } from "./handlers/common";

export function activate(context: vscode.ExtensionContext) {
	// Register the Tree View
	const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

	// ---------------------------------------------------------------

	handlers.setupPlaywright(context);

	// ---------------------------------------------------------------

	const treeDataProvider = new TreeViewProvider(workspaceRoot);
	vscode.window.registerTreeDataProvider("eplusTestsView", treeDataProvider);

	// ---------------------------------------------------------------

	// OPEN SETTINGS
	context.subscriptions.push(
		vscode.commands.registerCommand("egain-eureka-plus.extensionSettings", () => {
			vscode.commands.executeCommand(
				"workbench.action.openSettings",
				"eureka+"
			);
		})
	);

	// INSTALL DEPENDENCIES
	context.subscriptions.push(
		vscode.commands.registerCommand("egain-eureka-plus.installDependencies", () => {
			handlers.installDependencies(context);
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
		vscode.commands.registerCommand(
			"egain-eureka-plus.recordNewTest",
			() => {
				handlers.startNewTestRecording({
					context,
					recordFsPath: treeDataProvider.selectedFolderPath,
				});
			}
		)
	);

	// RUN ALL TEST CASES
	context.subscriptions.push(
		vscode.commands.registerCommand(
			"egain-eureka-plus.runAllTests",
			() => {
				// TODO: Implement this
				showInDevelopementNotification();
			}
		)
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
			() => {
				// TODO: Implement this
				showInDevelopementNotification();
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
			() => {
				// TODO: Implement this
				showInDevelopementNotification();
			}
		)
	);

	// VIEW TEST SUMMARY
	context.subscriptions.push(
		vscode.commands.registerCommand(
			"egain-eureka-plus.viewTestSummary",
			() => {
				// TODO: Implement this
				showInDevelopementNotification();
			}
		)
	);

	// RUN TEST
	context.subscriptions.push(
		vscode.commands.registerCommand(
			"egain-eureka-plus.runTest",
			(resourceUri: any) => {
				console.log("Running test", resourceUri);
				const path = resourceUri["resourceUri"]["path"] as string;
				const testFolderPath = path.substring(0, path.lastIndexOf("/"));
				const testFileName = path.substring(path.lastIndexOf("/") + 1);
				handlers.runTest({
					context,
					testFolderPath,
					testFileName
				});
			}
		)
	);
}

// This method is called when your extension is deactivated
export function deactivate() { }
