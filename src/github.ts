import * as github from "@actions/github";

export const createGitHubIssueComment = async (
  githubToken: string,
  issueNumber: number,
  body: string
) => {
  const octokit = github.getOctokit(githubToken);
  const context = github.context;
  const { owner, repo } = context.repo;

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body,
  });
};
