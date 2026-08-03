---
title: "Lab 4 · GitHub Copilot SDK"
description: "Build an AI-powered accessibility reviewer with .NET and the GitHub Copilot SDK."
---

**Time permitting · Windows, macOS, or Linux · [.NET 10](https://dotnet.microsoft.com/en-us/download/dotnet/10.0) + [Node.js 22 or 24](https://nodejs.org/) + [Visual Studio Code](https://code.visualstudio.com/)**

Build a console application that accepts a webpage URL, opens it with Playwright, identifies accessibility problems, consults an application-owned WCAG catalog, and produces a structured report.

## Explore the target app

Open the [accessibility target app](https://jamesmontemagno.github.io/workshop-accessibility-agent/target-app/) to see the intentionally introduced issues the workshop will investigate. You will use this page as browser evidence when building the report.

## Starter

```bash
git clone https://github.com/jamesmontemagno/workshop-accessibility-agent.git
cd workshop-accessibility-agent
code .
```

Begin in `start/HelloCopilotSDK`, using [Visual Studio Code](https://code.visualstudio.com/) and a terminal. Compiling checkpoints and completed samples are included beside it for recovery and comparison. Use `git switch completed` to inspect the finished reporter.

## Core path

1. [Prepare your machine](./00-preflight/)
2. [Create the first session](./01-first-session/)
3. [Stream responses](./02-streaming/)
4. [Expose a local C# tool](./03-local-tool/)
5. [Connect Playwright MCP safely](./04-mcp-safety/)
6. [Combine local and MCP tools](./05-combine-tools/)
7. [Produce a structured report](./06-structured-report/)
8. [Run and explain the completed system](./07-run-explain/)

## Optional extension

If time remains, continue to [model selection](./08-model-selection/).

Project: [jamesmontemagno/workshop-accessibility-agent](https://github.com/jamesmontemagno/workshop-accessibility-agent)
