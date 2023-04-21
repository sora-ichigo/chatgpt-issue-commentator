import * as core from "@actions/core";
import * as github from "@actions/github";
import * as openai from "openai";
import { ChatCompletionRequestMessage } from "openai";

import { getChatGPTResponse } from "./chatgpt";
import { createGitHubIssueComment } from "./github";

export const USER_KEYWORD = "/chatgpt";
export const BOT_KEYWORD =
  "<!-- This comment is a response by chatgpt-issue-commentator. -->";

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

  const allCommentsOrderByCreatedAt = allComments.data.sort((a, b) => {
    const aCreatedAt = new Date(a.created_at).getTime();
    const bCreatedAt = new Date(b.created_at).getTime();

    if (aCreatedAt < bCreatedAt) return -1;
    if (aCreatedAt > bCreatedAt) return 1;
    return 0;
  });

  const messages: ChatCompletionRequestMessage[] = allCommentsOrderByCreatedAt
    .map(convertToChatCompletionRequestMessage)
    .filter(
      (
        v: ChatCompletionRequestMessage | undefined
      ): v is ChatCompletionRequestMessage => v !== undefined
    );

  // Generate next chat message.
  const configuration = new openai.Configuration({
    apiKey: openaiApiKey,
  });
  const chatGPTResponse = await getChatGPTResponse(configuration, messages);
  if (!chatGPTResponse) throw new Error("failed to get chatgpt response.");

  // Comment to issue.
  await createGitHubIssueComment(
    githubToken,
    issueNumber,
    `${BOT_KEYWORD}\n\n${chatGPTResponse}`
  );
};

const hasTriggerWord = (body: string): boolean => {
  const TRIGGER_WORD = USER_KEYWORD;
  return body !== "" && body.includes(TRIGGER_WORD);
};

const convertToChatCompletionRequestMessage = (comment: {
  body?: string | undefined;
}): ChatCompletionRequestMessage | undefined => {
  const message: ChatCompletionRequestMessage = { role: "user", content: "" };

  if (comment.body?.includes(USER_KEYWORD)) {
    message.role = "user";
    message.content = comment.body?.replace(USER_KEYWORD, "");
  } else if (comment.body?.includes(BOT_KEYWORD)) {
    message.role = "user";
    message.content = comment.body?.replace(BOT_KEYWORD, "");
  } else {
    return undefined;
  }

  return message;
};
