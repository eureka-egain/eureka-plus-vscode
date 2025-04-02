import * as vscode from "vscode";
import { secretStorageGeminiAPITokenKey } from "../utils/constants";

export default async function (context: vscode.ExtensionContext) {
  const apiKey = await vscode.window.showInputBox({
    prompt: "Enter your new Gemini AI API Key",
    placeHolder: "This key is required to use GenAI features",
    ignoreFocusOut: true,
    password: true,
  });

  if (!apiKey) {
    vscode.window.showErrorMessage(
      "GenAI features will not be functional now. You can invoke this setup again from the Eureka+ Explorer View."
    );
    return;
  }

  // Store the API key securely
  await context.secrets.store(secretStorageGeminiAPITokenKey, apiKey);
  vscode.window.showInformationMessage("API Key saved securely.");
}
