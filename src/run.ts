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
  const githubIssueContext = core.getInput("github-issue-context");
  const context = github.context;
  const payload = context.payload;

  // Only support github issue.
  const issueNumber = payload.issue?.number;
  if (!issueNumber) throw new Error("failed to get issue number.");

  // Only perform when includes `/chatgpt` in comment.
  if (!hasTriggerWord(payload.comment?.body)) return;

  const { owner, repo } = context.repo;
  // Get issue data.
  const issue = await octokit.rest.issues.get({
    owner,
    repo,
    issue_number: issueNumber,
  });
  const issueComments = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: issueNumber,
  });
  const allCommentsOrderByCreatedAt = issueComments.data.sort((a, b) => {
    const aCreatedAt = new Date(a.created_at).getTime();
    const bCreatedAt = new Date(b.created_at).getTime();

    if (aCreatedAt < bCreatedAt) return -1;
    if (aCreatedAt > bCreatedAt) return 1;
    return 0;
  });

  // List current chat messages.
  let messages: ChatCompletionRequestMessage[] = allCommentsOrderByCreatedAt
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

  // TODO: not implement
  // if enable `github-issue-context`.
  // if (Number(githubIssueContext) === 1) {
  //   const systemPromptParts = generateSystemPrompts(
  //     issue.data,
  //     issueComments.data
  //   );

  //   messages = [
  //     {
  //       role: "system",
  //       content: systemPromptParts[0],
  //     },
  //     ...messages,
  //   ];
  // }

  const chatGPTResponse = await getChatGPTResponse(configuration, messages);
  if (!chatGPTResponse) throw new Error("failed to get chatgpt response.");

  // Comment to issue.
  await createGitHubIssueComment(
    githubToken,
    issueNumber,
    `${BOT_KEYWORD}

${chatGPTResponse}
`
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

const generateSystemPrompts = (
  issueData: any,
  issueComments: any
): string[] => {
  const fullSystemPrompt = `
#Instruction
You are a skilled software engineer. Based on the content of the Issue and Issue Comment provided below, please become a conversation partner in the following discussions.
Due to the character limit, the text will be divided into several messages. When you reply to a message, please send the whole text without dividing it in the middle.

#Issue Content
##number
${issueData.number}

##title
${issueData.title}

##description
${issueData.description}

##body
${issueData.body}

##url
${issueData.html_url}

##pull_request_url
{issueData.pull_request?.html_url}

##state
${issueData.state}

##created_at
${issueData.created_at}

##created_at
${issueData.updated_at}

##assignee
${issueData.assignee?.login}

##Issue Comment Content
${issueComments
  .map(
    (comment: any) => `
##comment at ${comment.created_at}

body: ${comment.body}
user: ${comment.user?.login}
url: ${comment.html_url}
`
  )
  .join("\n")}`;

  return sliceTextByTokens(fullSystemPrompt, 500);
};

function sliceTextByTokens(text: string, approxTokensLimit: number): string[] {
  const chunks: string[] = [];

  // Assuming 1 token = 1.5 characters, as an approximation
  const approxCharsLimit = approxTokensLimit / 1.5;
  let startIndex = 0;
  while (startIndex < text.length) {
    const endIndex =
      startIndex + Math.min(approxCharsLimit, text.length - startIndex);
    const chunk = text.slice(startIndex, endIndex);
    chunks.push(chunk);

    startIndex = endIndex;
  }

  return chunks;
}
