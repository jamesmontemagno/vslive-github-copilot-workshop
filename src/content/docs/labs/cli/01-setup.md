---
title: "Part 1: Setup & Context Engineering"
---

In this part you'll set up your development environment **and** teach Copilot about the codebase — so every future prompt starts with the right context.

## Section 1: Initial Setup

### Step 1: Install GitHub Copilot CLI

Use the installation path that matches your machine:

- **npm (cross-platform, requires Node.js 22+)**

  ```bash
  npm install -g @github/copilot
  ```

- **Homebrew (macOS/Linux)**

  ```bash
  brew install --cask copilot-cli
  ```

- **WinGet (Windows)**

  ```powershell
  winget install GitHub.Copilot
  ```

### Step 2: Authenticate and select the workshop model

Before you open the starter project, sign in to the CLI and choose the model the workshop uses:

1. From any terminal, run:

   ```bash
   copilot login
   ```

2. Complete the browser device flow. If your organization uses SAML SSO, select **Authorize** for the organization when GitHub prompts you.
3. Start an interactive session:

   ```bash
   copilot
   ```

4. In the session, enter:

   ```text
   /model
   ```

5. Select **GPT-5.3 Codex**, then exit the session with `/exit`.

> [!TIP]
> If **GPT-5.3 Codex** is not listed, your plan or organization has not enabled it. Select **Auto** and let a facilitator know; do not attempt to work around your organization's model policy.

### Step 3: Open and verify the CLI lab

Clone the dedicated Mona Mayhem starter, then prove that your terminal is in that repository before starting Copilot:

```bash
git clone https://github.com/jamesmontemagno/workshop-mona-mayhem.git
cd workshop-mona-mayhem
code .
```

Run the verification commands for your platform:

<div data-tabs>
  <div role="tablist" aria-label="Verify the CLI lab folder">
   <button role="tab" aria-selected="true" data-tab="powershell">PowerShell</button>
   <button role="tab" aria-selected="false" data-tab="shell">macOS or Linux</button>
  </div>

  <div role="tabpanel" data-panel="powershell">

```powershell
Get-Location
git rev-parse --show-toplevel
git remote get-url origin
```

  </div>

  <div role="tabpanel" data-panel="shell" hidden>

```bash
pwd
git rev-parse --show-toplevel
git remote get-url origin
```

  </div>
</div>

All three commands should identify `workshop-mona-mayhem` and the `https://github.com/jamesmontemagno/workshop-mona-mayhem.git` origin. If they do not, stop and `cd` into the cloned `workshop-mona-mayhem` folder before continuing.

### Step 4: Start the app and confirm CLI context

1. In the terminal at `workshop-mona-mayhem`, install dependencies and start the app:

   ```bash
   npm install
   npm run dev
   ```

2. Open a **second terminal** in the same folder and start Copilot CLI:

   ```bash
   copilot
   ```

3. Confirm that the model is still **GPT-5.3 Codex**, then ask:

   ```text
   Before we make changes, identify the current working directory and repository root. Confirm the repository name, the remote origin, and the main technologies in this project.
   ```

4. Confirm that Copilot identifies the Mona Mayhem repository. If it identifies a parent folder or another project, exit with `/exit`, return to Step 3, and restart `copilot` from the correct folder.

> **Result:** You have the app preview in one terminal and Copilot CLI, using the intended model and the intended repository, in another.


## Section 2: Context Engineering

Context engineering is how you teach AI about your codebase. The better the context, the better every future response will be.




### Task 1: Generate Repository Instructions with /init

Let's use `/init` to generate a workspace instructions file for Copilot:

1. In Copilot CLI, type:

   ```
   /init simple instructions with a project overview, build/dev commands, and Astro best practices, (ignore the workshop).
   ```

2. Review the generated file — Copilot will analyze your project and create a `.github/copilot-instructions.md`.
3. Commit the instructions file.

> **Result:** Future CLI sessions automatically inherit repository-specific instructions from `.github/copilot-instructions.md`.

### Task 2: Tune Your CLI Environment

Practice the CLI controls that make later steps smoother:

1. Run `/help` to scan the available slash commands.
2. If Copilot has learned too many approvals during experimentation, reset them with:

   ```
   /reset-allowed-tools
   ```

3. If your repository lives inside a larger parent directory, use `/add-dir PATH` to explicitly widen the allowed workspace.
4. Turn on cross-session memory with `/memory` so Copilot remembers useful facts about how you work, and use `/instructions` to see which instruction files are loaded.

> 💡 The CLI docs recommend concise custom instructions plus explicit tool permissions so Copilot stays fast and predictable.

### Task 3: Explore the Project from the Terminal

Try these prompts inside Copilot CLI:

- `Give me an overview of this project.`
- `@src/pages/api/contributions/[username].ts What is this file for and what needs to be built here?`
- `@src/pages/index.astro What exists here and what would I need to add to build the battle page?`

If you want a quick one-shot answer outside the interactive session, try:

```bash
copilot -p "Summarize the architecture of this repo in 5 bullet points"
```

> **Result:** You now have instructions, command awareness, and a feel for how to feed files into Copilot CLI context.


## Check your understanding

When should you use a path-specific instruction file instead of `.github/copilot-instructions.md`?

<details>
<summary>Check your answer</summary>

Use `.github/copilot-instructions.md` for project-wide rules that should shape every request, such as build commands and repository conventions. Use a file under `.github/instructions/` with an `applyTo` glob when guidance only matters for certain paths or file types. Keeping specialized rules scoped avoids loading irrelevant context into every conversation.

**Go deeper:** [Add custom instructions for Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions).

</details>

## ✅ Part 1 Complete

You've learned how to:

- **Set up** the repo and local development environment
- **Generate instructions** with `/init` so Copilot understands your project and design direction
- **Establish a review habit** before applying generated changes
- **Explore the codebase** with context-rich prompts
