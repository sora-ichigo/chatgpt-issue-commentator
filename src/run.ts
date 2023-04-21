import * as core from "@actions/core";
import * as github from "@actions/github";
import * as openai from "openai";

import { getChatGPTResponse } from "./chatgpt";
import { createGitHubIssueComment } from "./github";

export const run = async () => {
  const githubToken = core.getInput("github-token");
  const openaiApiKey = core.getInput("openai-api-key");
  const context = github.context;
  const payload = context.payload;

  // only support github issue.
  const issueNumber = payload.issue?.number;
  if (!issueNumber) throw new Error("failed to get issue number.");

  // get current comment body. and check whether includes TRIGGER_WORD.
  const commentBody = payload.comment?.body as string;
  if (!hasTriggerWord(commentBody)) return;

  // TODO: get previous chat messages.

  // get chatgpt response.
  const configuration = new openai.Configuration({
    apiKey: openaiApiKey,
  });
  const chatGPTResponse = await getChatGPTResponse(
    configuration,
    commentBody.replace(TRIGGER_WORD, "")
  );
  if (!chatGPTResponse) throw new Error("failed to get chatgpt response.");

  // comment issue.
  await createGitHubIssueComment(githubToken, issueNumber, chatGPTResponse);
};

const TRIGGER_WORD = "/chatgpt";
const hasTriggerWord = (body: string): boolean => {
  return body !== "" && body.includes(TRIGGER_WORD);
};
