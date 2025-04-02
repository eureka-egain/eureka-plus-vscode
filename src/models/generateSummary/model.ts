import {
  GenerativeModel,
  GoogleGenerativeAI,
  SchemaType,
} from "@google/generative-ai";
import * as vscode from "vscode";
import fs from "fs-extra";
import { secretStorageGeminiAPITokenKey } from "../../utils/constants";

let model: GenerativeModel;

export default async function (context: vscode.ExtensionContext) {
  if (model) {
    return model;
  }

  const apiKey = await context.secrets.get(secretStorageGeminiAPITokenKey);
  if (!apiKey) {
    vscode.window.showErrorMessage(
      "Google Gemini API key is not available. GenAI capabilities will not work."
    );
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const systemInstruction = fs.readFileSync("./prompt.txt", "utf-8");

  model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-lite",
    generationConfig: {
      temperature: 1,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 65536,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          steps: {
            type: SchemaType.STRING,
          },
          summary: {
            type: SchemaType.STRING,
          },
        },
        required: ["steps", "summary"],
      },
    },
    systemInstruction,
  });

  return model;
}
