import * as vscode from "vscode";
import * as os from "os";
import fs from "fs-extra";
import { paths } from "../../utils/paths";
import installBrowsers from "./installBrowsers";
import setupPlaywright from "./setupPlaywright";
import setupNodeJS from "../setupNodeJS";

const doesNodePathExists = () => {
  const nodePath = paths.getNodePath();
  switch (os.platform()) {
    case "win32":
      return fs.existsSync(nodePath);
    default:
      return fs.pathExistsSync(nodePath);
  }
};

const shouldInstallBrowsers = () => {
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
    return true;
  }
  return false;
};

export default async function () {
  if (!doesNodePathExists()) {
    await setupNodeJS();
  }
  const workspaceRoot = paths.getWorkspaceRoot();
  if (workspaceRoot) {
    const playwrightPath = paths.getPlaywrightCLIPath(workspaceRoot);
    if (!fs.existsSync(playwrightPath)) {
      await setupPlaywright({
        workspaceRoot,
      });
    }
    if (shouldInstallBrowsers()) {
      await installBrowsers({
        workspaceRoot,
      });
    }
  }

  vscode.commands.executeCommand("egain-eureka-plus.refreshTreeView");
}
