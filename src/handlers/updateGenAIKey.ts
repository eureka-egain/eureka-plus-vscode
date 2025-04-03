import * as vscode from "vscode";
import { secretStorageGeminiAPITokenKey } from "../utils/constants";

export default async function (context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage(
    "Click [here](https://aistudio.google.com/app/apikey) to get your own Gemini AI API Key."
  );
  const apiKey = await vscode.window.showInputBox({
    prompt: "Enter your Gemini AI API Key",
    placeHolder:
      "This key is securely stored and used for all AI powered features.",
    ignoreFocusOut: true,
    password: true,
  });

  if (!apiKey) {
    return;
  }

  if (apiKey === "") {
    vscode.window.showErrorMessage(
      "AI powered features require an API key. You can invoke this setup again from the Eureka+ Explorer View."
    );
    return;
  }

  // Store the API key securely
  await context.secrets.store(secretStorageGeminiAPITokenKey, apiKey);
  vscode.window.showInformationMessage("API Key saved securely.");
}
