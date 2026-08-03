---
title: "Prepare for the workshop"
description: "Install and verify everything needed for the four VS Live GitHub Copilot labs."
---

Complete this checklist before Friday. Copilot app, Copilot CLI, and Copilot SDK work on Windows, macOS, or Linux. **Visual Studio 2026 requires Windows.**

## Accounts and access

- [ ] A personal GitHub account (preferred)
- [ ] GitHub Copilot Free or a paid Copilot plan
- [ ] Permission to create repositories and pull requests in your account, if you plan to use the repository-backed exercises
- [ ] Git configured with your GitHub identity
- [ ] If you use Copilot Business or Enterprise, confirmation from your administrator that the required Copilot policies are enabled

## Required tools

| Tool | Required for | Verify |
|---|---|---|
| [Git](https://git-scm.com/downloads) | All labs | `git --version` |
| [GitHub Copilot app](https://github.com/features/ai/github-app) | Copilot app | Open the app and sign in |
| [Node.js 22 or 24](https://nodejs.org/) | Copilot app, CLI, and SDK | `node --version` |
| [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli) | CLI and SDK | `copilot --version` |
| [Visual Studio Code](https://code.visualstudio.com/) or [Visual Studio Code Insiders](https://code.visualstudio.com/insiders/) | CLI and SDK | `code --version` or `code-insiders --version` |
| [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0) | Labs 3 and 4 | `dotnet --version` |
| [Visual Studio 2026](https://visualstudio.microsoft.com/vs/) | Lab 3 | Open Visual Studio |
| Edge or Chrome | Browser-based verification | Open the browser once |

## Visual Studio 2026 setup

On Windows, open the Visual Studio Installer and confirm the **ASP.NET and web development** workload is installed. Sign in to GitHub Copilot inside Visual Studio before the workshop.

## Run workshop doctor

Download the preflight script for your operating system, inspect it if desired, then run it. It does not install software or read credentials. Its final check takes up to a minute and shows a waiting indicator while sending a one-line **Auto**-model prompt to verify that you are signed in and can receive a response; this uses one small Copilot request.

<div data-tabs>
  <div role="tablist" aria-label="Run workshop doctor">
    <button role="tab" aria-selected="true" data-tab="powershell">Windows PowerShell</button>
    <button role="tab" aria-selected="false" data-tab="shell">macOS or Linux</button>
  </div>

  <div role="tabpanel" data-panel="powershell">

```powershell
Invoke-WebRequest https://raw.githubusercontent.com/jamesmontemagno/vslive-github-copilot-workshop/main/scripts/workshop-doctor.ps1 -OutFile .\workshop-doctor.ps1
.\workshop-doctor.ps1
```

  </div>

  <div role="tabpanel" data-panel="shell" hidden>

```bash
curl -fsSLO https://raw.githubusercontent.com/jamesmontemagno/vslive-github-copilot-workshop/main/scripts/workshop-doctor.sh
bash ./workshop-doctor.sh
```

  </div>
</div>

The report lists readiness for each lab and summarizes your compatible workshop path. On macOS and Linux, it reports Visual Studio as Windows-only rather than as a failed check.

## Enterprise authentication and policy setup

For the interactive CLI lab, sign in ahead of time:

```console
copilot login
```

Complete the browser device flow. For GitHub Enterprise Cloud with data residency, use `copilot login --host HOSTNAME`. If your organization uses SAML SSO, select **Authorize** next to the organization during the GitHub authorization step.

Copilot Business and Enterprise users need the relevant organization or enterprise policies enabled before the workshop:

- The **Copilot CLI** policy is required for the CLI and SDK labs.
- The **GitHub Copilot app** policy is separately required for the Copilot app lab.

If a policy, SSO authorization, or model is unavailable, contact your administrator or a facilitator before the workshop. Do not use tokens or accounts you are not authorized to use.

## Clone the project for each lab

Clone only the project for the lab you are starting. Use [Visual Studio Code](https://code.visualstudio.com/) for the CLI and SDK labs, and [Visual Studio](https://visualstudio.microsoft.com/vs/) for the Visual Studio lab:

| Lab | Clone and open |
|---|---|
| Copilot app | Create a repository from the [Tailspin Toys template](https://github.com/github-samples/tailspin-toys), then open it in the Copilot app |
| Copilot CLI | `git clone https://github.com/jamesmontemagno/workshop-mona-mayhem.git` then `cd workshop-mona-mayhem` and run `copilot` |
| Visual Studio 2026 | `git clone https://github.com/jamesmontemagno/workshop-tinyshop.git`, then open `workshop-tinyshop/src/TinyShop.sln` |
| Copilot SDK | `git clone https://github.com/jamesmontemagno/workshop-accessibility-agent.git` then `cd workshop-accessibility-agent` and run `code .` |

Each standalone repository has its workshop starter on `main` and a `completed` branch for reference.

## When to fork instead

Direct cloning is enough for all local exercises. Fork the individual project only when a lesson needs you to push changes, create an issue or pull request, or delegate work to a cloud agent. If an enterprise-managed account prevents forking, remain on a direct clone and complete the local exercises; the repository-backed actions will be unavailable.

Tailspin Toys intentionally uses its template flow because its Copilot app lessons depend on pre-seeded issues, branches, and pull requests.

## Quick preflight

Before arriving, confirm:

1. `workshop doctor` reports the labs you plan to attend as ready.
2. You can authenticate with GitHub and Copilot.
3. Visual Studio 2026 opens `workshop-tinyshop/src/TinyShop.sln` if you are attending that Windows-only lab.
4. You can access the separate Tailspin Toys template repository.

When everything is ready, [begin with the Copilot app lab](/labs/copilot-app/).

## Resources

- [Install GitHub Copilot CLI][install-cli]
- [Authenticate GitHub Copilot CLI][authenticate-cli]
- [Manage Copilot policies for an organization][organization-policies]
- [Manage Copilot policies for an enterprise][enterprise-policies]
- [Get started with the GitHub Copilot app][getting-started-app]

[install-cli]: https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli
[authenticate-cli]: https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/authenticate-copilot-cli
[organization-policies]: https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-organization/manage-policies
[enterprise-policies]: https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/manage-enterprise-policies
[getting-started-app]: https://docs.github.com/en/copilot/how-tos/github-copilot-app/getting-started
