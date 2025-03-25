import * as vscode from 'vscode';
import { TreeViewProvider } from './providers/TreeViewProvider';
import { handlers } from './handlers';
import { showInDevelopementNotification } from './handlers/common';

export function activate(context: vscode.ExtensionContext) {
	// Register the Tree View
	const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
	const treeDataProvider = new TreeViewProvider(workspaceRoot);
	vscode.window.registerTreeDataProvider('eplusTestsView', treeDataProvider);

	// Register a command to install all playwright dependencies
	context.subscriptions.push(
		vscode.commands.registerCommand('eureka-plus-vscode.installDependencies', (resourceUri: vscode.Uri) => {
			handlers.installDependencies(context);
		})
	);

	// Register a command to refresh the Tree View
	context.subscriptions.push(
		vscode.commands.registerCommand('eureka-plus-vscode.refreshTreeView', () => {
			treeDataProvider.refresh();
		})
	);

	// Register a command to start a new test recording
	context.subscriptions.push(
		vscode.commands.registerCommand('eureka-plus-vscode.recordNewTest', (resourceUri: vscode.Uri) => {
			handlers.startNewTestRecording({ context, recordFsPath: treeDataProvider.selectedFolderPath });
		})
	);

	// Register a command to run all test cases in test folder
	context.subscriptions.push(
		vscode.commands.registerCommand('eureka-plus-vscode.runAllTests', (resourceUri: vscode.Uri) => {
			// TODO: Implement this
			showInDevelopementNotification();
		})
	);

	// Register a command to open files
	context.subscriptions.push(
		vscode.commands.registerCommand('eureka-plus-vscode.openFile', (resourceUri: vscode.Uri) => {
			treeDataProvider.selectedFolderPath = undefined;
			vscode.window.showTextDocument(resourceUri);
		})
	);

	// Register a command that runs when any folder is selected
	context.subscriptions.push(
		vscode.commands.registerCommand('eureka-plus-vscode.folderSelect', (resourceUri: vscode.Uri) => {
			treeDataProvider.selectedFolderPath = resourceUri.fsPath;
		})
	);

	// Register a command to start re-recording of test
	context.subscriptions.push(
		vscode.commands.registerCommand('eureka-plus-vscode.reRecordTest', (resourceUri: vscode.Uri) => {
			// TODO: Implement this
			showInDevelopementNotification();
		})
	);

	// Register a command to view AI Generated summaries for tests
	context.subscriptions.push(
		vscode.commands.registerCommand('eureka-plus-vscode.viewTestSummary', (resourceUri: vscode.Uri) => {
			// TODO: Implement this
			showInDevelopementNotification();
		})
	);

	// Register a command to run the test case
	context.subscriptions.push(
		vscode.commands.registerCommand('eureka-plus-vscode.runTest', (resourceUri: vscode.Uri) => {
			// TODO: Implement this
			showInDevelopementNotification();
		})
	);

	// Register a command to run the test case
	context.subscriptions.push(
		vscode.commands.registerCommand('eureka-plus-vscode.runAllTestsInFolder', (resourceUri: vscode.Uri) => {
			// TODO: Implement this
			showInDevelopementNotification();
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() { }
