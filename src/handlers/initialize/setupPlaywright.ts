import fs from "fs-extra";
import * as vscode from "vscode";
import { paths } from "../../utils/paths";
import { common } from "../../utils/common";
import {
  playwrightLibraryPath,
  playwrightTestLibraryPath,
} from "../../utils/constants";
import path from "path";

export default async function ({ workspaceRoot }: { workspaceRoot: string }) {
  return new Promise<void>((resolve) => {
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Eureka+",
        cancellable: false,
      },
      async (progress) => {
        const npmPath = paths.getNPMPath();
        const pathToNode = paths.getNodePath();
        fs.ensureDirSync(paths.getExtensionRuntimeFolder(workspaceRoot));

        progress.report({
          message: "Setup up playwright...",
        });

        await common.runProcess({
          // env with the path to the browsers folder
          // is setup in the common.ts file
          command: `${pathToNode} ${npmPath} init -y && ${pathToNode} ${npmPath} install @playwright/test@${playwrightTestLibraryPath} playwright@${playwrightLibraryPath} && ${pathToNode} ${npmPath} install -D @types/node typescript`,
          cwd: paths.getExtensionRuntimeFolder(workspaceRoot),
          onStderr(props) {
            console.log("npm stderr:", props.data);
            vscode.window.showErrorMessage(
              `Error setting up playwright: ${props.data}`
            );
            props.resolve();
          },
          onError(props) {
            console.error("Error setting up playwright:", props.error);
            props.resolve();
          },
          onExit({ code, resolve }) {
            if (code === 0) {
              vscode.window.showInformationMessage(
                `Playwright setup completed successfully!`
              );
              resolve();
            } else {
              vscode.window.showErrorMessage(
                `Error setting up playwright: ${code}`
              );
              resolve();
            }
          },
        });

        // create tsconfig.json
        const tsconfigPath = paths.getExtensionRuntimeFolder(workspaceRoot);
        const tsconfig = {
          compilerOptions: {
            types: ["node"],
            esModuleInterop: true,
          },
        };
        fs.writeFileSync(
          path.join(tsconfigPath, "tsconfig.json"),
          JSON.stringify(tsconfig, null, 2)
        );

        resolve();
      }
    );
  });
}
