import * as vscode from "vscode";
import { getGenAI } from "../utils/genAI";
import fs from "fs-extra";
import path from "path";
import { SchemaType } from "@google/generative-ai";
import { generateSummaryPrompt } from "../prompts/generateSummary";

export default async function ({
  context,
  pathToTestFile,
}: {
  context: vscode.ExtensionContext;
  pathToTestFile: string;
}) {
  const genAI = await getGenAI(context);
  if (!genAI) {
    vscode.window.showErrorMessage(
      "Unable to initialize the Generative AI model. Please check your API key."
    );
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

  console.log({ result: result.response.text() });
  try {
    const resultJSON = JSON.parse(result.response.text()) as {
      steps: string;
      summary: string;
    };

    if (resultJSON.steps && resultJSON.summary) {
      // Define the output file path
      const outputFilePath = path.join(
        path.dirname(pathToTestFile),
        `${testFileName}_summary.txt`
      );

      // Format the data in a presentable way
      const formattedData = `=== Summary for Test File: ${testFileName} ===

Steps:
${resultJSON.steps
  .split("\n")
  .map((step, index) => `${index + 1}. ${step}`)
  .join("\n")}

Summary:
${resultJSON.summary}
`;

      // Write the formatted data to the file
      await fs.writeFile(outputFilePath, formattedData);

      vscode.window.showInformationMessage(
        `Summary successfully written to ${outputFilePath}`
      );

      vscode.workspace
        .openTextDocument(outputFilePath)
        .then(vscode.window.showTextDocument);
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      "Unable to parse the response from the Generative AI model. Please try again."
    );
    return;
  }
}
