import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { knowledgeChecks } from './knowledge-checks.mjs';
import { lessonSections } from './lesson-sections.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(root, 'workshops.sources.json'), 'utf8'));
const sourceRootArg = process.argv.indexOf('--source-root');
const cachedRoot =
  sourceRootArg >= 0 && process.argv[sourceRootArg + 1]
    ? resolve(process.argv[sourceRootArg + 1])
    : null;
const temporaryRoot = cachedRoot ? null : mkdtempSync(join(tmpdir(), 'vslive-workshops-'));
const contentRoot = join(root, 'src', 'content', 'docs', 'labs');
const targetAppUrl =
  'https://jamesmontemagno.github.io/workshop-accessibility-agent/target-app/';
const modelSelectorSource = (rootNamespace) => `using GitHub.Copilot;

namespace ${rootNamespace}.Helpers;

public static class ModelSelector
{
    public static async Task<string?> SelectAsync(CopilotClient client)
    {
        var models = (await client.ListModelsAsync())?.ToList();
        if (models is null || models.Count is 0)
        {
            Console.WriteLine("No model list was returned; using the account default.");
            return null;
        }

        Console.WriteLine("Available models:");
        for (var index = 0; index < models.Count; index++)
        {
            Console.WriteLine($"{index + 1}. {models[index].Name}");
        }

        Console.Write($"Choose 1-{models.Count} [1]: ");
        var valid = int.TryParse(Console.ReadLine(), out var choice) &&
                    choice >= 1 &&
                    choice <= models.Count;
        var selected = models[(valid ? choice : 1) - 1];

        Console.WriteLine($"Using {selected.Name}\\n");
        return selected.Id;
    }
}
`;

const cleanTargets = [
  join(contentRoot, 'cli'),
  join(contentRoot, 'copilot-app'),
  join(contentRoot, 'visual-studio'),
  join(contentRoot, 'copilot-sdk'),
  join(contentRoot, '_images')
];

for (const target of cleanTargets) {
  rmSync(target, { recursive: true, force: true });
}
mkdirSync(contentRoot, { recursive: true });

const sources = Object.fromEntries(
  manifest.sources.map((source) => {
    const location = cachedRoot
      ? join(cachedRoot, source.cacheDirectory)
      : join(temporaryRoot, source.cacheDirectory);

    if (!cachedRoot) {
      execFileSync('git', ['clone', '--quiet', '--no-checkout', source.repository, location], {
        stdio: 'inherit'
      });
      execFileSync('git', ['-C', location, 'checkout', '--quiet', source.commit], {
        stdio: 'inherit'
      });
    }

    if (!existsSync(location)) {
      throw new Error(`Missing source cache for ${source.key}: ${location}`);
    }

    const actualCommit = execFileSync('git', ['-C', location, 'rev-parse', 'HEAD'], {
      encoding: 'utf8'
    }).trim();
    if (actualCommit !== source.commit) {
      throw new Error(
        `${source.key} cache is at ${actualCommit}, but workshops.sources.json pins ${source.commit}`
      );
    }

    return [source.key, location];
  })
);

const copyTree = (from, to) => {
  cpSync(from, to, {
    recursive: true,
    filter: (path) => {
      const name = basename(path);
      return !['.git', 'node_modules', 'bin', 'obj'].includes(name);
    }
  });
};

const titleFromMarkdown = (markdown, fallback) => {
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1];
  return (heading || fallback)
    .replaceAll('"', "'")
    .replace(/<[^>]+>/g, '')
    .trim();
};

const stripTrack = (markdown, trackToRemove) =>
  markdown
    .replace(
      new RegExp(
        `<!-- track:${trackToRemove}:start -->[\\s\\S]*?<!-- track:${trackToRemove}:end -->`,
        'g'
      ),
      ''
    )
    .replace(/<!-- track:(?:cli|vscode):(start|end) -->/g, '');

