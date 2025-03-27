import { exec } from 'child_process';
import * as os from 'os';
import * as vscode from 'vscode';

export default function (context: vscode.ExtensionContext) {
    // vscode.window.withProgress(
    //     {
    //         location: vscode.ProgressLocation.Notification,
    //         title: 'Eureka+',
    //         cancellable: false,
    //     },
    //     async (progress) => {
    //         progress.report({ message: 'Installing browser binaries' });

    //         // Install browser binaries
    //         const browserInstallCommand = `${playwrightPath} install`;
    //         await new Promise<void>((resolve, reject) => {
    //             exec(browserInstallCommand, (error, stdout, stderr) => {
    //                 if (error) {
    //                     vscode.window.showErrorMessage(`Error installing browsers: ${error.message}`);
    //                     reject(error);
    //                     return;
    //                 }
    //                 if (stderr) {
    //                     vscode.window.showErrorMessage(`Stderr: ${stderr}`);
    //                     reject(stderr);
    //                     return;
    //                 }
    //                 vscode.window.showInformationMessage(`Browser binaries installed successfully`);
    //                 resolve();
    //             });
    //         });

    //         // Install dependencies only if the OS is Linux
    //         if (os.platform() === 'linux') {
    //             progress.report({ message: 'Installing Linux dependencies...' });

    //             const depsInstallCommand = `${playwrightPath} install-deps`;
    //             await new Promise<void>((resolve, reject) => {
    //                 exec(depsInstallCommand, (error, stdout, stderr) => {
    //                     if (error) {
    //                         vscode.window.showErrorMessage(`Error installing dependencies: ${error.message}`);
    //                         reject(error);
    //                         return;
    //                     }
    //                     if (stderr) {
    //                         vscode.window.showErrorMessage(`Stderr: ${stderr}`);
    //                         reject(stderr);
    //                         return;
    //                     }
    //                     vscode.window.showInformationMessage(`Linux dependencies installed successfully`);
    //                     resolve();
    //                 });
    //             });
    //         }
    //     }
    // );
};