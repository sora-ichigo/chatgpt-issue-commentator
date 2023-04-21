import * as core from "@actions/core";
import * as github from "@actions/github";
import * as openai from "openai";
import { ChatCompletionRequestMessage } from "openai";

import { getChatGPTResponse } from "./chatgpt";
import { createGitHubIssueComment } from "./github";

export const run = async () => {
  const githubToken = core.getInput("github-token");
  const octokit = github.getOctokit(githubToken);
  const openaiApiKey = core.getInput("openai-api-key");
  const context = github.context;
  const payload = context.payload;

  // Only support github issue.
  const issueNumber = payload.issue?.number;
  if (!issueNumber) throw new Error("failed to get issue number.");

  // Only perform when includes `/chatgpt` in comment.
  if (!hasTriggerWord(payload.comment?.body)) return;

  // Get current chat messages.
  const { owner, repo } = context.repo;
  const allComments = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: issueNumber,
  });
  const messages: ChatCompletionRequestMessage[] = allComments.data.map(
    convertToChatCompletionRequestMessage
  );

  // Generate next chat message.
  const configuration = new openai.Configuration({
    apiKey: openaiApiKey,
  });
  const chatGPTResponse = await getChatGPTResponse(configuration, messages);
  if (!chatGPTResponse) throw new Error("failed to get chatgpt response.");

  // Comment to issue.
  await createGitHubIssueComment(githubToken, issueNumber, chatGPTResponse);
};

const TRIGGER_WORD = "/chatgpt";
const hasTriggerWord = (body: string): boolean => {
  return body !== "" && body.includes(TRIGGER_WORD);
};

// TODO: not implement
const convertToChatCompletionRequestMessage = (
  comment: any
): ChatCompletionRequestMessage => {
  return {
    role: "user",
    content: "hoge",
  };
};