const normalizeLinks = (markdown, isIndex) =>
  markdown.replace(
    /(\]\(|:\s*)(?:\.\/)?([A-Za-z0-9_-]+)\.md(#[^\s)]*)?/g,
    (_, prefix, slug, hash = '') => `${prefix}${isIndex ? './' : '../'}${slug}/${hash}`
  );

const normalizeTaskMarkers = (markdown) => {
  let fence = null;
  return markdown
    .split('\n')
    .map((line) => {
      const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
      if (fenceMatch) {
        const marker = fenceMatch[1][0];
        fence = fence === marker ? null : marker;
        return line;
      }
      if (fence) return line;
      const normalized = line.replace(
        /^(\s*(?:[-*+]|\d+\.)\s+)\[\](?=\s)/,
        '$1[ ]'
      );
      return normalized === line ? line : normalized.trimEnd();
    })
    .join('\n');
};

const addKnowledgeCheck = (markdown, destinationFile) => {
  const key = destinationFile
    .slice(contentRoot.length + 1)
    .replaceAll('\\', '/');
  const check = knowledgeChecks[key];
  if (!check) return markdown;

  const block = `## Check your understanding

${check.question}

<details>
<summary>Check your answer</summary>

${check.answer}

**Go deeper:** [${check.sourceLabel}](${check.sourceUrl}).

</details>`;

  const marker = key.startsWith('cli/')
    ? /^## ✅/m
    : key.startsWith('copilot-app/')
      ? /^## Resources/m
      : null;

  if (!marker) {
    const dividerIndex = markdown.lastIndexOf('\n---\n');
    if (dividerIndex < 0) {
      throw new Error(`Could not place knowledge check in ${key}`);
    }
    return `${markdown.slice(0, dividerIndex).trimEnd()}\n\n${block}\n${markdown.slice(dividerIndex)}`;
  }
  if (!marker.test(markdown)) {
    throw new Error(`Could not place knowledge check in ${key}`);
  }
  return markdown.replace(marker, `${block}\n\n$&`);
};

const addLessonSections = (markdown, destinationFile) => {
  const key = destinationFile
    .slice(contentRoot.length + 1)
    .replaceAll('\\', '/');
  const sections = lessonSections[key];
  if (!sections) return markdown;

  for (const section of sections) {
    if (markdown.includes(`## ${section.heading}`)) continue;
    if (!markdown.includes(section.before)) {
      throw new Error(`Could not place "${section.heading}" in ${key}`);
    }
    const insertionIndex = markdown.indexOf(section.before);
    const prefix = markdown.slice(0, insertionIndex);
    const spacer = prefix.endsWith('\n\n') ? '' : '\n';
    markdown =
      `${prefix}${spacer}## ${section.heading}\n\n${section.before}` +
      markdown.slice(insertionIndex + section.before.length);
  }
  return markdown;
};

const normalizeMarkdown = (sourceFile, destinationFile, options = {}) => {
  let markdown = readFileSync(sourceFile, 'utf8')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n');
  if (options.removeTrack) {
    markdown = stripTrack(markdown, options.removeTrack);
  }

  const isIndex = basename(destinationFile) === 'index.md';
  markdown = normalizeLinks(markdown, isIndex);

  if (options.replacements) {
    for (const [pattern, replacement] of options.replacements) {
      markdown = markdown.replace(pattern, replacement);
    }
  }

  if (markdown.startsWith('---\n')) {
    const end = markdown.indexOf('\n---', 4);
    const frontmatter = markdown.slice(4, end).replace(/^slug:.*\n?/m, '');
    markdown = `---\n${frontmatter.trim()}\n---${markdown.slice(end + 4)}`;
  } else {
    const title = titleFromMarkdown(markdown, basename(sourceFile, '.md'));
    markdown = `---\ntitle: "${title}"\n---\n\n${markdown}`;
  }

  markdown = markdown.replace(
    /^(---\n[\s\S]*?\n---)\n+(?:#\s+[^\n]+\n+(?:---\n+)?)?/,
    '$1\n\n'
  );

  if (options.intro) {
    markdown = markdown.replace(
      /^(---\n[\s\S]*?\n---)\n?/,
      `$1\n\n${options.intro}\n\n`
    );
  }

  markdown = normalizeTaskMarkers(markdown);
  markdown = addLessonSections(markdown, destinationFile);
  markdown = addKnowledgeCheck(markdown, destinationFile);
  mkdirSync(dirname(destinationFile), { recursive: true });
  writeFileSync(destinationFile, markdown.trimEnd() + '\n');
};

const importMarkdownDirectory = (sourceDirectory, destinationDirectory, options = {}) => {
  for (const name of readdirSync(sourceDirectory)) {
    if (!name.endsWith('.md')) continue;
    if (options.exclude?.includes(name)) continue;
    const destinationName = options.indexFile === name ? 'index.md' : name;
    const fileOptions =
      options.introFiles && !options.introFiles.includes(name)
        ? { ...options, intro: null }
        : options;
    normalizeMarkdown(
      join(sourceDirectory, name),
      join(destinationDirectory, destinationName),
      fileOptions
    );
  }
};

importMarkdownDirectory(
  join(sources.cli, 'workshop'),
  join(contentRoot, 'cli'),
  {
    indexFile: '00-overview.md',
    removeTrack: 'vscode',
    replacements: [
      [
        /### Step 1: Create Your Repository/,
        '### Step 1: Open the CLI Lab'
      ],
      [
        /> \*\*Duration:\*\*.*$/m,
        '> **Duration:** 60–90 minutes for the facilitated core; advanced deep dives are available if time permits.'
      ],
      [
        /The workshop supports \*\*two tracks\*\*: a VS Code experience and a GitHub Copilot CLI experience\./,
        'This VS Live edition focuses on the GitHub Copilot CLI experience.'
      ],
      [
        /## 🎯 Choose Your Track[\s\S]*?---/,
        '## Workshop path\n\nFollow the CLI instructions throughout this edition. Parts 1–5 form the facilitated core; Parts 6–8 are advanced deep dives, and Part 9 is optional.\n\n---'
      ],
      [
        /> 💡 \*\*Tip:\*\* Use the DevContainer for a pre-configured environment if you want a fast start in VS Code\./,
        '> **Tip:** The included Dev Container provides a pre-configured terminal environment if you prefer containers.'
      ],
      [
        /1\. Open \[github\.com\/copilot-dev-days\/mona-mayhem\][\s\S]*?3\. Name it `my-mona-mayhem` and set visibility to \*\*Public\*\* \(if you created from template\)/,
        `Clone the dedicated Mona Mayhem starter and open it in Visual Studio Code:

\`\`\`bash
git clone https://github.com/jamesmontemagno/workshop-mona-mayhem.git
cd workshop-mona-mayhem
code .
\`\`\`

Keep your work in this folder. A direct clone is sufficient for the local lab. Fork this repository only if you want to push your work or use the optional cloud delegation exercise.`
      ],
      [
        /1\. Clone your repo locally and open a terminal in the project root\./,
        '1. In the terminal already open at `workshop-mona-mayhem`, install dependencies and start the app:'
      ],
      [
        /2\. Install dependencies and start the app:\n/,
        ''
      ],
      [
        /3\. Open a \*\*second terminal\*\* in the same repo and start Copilot CLI:/,
        '2. Open a **second terminal** in the same folder and start Copilot CLI:'
      ],
      [/4\. In the interactive session, enter:/, '3. In the interactive session, enter:'],
      [
        /5\. Follow the device flow prompts, then confirm that you trust the repository when the CLI asks for approval\./,
        '4. Follow the device flow prompts, then confirm that you trust the repository when the CLI asks for approval.'
      ],
      [
        /Create your repo, prepare your environment, and give Copilot the right context/,
        'Open the included starter, prepare your environment, and give Copilot the right context'
      ]
    ]
  }
);

importMarkdownDirectory(
  join(sources['copilot-app'], 'docs', 'app'),
  join(contentRoot, 'copilot-app'),
  {
    indexFile: 'README.md',
    introFiles: ['README.md', '0-prerequisites.md'],
    intro:
      '> [!NOTE]\n> This lab intentionally uses the separate [Tailspin Toys template repository](https://github.com/github-samples/tailspin-toys), not a folder from the combined workshop repository. Because the exercises use issues, branches, sessions, and pull requests, Lesson 0 guides you through creating your own repository from that template. If your enterprise policy prevents creating a template repository, clone the template for local-only exercises and skip issue, pull request, and Agent Merge lessons.'
  }
);

const appImagesSource = join(sources['copilot-app'], 'docs', '_images');
const appImagesDestination = join(contentRoot, '_images');
mkdirSync(appImagesDestination, { recursive: true });
for (const name of readdirSync(appImagesSource)) {
  if (name.startsWith('app-')) {
    cpSync(join(appImagesSource, name), join(appImagesDestination, name));
  }
}

importMarkdownDirectory(
  join(sources['visual-studio'], 'lab'),
  join(contentRoot, 'visual-studio'),
  {
    replacements: [
      [/\(\.\/images\/4-instructions\.png\)/g, '(./images/04-instructions.png)'],
      [/\(\.\/impags\//g, '(./images/'],
      [/agent mdoe/g, 'agent mode'],
      [/Add from MCP MCP/g, 'Add from MCP Registry'],
      [
        /> \[!NOTE\]\n> For the hands-on lab exercises that create or modify repository data via cloud agents \(Part 12\), you'll need to fork the lab repo into your own account\. This gives the cloud agent permissions to operate on your fork\./,
        'Part 9 creates GitHub issues and Part 12 delegates work to a cloud agent. Both need a repository where you have write access. Fork `workshop-tinyshop` before those parts. If enterprise policy prevents a fork, you can complete every local exercise but must skip those repository-backed actions.'
      ],
      [
        /the \*\*eshop\.png\*\* image found in the root of the cloned repository/,
        '`eshop.png` from the root of your cloned TinyShop repository'
      ],
      [
        /1\. \[(?: )?\] Navigate to \*\*Tools -> Options -> GitHub -> Copilot -> Source Control Integration\*\*\.\n1\. \[(?: )?\] Update the commit message customization setting to: `Summarize in a few sentences and then highlight the top 5 changes with emoji and short descriptions`/,
        `1. [ ] In **Solution Explorer**, expand the **GitHub Node** and open \`copilot-instructions.md\`.
1. [ ] At the bottom of the file, add:

   \`\`\`markdown
   ## Commit Messages

   When creating Commit messages, summarize in a few sentences and then highlight the top 5 changes with emoji and short descriptions
   \`\`\``
      ],
      [
        /## Clone Lab Repository[\s\S]*?The code is now opened in Visual Studio\. Feel free to take a look at it or skip to the next section to start the app\./,
        `## Clone and open the lab solution

Clone the dedicated TinyShop repository:

\`\`\`powershell
git clone https://github.com/jamesmontemagno/workshop-tinyshop.git
cd workshop-tinyshop
start src\\TinyShop.sln
\`\`\`

1. [ ] In Visual Studio, select **File -> Open -> Project/Solution** if the solution did not open automatically.
2. [ ] Open \`src/TinyShop.sln\`.`
      ]
    ]
  }
);
copyTree(
  join(sources['visual-studio'], 'lab', 'images'),
  join(contentRoot, 'visual-studio', 'images')
);

importMarkdownDirectory(
  join(sources['copilot-sdk'], 'workshop'),
  join(contentRoot, 'copilot-sdk'),
  {
    replacements: [
      [/## 1\. Clone the repository/, '## 1. Open the SDK lab folder'],
      [
        /```bash\ngit clone https:\/\/github\.com\/jamesmontemagno\/copilot-sdk-workshop\.git\ncd copilot-sdk-workshop\ncode \.\n```/,
        `Clone the dedicated SDK workshop repository and open it in Visual Studio Code:

\`\`\`bash
git clone https://github.com/jamesmontemagno/workshop-accessibility-agent.git
cd workshop-accessibility-agent
code .
\`\`\``
      ],
      [
        /If `code` is not on your path, use your editor's \*\*Open Folder\*\* command instead\./,
        "If `code` is not on your path, use your editor's **Open Folder** command and select `workshop-accessibility-agent` instead."
      ],
      [
        /github\.com\/codemillmatt\/copilot-sdk-workshop/g,
        'github.com/jamesmontemagno/workshop-accessibility-agent'
      ],
      [
        /github\.com\/jamesmontemagno\/copilot-sdk-workshop/g,
        'github.com/jamesmontemagno/workshop-accessibility-agent'
      ],
      [
        /\{\{TARGET_APP_URL\}\}/g,
        targetAppUrl
      ],
      [
        /## Fire up your first Copilot session[\s\S]*?session becomes idle, so it works well when you only need the completed answer\./,
        `## Fire up your first Copilot session

Open \`workshop-app/Program.cs\`. Build the program in the following small additions so you can see where each responsibility belongs.

### 1. Import the SDK and add a heading

Replace the starter file contents with:

\`\`\`csharp
using GitHub.Copilot;

Console.WriteLine("=== First Copilot session ===\\n");
\`\`\`

\`using GitHub.Copilot;\` makes the SDK types available. The heading separates the workshop output from the commands you run in the terminal.

### 2. Connect to the Copilot runtime

Add this below the heading:

\`\`\`csharp
await using var client = new CopilotClient();
await client.StartAsync();
\`\`\`

\`CopilotClient\` manages the application-wide connection to the local Copilot CLI runtime. \`StartAsync\` launches or connects to that runtime before any requests are sent.

### 3. Confirm the connection

Add this next:

\`\`\`csharp
var ping = await client.PingAsync("workshop");
Console.WriteLine($"Connected to the Copilot runtime: {ping.Message}");
\`\`\`

\`PingAsync\` performs a lightweight health check, giving you an immediate confirmation that the app can reach Copilot. Print the returned message so connection failures are obvious before you create a session.

### 4. Create a conversation and send a prompt

Add the session and request:

\`\`\`csharp
await using var session = await client.CreateSessionAsync(new SessionConfig());
var response = await session.SendAndWaitAsync(
    "In one sentence, explain why an accessible name matters for a form input.");
\`\`\`

A \`CopilotSession\` owns one conversation and its context. With an empty \`SessionConfig\`, the runtime uses your account's default model. \`SendAndWaitAsync\` sends the prompt and waits until the session is idle.

### 5. Check and print the response

Finish the program with:

\`\`\`csharp
if (response is null)
{
    throw new InvalidOperationException("Copilot completed without an assistant message.");
}

Console.WriteLine($"\\nCopilot: {response.Data.Content}");
\`\`\`

The guard fails clearly if Copilot finishes without an assistant message. Otherwise, print the message content so you can inspect the response in the terminal.`
      ]
    ]
  }
);
for (const template of ['visual-studio', 'copilot-sdk']) {
  cpSync(
    join(root, 'scripts', 'templates', `${template}-index.md`),
    join(contentRoot, template, 'index.md')
  );
}
cpSync(
  join(root, 'scripts', 'templates', 'copilot-sdk-model-selection.md'),
  join(contentRoot, 'copilot-sdk', '08-model-selection.md')
);

const configureSdkLessonModelSelection = () => {
  for (const name of [
    '02-streaming.md',
    '03-local-tool.md',
    '04-mcp-safety.md',
    '05-combine-tools.md',
    '06-structured-report.md'
  ]) {
    const lessonPath = join(contentRoot, 'copilot-sdk', name);
    let lesson = readFileSync(lessonPath, 'utf8');
    lesson = lesson.replace(
      /new SessionConfig\r?\n\{\r?\n(?!\s*Model = selectedModel,)/g,
      'new SessionConfig\n{\n    Model = selectedModel,\n'
    );
    lesson = lesson.replace(
      /(var ping = await client\.PingAsync\("workshop"\);\r?\n[\s\S]*?Console\.WriteLine\([^;]+?\);\r?\n)(?!\r?\nvar selectedModel)/g,
      '$1\nvar selectedModel = await ModelSelector.SelectAsync(client);\n'
    );
    writeFileSync(lessonPath, lesson);
  }

  const firstSessionPath = join(contentRoot, 'copilot-sdk', '01-first-session.md');
  let firstSession = readFileSync(firstSessionPath, 'utf8');
  const modelSelectionExtension = `## Choose a model and run it again

Your first run used the account default, so you could confirm the runtime connection without making
another choice. Now add an explicit model selection for the next run.

### 1. Add the model picker

Create \`workshop-app/Helpers/ModelSelector.cs\`:

\`\`\`csharp
${modelSelectorSource('HelloCopilotSDK').trimEnd()}
\`\`\`

The helper asks the runtime which models your signed-in account can use, displays their names, and
returns the selected model ID. If the runtime returns no list, it returns \`null\` so the account
default remains in effect. Invalid input uses the first listed model.

### 2. Create the next session with that model

In \`Program.cs\`, add the helper namespace and select a model after the connection check:

\`\`\`csharp
using HelloCopilotSDK.Helpers;

var selectedModel = await ModelSelector.SelectAsync(client);
\`\`\`

Then replace the empty session configuration:

\`\`\`csharp
await using var session = await client.CreateSessionAsync(new SessionConfig
{
    Model = selectedModel
});
\`\`\`

A model is selected when a session is created, so keep the existing first session code as your
working starting point, update its configuration, and rerun the application.

## Run it again

\`\`\`bash
dotnet run --project workshop-app
\`\`\`

Choose a model when prompted, then confirm the terminal prints a Copilot response again. Keep
\`selectedModel\` and \`Model = selectedModel\` as you continue through the later lessons.`;
  firstSession = firstSession.replace(
    '> **You\'re ready for streaming when:**',
    `${modelSelectionExtension}\n\n> **You're ready for streaming when:**`
  );
  const checkpointIndex = firstSession.indexOf('<summary>Complete Step 1 checkpoint</summary>');
  const prefix = firstSession.slice(0, checkpointIndex);
  const checkpoint = firstSession
    .slice(checkpointIndex)
    .replace('using GitHub.Copilot;', 'using GitHub.Copilot;\nusing HelloCopilotSDK.Helpers;')
    .replace(
      /(var ping = await client\.PingAsync\("workshop"\);\r?\n[\s\S]*?Console\.WriteLine\([^;]+?\);\r?\n)(?!\r?\nvar selectedModel)/,
      '$1\nvar selectedModel = await ModelSelector.SelectAsync(client);\n'
    )
    .replace(
      /new SessionConfig\(\)/g,
      'new SessionConfig\n{\n    Model = selectedModel\n}'
    );
  writeFileSync(firstSessionPath, `${prefix}${checkpoint}`);

  const streamingPath = join(contentRoot, 'copilot-sdk', '02-streaming.md');
  let streaming = readFileSync(streamingPath, 'utf8');
  const sessionInstruction =
    'In `Program.cs`, keep `var selectedModel = await ModelSelector.SelectAsync(client);` from Step 1, then replace the session and response code with:';
  streaming = streaming.replace(
    'In `Program.cs`, add `using HelloCopilotSDK.Helpers;`, then replace the session and response code\nwith:',
    sessionInstruction
  );
  writeFileSync(streamingPath, streaming);
};

configureSdkLessonModelSelection();

if (temporaryRoot) {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

console.log(`Imported ${manifest.sources.length} pinned workshop sources.`);
