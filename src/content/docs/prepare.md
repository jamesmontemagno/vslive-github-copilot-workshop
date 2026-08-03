---
title: "Prepare for the workshop"
description: "Install and verify everything needed for the four VS Live GitHub Copilot labs."
---

Complete this checklist before Friday. Labs 1, 2, and 4 work on Windows, macOS, or Linux. **Lab 3 requires Windows and Visual Studio 2026.**

## Accounts and access

- [ ] A personal GitHub account (preferred)
- [ ] GitHub Copilot Free or a paid Copilot plan
- [ ] Permission to create repositories and pull requests in your account, if you plan to use the repository-backed exercises
- [ ] Git configured with your GitHub identity

## Required tools

| Tool | Required for | Verify |
|---|---|---|
| [Git](https://git-scm.com/downloads) | All labs | `git --version` |
| [Node.js 22 or 24](https://nodejs.org/) | Labs 1, 2, and 4 | `node --version` |
| [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli) | Labs 1 and 4 | `copilot --version` |
| [Visual Studio Code](https://code.visualstudio.com/) | Labs 1 and 4 | `code --version` |
| [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0) | Labs 3 and 4 | `dotnet --version` |
| [Visual Studio 2026](https://visualstudio.microsoft.com/vs/) | Lab 3 | Open Visual Studio |
| Edge or Chrome | Browser-based verification | Open the browser once |

## Visual Studio 2026 setup

On Windows, open the Visual Studio Installer and confirm the **ASP.NET and web development** workload is installed. Sign in to GitHub Copilot inside Visual Studio before the workshop.

## Verify Copilot CLI

```console
copilot --version
copilot login
```

Complete the browser authentication flow. If your organization restricts Copilot, use a personal GitHub account with Copilot access for the workshop.

## Clone the project for each lab

Clone only the project for the lab you are starting. Use [Visual Studio Code](https://code.visualstudio.com/) for the CLI and SDK labs, and [Visual Studio](https://visualstudio.microsoft.com/vs/) for the Visual Studio lab:

| Lab | Clone and open |
|---|---|
| Copilot CLI | `git clone https://github.com/jamesmontemagno/workshop-mona-mayhem.git` then `cd workshop-mona-mayhem` and run `copilot` |
| Copilot app | Create a repository from the [Tailspin Toys template](https://github.com/github-samples/tailspin-toys), then open it in the Copilot app |
| Visual Studio 2026 | `git clone https://github.com/jamesmontemagno/workshop-tinyshop.git`, then open `workshop-tinyshop/src/TinyShop.sln` |
| Copilot SDK | `git clone https://github.com/jamesmontemagno/workshop-accessibility-agent.git` then `cd workshop-accessibility-agent` and run `code .` |

Each standalone repository has its workshop starter on `main` and a `completed` branch for reference.

## When to fork instead

Direct cloning is enough for all local exercises. Fork the individual project only when a lesson needs you to push changes, create an issue or pull request, or delegate work to a cloud agent. If an enterprise-managed account prevents forking, remain on a direct clone and complete the local exercises; the repository-backed actions will be unavailable.

Tailspin Toys intentionally uses its template flow because its Copilot app lessons depend on pre-seeded issues, branches, and pull requests.

## Quick preflight

Before arriving, confirm:

1. `git`, `node`, `copilot`, and `dotnet` return versions without errors.
2. You can authenticate with GitHub and Copilot.
3. Visual Studio 2026 opens `workshop-tinyshop/src/TinyShop.sln`.
4. You can clone the standalone starter needed for your first lab.
5. You can access the separate Tailspin Toys template repository.

When everything is ready, [begin with the Copilot CLI lab](/labs/cli/).
