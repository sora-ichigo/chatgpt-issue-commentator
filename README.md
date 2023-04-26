# ChatGPT Issue Commentator 🤖

ChatGPT Issue Commentator is a tool that allows you to interact with ChatGPT and request tasks within GitHub Issues.

## Features
⚠️ experimental

- [X] Interact with ChatGPT by including `/chatgpt` in a comment on a GitHub Issue.
- [ ] Request tasks from ChatGPT within GitHub Issues.
  - Example: Summarize the content of this Issue

![Screen Shot 2023-04-26 at 12 55 40](https://user-images.githubusercontent.com/66525257/234466054-9473eee8-8406-43e0-bd78-fd2ebe441b0a.png)

## Purpose

Developed to provide a better way to use ChatGPT in development with GitHub compared to existing ChatGPT interfaces. Specifically, it has the following advantages:

- Can be used by multiple people
- Can be viewed by others
- Not only for conversations, but also for requesting tasks related to Issues
  - Issue summarization/questions/...

## Key Technologies

- ChatGPT API
  - model: gpt-3.5-turbo
- GitHub Action

## Libraries

- Node.js
- [openai-node](https://github.com/openai/openai-node)

## Language

- TypeScript

## Setup

1. Create the following YAML file in the `.github/workflows` directory.

```yaml
name: Test ChatGPT Issue Commentator

on:
  issue_comment:
    types: [created]

permissions:
  issues: write

jobs:
  run_chatgpt_issue_commentator:
    runs-on: ubuntu-latest
    steps:
      - name: Run ChatGPT Issue Commentator
        uses: igsr5/chatgpt-issue-commentator@v0.2 # NOTE: experimental
        with:
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          github-issue-context: 0
```

2. Register for a ChatGPT API key.
3. Set the obtained API key as a GitHub Actions secret (OPENAI_API_KEY).
4. With the GitHub Actions workflow set up, add a comment to an Issue, and ChatGPT Issue Commentator will be activated.

## Contributing
Contributions to the project are welcome! Feel free to create Issues and Pull Requests.

## Development Process
1. Fork this repository.
2. Clone the forked repository locally.
3. Run npm install to install the required dependencies.
4. Make modifications or add features, and test locally.
5. Commit and push your changes after successful testing.
6. Create a Pull Request in your forked repository. Please provide detailed information about the changes and purpose in the Pull Request description.

Suggestions for code quality and project structure are also welcome. Let's discuss in new Issues.

If you have questions or need consultation regarding development, please create an Issue. I will provide support.
