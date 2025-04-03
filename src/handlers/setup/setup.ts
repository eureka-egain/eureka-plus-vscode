import * as vscode from "vscode";
import * as os from "os";
import fs from "fs-extra";
import { paths } from "../../utils/paths";
import setupNodeJS from "./setupNodeJS";
import installBrowsers from "./installBrowsers";

const doesNodePathExists = () => {
  const nodePath = paths.getNodePath();
  switch (os.platform()) {
    case "win32":
      return fs.existsSync(nodePath);
    default:
      return fs.pathExistsSync(nodePath);
  }
};

const preChecks = (context: vscode.ExtensionContext) => {
  let shouldSetupNodeJS = false;
  let shouldInstallBrowsers = false;

  if (!doesNodePathExists()) {
    shouldSetupNodeJS = true;
    shouldInstallBrowsers = true;
  } else {
    const browsersPath = paths.getBrowsersPath();
    const requiredBrowsers = ["chromium", "webkit", "firefox", "ffmpeg"];
    const installedBrowsers = fs.existsSync(browsersPath)
      ? fs
          .readdirSync(browsersPath)
          .filter((folderName) =>
            requiredBrowsers.some((browser) => folderName.startsWith(browser))
          )
      : [];
    const areBrowsersInstalled = requiredBrowsers.every((browser) =>
      installedBrowsers.some((folderName) => folderName.startsWith(browser))
    );
    if (!areBrowsersInstalled) {
      shouldInstallBrowsers = true;
    }
  }

  return {
    shouldSetupNodeJS,
    shouldInstallBrowsers,
  };
};

export default function (context: vscode.ExtensionContext) {
  const { shouldInstallBrowsers, shouldSetupNodeJS } = preChecks(context);
  if (shouldInstallBrowsers || shouldSetupNodeJS) {
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Eureka+",
        cancellable: false,
      },
      async (progress) => {
        if (shouldSetupNodeJS) {
          await setupNodeJS({
            progress,
          });
        }
        if (installBrowsers) {
          await installBrowsers({
            progress,
          });
        }
      }
    );
  }
}
