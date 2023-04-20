import * as core from "@actions/core";
import * as github from "@actions/github";
import * as openai from "openai";

import { getChatGPTResponse } from "./chatgpt";
import { createGitHubIssueComment } from "./github";

// const MENTION = "@chatgpt-issue-commentator";

export const run = async () => {
  const githubToken = core.getInput("github-token");
  const openaiApiKey = core.getInput("openai-api-key");
  const context = github.context;

  const issueNumber = context.payload.issue?.number;
  if (!issueNumber) {
    throw new Error("failed to get issue number.");
  }

  const chatGPTResponse = await getChatGPTResponse(
    new openai.Configuration({
      apiKey: openaiApiKey,
    })
  );
  if (!chatGPTResponse) {
    throw new Error("failed to get chatgpt response.");
  }

  await createGitHubIssueComment(githubToken, issueNumber, chatGPTResponse);
};

try {
  run();
} catch (e: any) {
  core.setFailed(e instanceof Error ? e.message : JSON.stringify(e));
}
