import { GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";
import * as vscode from "vscode";
import { secretStorageGeminiAPITokenKey } from "./constants";

let genAI: GoogleGenerativeAI;

export const getGenAI = async (context: vscode.ExtensionContext) => {
  if (genAI) {
    return genAI;
  }

  const apiKey = await context.secrets.get(secretStorageGeminiAPITokenKey);
  if (!apiKey) {
    vscode.window.showErrorMessage(
      "Google Gemini API key is not available. GenAI capabilities will not work."
    );
    return;
  }

  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
};
