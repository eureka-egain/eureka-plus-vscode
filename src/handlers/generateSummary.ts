import * as vscode from "vscode";
import { getGenAI } from "../utils/genAI";
import fs from "fs-extra";
import path from "path";
import { SchemaType } from "@google/generative-ai";
import { generateSummaryPrompt } from "../prompts/generateSummary";

function getWebviewContent({
  steps,
  summary,
  testName,
}: {
  steps: string;
  summary: string;
  testName: string;
}) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test: ${testName}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:opsz@14..32&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: Inter, Arial, sans-serif;
          padding: 20px;
          background-color: #282c34;
        }
        h1 {
          color: #fff;
        }
        ol {
          margin: 0px;
          margin-top: -22px;
          padding-inline-start: 24px;
        }
        pre {
          padding-left: 10px;
          padding-right: 10px;
          border-radius: 5px;
          overflow-x: auto;
          text-wrap: auto;
          margin-bottom: 30px;
        }
      </style>
    </head>
    <body>
      <h1>Test: ${testName}</h1>
            <h2>Summary</h2>
      <pre>${summary}</pre>
      <h2>Steps</h2>
      <pre>${steps}</pre>
    </body>
    </html>
  `;
}

export default async function ({
  context,
  pathToTestFile,
}: {
  context: vscode.ExtensionContext;
  pathToTestFile: string;
}) {
  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Eureka+",
      cancellable: true,
    },
    async (progress) => {
      progress.report({
        message: "Generating test summary...",
      });
      const genAI = await getGenAI(context);
      if (!genAI) {
        return;
      }
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-lite",
        systemInstruction: generateSummaryPrompt,
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
      });

      const testFileContent = fs.readFileSync(pathToTestFile, "utf-8");
      if (!testFileContent) {
        vscode.window.showErrorMessage(
          "The test file is empty. Please provide a valid test file."
        );
        return;
      }

      const testFileName = path.basename(
        pathToTestFile,
        path.extname(pathToTestFile)
      );

      const chatSession = model.startChat({
        history: [],
      });

      const result = await chatSession.sendMessage(testFileContent);

      try {
        const resultJSON = JSON.parse(result.response.text()) as {
          steps: string;
          summary: string;
        };

        if (resultJSON.steps && resultJSON.summary) {
          // Create and show the Webview Panel
          const panel = vscode.window.createWebviewPanel(
            "testSummary", // Internal identifier
            "Test Summary", // Title of the panel
            vscode.ViewColumn.Beside, // Show in the first column
            {} // Webview options
          );

          // Set the HTML content for the Webview
          panel.webview.html = getWebviewContent({
            steps: resultJSON.steps,
            summary: resultJSON.summary,
            testName: testFileName,
          });
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          "Unable to parse the response from the Generative AI model. Please try again."
        );
        return;
      }
      return;
    }
  );
}
