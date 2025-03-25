import * as vscode from 'vscode';
import { TreeViewProvider } from './providers/TreeViewProvider';
import { handlers } from './handlers';

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
			handlers.startNewTestRecording(context);
		})
	);

	// Register a command to open files
	context.subscriptions.push(
		vscode.commands.registerCommand('eureka-plus-vscode.openFile', (resourceUri: vscode.Uri) => {
			vscode.window.showTextDocument(resourceUri);
		})
	);

	// Register a command to start re-recording of test
	context.subscriptions.push(
		vscode.commands.registerCommand('eureka-plus-vscode.reRecordTest', (resourceUri: vscode.Uri) => {
			vscode.window.showTextDocument(resourceUri);
		})
	);

	// Register a command to view AI Generated summaries for tests
	context.subscriptions.push(
		vscode.commands.registerCommand('eureka-plus-vscode.viewTestSummary', (resourceUri: vscode.Uri) => {
			vscode.window.showTextDocument(resourceUri);
		})
	);

	// Register a command to run the test case
	context.subscriptions.push(
		vscode.commands.registerCommand('eureka-plus-vscode.runTest', (resourceUri: vscode.Uri) => {
			vscode.window.showTextDocument(resourceUri);
		})
	);

	// context.subscriptions.push(
	// 	vscode.commands.registerCommand('eureka-plus-vscode.addTestFile', async () => {
	// 		if (!workspaceRoot) {
	// 			vscode.window.showErrorMessage('No workspace folder found');
	// 			return;
	// 		}

	// 		const fileName = await vscode.window.showInputBox({
	// 			placeHolder: 'Enter the name of the new test file (e.g., newTest.spec.ts)',
	// 		});

	// 		if (fileName) {
	// 			const filePath = path.join(workspaceRoot, 'eplus-tests', fileName);
	// 			fs.writeFileSync(filePath, '// New test file content', 'utf8');
	// 			vscode.window.showInformationMessage(`Test file created: ${fileName}`);
	// 			treeDataProvider.refresh();
	// 		}
	// 	})
	// );
}

// This method is called when your extension is deactivated
export function deactivate() { }
