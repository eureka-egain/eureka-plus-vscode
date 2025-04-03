import { GoogleGenerativeAI } from "@google/generative-ai";
import * as vscode from "vscode";
import { secretStorageGeminiAPITokenKey } from "./constants";
import updateGenAIKey from "../handlers/updateGenAIKey";

let genAI: GoogleGenerativeAI;

export const getGenAI = async (context: vscode.ExtensionContext) => {
  if (genAI) {
    return genAI;
  }

  const apiKey = await context.secrets.get(secretStorageGeminiAPITokenKey);
  if (!apiKey) {
    updateGenAIKey(context);
    return;
  }

  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
};
