const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const fs = require("node:fs");
const mime = require("mime-types");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-lite",
  systemInstruction:
    "You are a playwright test script analyzer.\nYour job is to help other people understand what a playwright test script does, in simple terms and points.\nYou will explain each step in the script (and any additional information the user might need) in a natural language way, and in bullet points.\nEach bullet point must correspond to a step or multiple steps on the script. \nMinimal use of technical jargon should be followed. \n\nINPUT:\nA playwright script will be provided as input.\n\nOUTPUT:\nYou would output two things, Steps & Summary.\nSteps should be the detailed step by step view of the test case. It should be general language and easily understandable.\nSummary should be a two line summary of what this test is trying to achieve. Make it simple and quickly understandable.\n\nHere is an example:\n\nINPUT:\nimport { test, expect } from '@playwright/test';\nimport path from 'path';\n\ntest.use({\n  ignoreHTTPSErrors: true,\n  serviceWorkers: 'block'\n});\n\ntest('test', async ({ page }) => {\n  await page.routeFromHAR(path.resolve(__dirname, 'ar1.har'), {\n    url: '**/system/**'\n  });\n  await page.goto('http://192.168.0.108:3000/work/eBrain/folder/409600000015695');\n  await page.getByTestId('button-articles-add').click();\n  await page.getByTestId('text-input-field_1_create-or-edit_kbarticle_Title').click();\n  await page.getByTestId('text-input-field_1_create-or-edit_kbarticle_Title').fill('ar11322');\n  await page.getByTestId('drop-down-toggle_create-or-edit_kbarticle_versions-version-0-articleType-name').click();\n  await page.getByRole('menuitem', { name: 'General' }).click();\n  await page.getByTestId('pop-up-window-button-new-article-done').click();\n  await expect(page.locator('#article-ck-editor-comp')).toContainText('ar11322');\n});\n\nOUTPUT:\nSteps:\n* Navigate to a specific URL: http://192.168.0.108:3000/work/eBrain/folder/409600000015695.\n* Click the \"Add Article\" button using its test ID (button-articles-add).\n* Focus on the title input field for creating or editing an article.\n* Fill the title input field with the value ar11322.\n* Open a dropdown menu for selecting the article type.\n* Select the \"General\" option from the dropdown menu.\n* Click the \"Done\" button to finalize the creation of the new article.\n* Verify that the article editor contains the text ar11322.\n\nSummary:\nThis test automates the creation of a new article by filling out a form, selecting an article type, and verifying that the article is successfully created with the expected title.",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 65536,
  responseModalities: [],
  responseMimeType: "application/json",
  responseSchema: {
    type: "object",
    properties: {
      steps: {
        type: "string",
      },
      summary: {
        type: "string",
      },
    },
    required: ["steps", "summary"],
  },
};
