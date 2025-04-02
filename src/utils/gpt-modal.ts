import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
const fs = require("node:fs");
const mime = require("mime-types");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey ?? "");

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-lite",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseModalities: [],
  responseMimeType: "text/plain",
};

export const getGPTChatSession = () => {
  const chatSession = model.startChat({
    generationConfig,
    history: [
      {
        role: "user",
        parts: [
          {
            text: "You are a playwright test script analyzer. Your job is to help other people understand what a playwright test script does, in simple terms and points. You will explain each step in the script (and any additional information the user might need) in a natural language way, and in bullet points. Each bullet point must correspond to a step or multiple steps on the script. Minimal use of technical jargon should be followed. \n\nHere is an example script:\nimport { test, expect } from '@playwright/test';\nimport path from 'path';\n\ntest.use({\n  ignoreHTTPSErrors: true,\n  serviceWorkers: 'block'\n});\n\ntest('test', async ({ page }) => {\n  await page.routeFromHAR(path.resolve(__dirname, 'ar1.har'), {\n    url: '**/system/**'\n  });\n  await page.goto('http://192.168.0.108:3000/work/eBrain/folder/409600000015695');\n  await page.getByTestId('button-articles-add').click();\n  await page.getByTestId('text-input-field_1_create-or-edit_kbarticle_Title').click();\n  await page.getByTestId('text-input-field_1_create-or-edit_kbarticle_Title').fill('ar11322');\n  await page.getByTestId('drop-down-toggle_create-or-edit_kbarticle_versions-version-0-articleType-name').click();\n  await page.getByRole('menuitem', { name: 'General' }).click();\n  await page.getByTestId('pop-up-window-button-new-article-done').click();\n  await expect(page.locator('#article-ck-editor-comp')).toContainText('ar11322');\n});\n\nYour output would be:\n* Navigate to a specific URL: http://192.168.0.108:3000/work/eBrain/folder/409600000015695.\n* Click the \"Add Article\" button using its test ID (button-articles-add).\n* Focus on the title input field for creating or editing an article.\n* Fill the title input field with the value ar11322.\n* Open a dropdown menu for selecting the article type.\n* Select the \"General\" option from the dropdown menu.\n* Click the \"Done\" button to finalize the creation of the new article.\n* Verify that the article editor contains the text ar11322.\n\nAlso provide a two line summary of what this test is trying to achieve. For the above example, the summary would be:\nThis test automates the creation of a new article by filling out a form, selecting an article type, and verifying that the article is successfully created with the expected title.",
          },
        ],
      },
    ],
  });
};

async function run() {
  const chatSession = model.startChat({
    generationConfig,
    history: [
      {
        role: "user",
        parts: [
          {
            text: "You are a playwright test script analyzer. Your job is to help other people understand what a playwright test script does, in simple terms and points. You will explain each step in the script (and any additional information the user might need) in a natural language way, and in bullet points. Each bullet point must correspond to a step or multiple steps on the script. Minimal use of technical jargon should be followed. \n\nHere is an example script:\nimport { test, expect } from '@playwright/test';\nimport path from 'path';\n\ntest.use({\n  ignoreHTTPSErrors: true,\n  serviceWorkers: 'block'\n});\n\ntest('test', async ({ page }) => {\n  await page.routeFromHAR(path.resolve(__dirname, 'ar1.har'), {\n    url: '**/system/**'\n  });\n  await page.goto('http://192.168.0.108:3000/work/eBrain/folder/409600000015695');\n  await page.getByTestId('button-articles-add').click();\n  await page.getByTestId('text-input-field_1_create-or-edit_kbarticle_Title').click();\n  await page.getByTestId('text-input-field_1_create-or-edit_kbarticle_Title').fill('ar11322');\n  await page.getByTestId('drop-down-toggle_create-or-edit_kbarticle_versions-version-0-articleType-name').click();\n  await page.getByRole('menuitem', { name: 'General' }).click();\n  await page.getByTestId('pop-up-window-button-new-article-done').click();\n  await expect(page.locator('#article-ck-editor-comp')).toContainText('ar11322');\n});\n\nYour output would be:\n* Navigate to a specific URL: http://192.168.0.108:3000/work/eBrain/folder/409600000015695.\n* Click the \"Add Article\" button using its test ID (button-articles-add).\n* Focus on the title input field for creating or editing an article.\n* Fill the title input field with the value ar11322.\n* Open a dropdown menu for selecting the article type.\n* Select the \"General\" option from the dropdown menu.\n* Click the \"Done\" button to finalize the creation of the new article.\n* Verify that the article editor contains the text ar11322.\n\nAlso provide a two line summary of what this test is trying to achieve. For the above example, the summary would be:\nThis test automates the creation of a new article by filling out a form, selecting an article type, and verifying that the article is successfully created with the expected title.",
          },
        ],
      },
    ],
  });

  const result = await chatSession.sendMessage("INSERT_INPUT_HERE");
  const candidates = result.response.candidates;
  //   for (
  //     let candidate_index = 0;
  //     candidate_index < candidates.length;
  //     candidate_index++
  //   ) {
  //     for (
  //       let part_index = 0;
  //       part_index < candidates[candidate_index].content.parts.length;
  //       part_index++
  //     ) {
  //       const part = candidates[candidate_index].content.parts[part_index];
  //       if (part.inlineData) {
  //         try {
  //           const filename = `output_${candidate_index}_${part_index}.${mime.extension(
  //             part.inlineData.mimeType
  //           )}`;
  //           fs.writeFileSync(
  //             filename,
  //             Buffer.from(part.inlineData.data, "base64")
  //           );
  //           console.log(`Output written to: ${filename}`);
  //         } catch (err) {
  //           console.error(err);
  //         }
  //       }
  //     }
  //   }
  console.log(result.response.text());
}
