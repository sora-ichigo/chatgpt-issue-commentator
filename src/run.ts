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

  // TODO: コメント作成日順に照準ソートする
  const messages: ChatCompletionRequestMessage[] = allComments.data
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

  // TODO: chatGPTResponse に`<!-- This comment is a response by chatgpt-issue-commentator. -->`を含めるようにする
  // Comment to issue.
  await createGitHubIssueComment(githubToken, issueNumber, chatGPTResponse);
};

const TRIGGER_WORD = "/chatgpt";
const hasTriggerWord = (body: string): boolean => {
  return body !== "" && body.includes(TRIGGER_WORD);
};

const USER_KEYWORD = "/chatgpt";
const BOT_KEYWORD =
  "<!-- This comment is a response by chatgpt-issue-commentator. -->";
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
