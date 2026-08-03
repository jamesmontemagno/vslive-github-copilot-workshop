---
title: "Step 6: Produce a structured report"
---

> **Time:** 10 minutes

## What you'll produce

You'll produce a concise report that separates page evidence, criterion mapping, remediation, and
the limits of the review.

## Separate evidence from interpretation

An agent response contains **evidence** and **interpretation**. Evidence is what Playwright
observed, such as an input with no accessible name. Interpretation is the criterion mapping and
remediation based on that evidence and the catalog result.

A clear output contract tells the agent what to include, what to leave out, and how to handle
uncertainty. It makes reports more consistent without claiming that the review is exhaustive.

## Be useful without overstating the result

One automated snapshot cannot establish accessibility conformance. The report should stick to
high-confidence findings without invented statistics, decorative severity labels, or a broad claim
that the page passes or fails WCAG.

The agent now turns `browser evidence + catalog result` into a bounded, repeatable report.

## Give the report a contract

### 1. Add the report contract

Create `workshop-app/Helpers/Prompts.cs`:

```csharp
namespace HelloCopilotSDK.Helpers;

public static class Prompts
{
    public static string CreateReportPrompt(Uri targetUri) => $"""
        Prepare an evidence-based accessibility review of {targetUri.AbsoluteUri}.

        1. Use browser_navigate to open that exact URL.
        2. Call read_latest_accessibility_snapshot to inspect its accessibility tree.
        3. Identify three to five high-confidence issues supported by the snapshot.
        4. Call accessibility_rule_lookup for each issue before recommending a fix.

        Return only this structure:

        # Accessibility review
        ## Finding 1: <short name>
        - Evidence: <specific element or page structure observed in the browser>
        - WCAG criterion: <criterion and title returned by the catalog>
        - Recommended remediation: <specific implementation change>

        Repeat the finding section as needed.

        ## Review limits
        State that this is a focused review of browser-observable evidence, not a full WCAG conformance audit.

        Do not invent evidence, report unsupported statistics, or claim the page is WCAG compliant.
        """;
}
```

### 2. Use the contract

Replace the final send call in `Program.cs`:

```csharp
Console.WriteLine($"\nAnalyzing: {targetUri.AbsoluteUri}\n");
await ResponseStreamer.SendAndPrintAsync(session, Prompts.CreateReportPrompt(targetUri));
```

## Run it

```bash
dotnet run --project workshop-app
```

When the app asks for a URL, paste:

```text
https://jamesmontemagno.github.io/workshop-accessibility-agent/target-app/
```

The report should follow this shape:

```text
# Accessibility review
## Finding 1: Input has no accessible name
- Evidence: The snapshot contains a textbox with no accessible name.
- WCAG criterion: 4.1.2 Name, Role, Value
- Recommended remediation: Associate a visible label using matching for and id values.

## Review limits
This focused review uses browser-observable evidence and is not a full WCAG conformance audit.
```

## Finale: make the report browseable

The console report is useful, but it disappears when the session ends. For a final capability
expansion, let the application create one specific HTML artifact that you can open and explore in a
browser.

Do not give the agent general filesystem access. Instead, add one application-owned tool that
accepts HTML content and can write only `reports/accessibility-report.html` beneath the current
working directory. The tool takes no path argument, so the model cannot choose a different
destination.

### 1. Add the constrained report writer

Create `workshop-app/Helpers/HtmlReportWriter.cs`:

```csharp
using System.ComponentModel;
using System.Text;
using GitHub.Copilot;
using Microsoft.Extensions.AI;

namespace HelloCopilotSDK.Helpers;

public static class HtmlReportWriter
{
    private const string ReportFileName = "accessibility-report.html";

    public static AIFunction CreateTool(string workingDirectory)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(workingDirectory);

        var reportDirectory = Path.GetFullPath(
            Path.Combine(workingDirectory, "reports"));

        return CopilotTool.DefineTool(
            ([Description("A complete, self-contained HTML accessibility report.")] string html) =>
                Task.FromResult(WriteReport(reportDirectory, html)),
            toolOptions: new CopilotToolOptions { SkipPermission = true },
            factoryOptions: new AIFunctionFactoryOptions
            {
                Name = "write_accessibility_html_report",
                Description =
                    "Writes the completed accessibility report to the fixed reports/accessibility-report.html path."
            });
    }

    private static string WriteReport(string reportDirectory, string html)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(html);
        if (!html.TrimStart().StartsWith("<!doctype html", StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException(
                "The report must be a complete HTML document.",
                nameof(html));
        }

        Directory.CreateDirectory(reportDirectory);
        var reportPath = Path.Combine(reportDirectory, ReportFileName);
        File.WriteAllText(reportPath, html, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));

        return Path.GetFullPath(reportPath);
    }
}
```

This is still a narrow local capability. It has no user-controlled path, does not expose directory
listing or reading, and does not change the Playwright MCP allowlist or its permission handler.

### 2. Register the new local tool

In `Program.cs`, add the writer to both tool lists:

```csharp
Tools =
[
    AccessibilityRuleCatalog.CreateLookupTool(),
    PlaywrightSnapshotReader.CreateTool(workingDirectory),
    HtmlReportWriter.CreateTool(workingDirectory)
],
AvailableTools =
[
    "accessibility_rule_lookup",
    "read_latest_accessibility_snapshot",
    "write_accessibility_html_report",
    "playwright-browser_navigate"
],
```

### 3. Upgrade the same report contract

Replace `CreateReportPrompt` in `Helpers/Prompts.cs`. The investigation remains grounded in the
same browser evidence and catalog lookups; only its final presentation changes.

```csharp
public static string CreateReportPrompt(Uri targetUri) => $"""
    Prepare an evidence-based accessibility review of {targetUri.AbsoluteUri}.

    1. Use browser_navigate to open that exact URL.
    2. Call read_latest_accessibility_snapshot to inspect its accessibility tree.
    3. Identify three to five high-confidence issues supported by the snapshot.
    4. Call accessibility_rule_lookup for each issue before recommending a fix.
    5. Create one complete, self-contained HTML document and call
       write_accessibility_html_report exactly once with that document.

    The HTML report must:
    - use semantic header, main, section, and footer landmarks;
    - include the target URL, a count of only the grounded findings, and a Review limits section;
    - present every finding with its evidence, WCAG criterion and title, and recommended remediation;
    - escape all evidence and report text before placing it in HTML;
    - include a text-search filter, a WCAG-criterion select filter, and a Clear filters button;
    - update a polite live result count when filters change and show a clear empty state;
    - use native form controls, visible keyboard focus styles, and keyboard-operable controls;
    - embed all CSS and JavaScript in the document and use no external assets, network requests,
      unsupported statistics, or invented severity labels.

    Use only findings supported by the current browser snapshot and catalog results. State that this
    is a focused review of browser-observable evidence, not a full WCAG conformance audit.
    After the tool succeeds, return only the generated report path.
    """;
```

The page's filters organize the same grounded findings; they do not discover more issues or turn
this focused review into a conformance claim.

### 4. Run and open the report

Run the application again with the workshop target. After the final tool call, the console prints
the report path. Open it directly in a browser:

```bash
# Windows PowerShell
Invoke-Item .\reports\accessibility-report.html

# macOS
open reports/accessibility-report.html

# Linux
xdg-open reports/accessibility-report.html
```

Try a word from a finding in the search field, choose a WCAG criterion, then use **Clear filters**.
Confirm that the result count and empty state update and that every control works with the keyboard.

<details>
<summary>Troubleshooting this run</summary>

| Symptom | Fix |
|---|---|
| The output contains unsupported counts | Confirm the prompt says not to report unsupported statistics. |
| A finding has no concrete element or structure | Treat it as ungrounded; keep the evidence requirement in the report contract. |
| The response claims WCAG compliance | Keep the required **Review limits** section and explicit prohibition. |
| The report tool is not called | Confirm that it appears in both `Tools` and `AvailableTools`, and that the prompt requires exactly one call. |
| The report is written somewhere unexpected | Keep the writer's fixed filename and no-path tool signature; do not replace it with a generic file tool. |
| Filters do not announce changes | Ensure the generated HTML includes a polite live result count and an explicit empty state. |

</details>

> **You're ready for the final run when:** each finding contains specific browser evidence, a
> catalog criterion, and a remediation; the generated report stays within `reports`; and its
> keyboard-operable filters and review limits work in a local browser.

## Check your understanding

In the report, which content is direct evidence and which content is model interpretation?

<details>
<summary>Check your answer</summary>

The element or page structure returned by Playwright is evidence. Choosing the criterion and
writing the remediation are interpretations based on that evidence and the catalog result.

</details>

<details>
<summary>Step 6 Markdown checkpoint (before the finale)</summary>

For comparison, use the
[`checkpoints/06-structured-report`](https://github.com/jamesmontemagno/workshop-accessibility-agent/tree/main/checkpoints/06-structured-report)
project. The completed application is also in
[`samples/accessibility-report`](https://github.com/jamesmontemagno/workshop-accessibility-agent/tree/main/samples/accessibility-report).
They show the Markdown-report milestone; keep your finale changes in place for the interactive
HTML run.

```csharp
using GitHub.Copilot;
using HelloCopilotSDK.Helpers;

Console.WriteLine("=== Accessibility Report Generator ===\n");

Console.Write("Enter URL to analyze: ");
var urlInput = Console.ReadLine()?.Trim();

if (string.IsNullOrWhiteSpace(urlInput))
{
    Console.Error.WriteLine("Enter a URL to analyze.");
    return;
}

if (!urlInput.Contains("://", StringComparison.Ordinal))
{
    urlInput = $"https://{urlInput}";
}

if (!Uri.TryCreate(urlInput, UriKind.Absolute, out var targetUri) ||
    targetUri.Scheme is not ("http" or "https"))
{
    Console.Error.WriteLine("Enter an absolute HTTP or HTTPS URL.");
    return;
}

await using var client = new CopilotClient();
await client.StartAsync();

var ping = await client.PingAsync("workshop");
Console.WriteLine($"\nConnected to the Copilot runtime: {ping.Message}\n");

var selectedModel = await ModelSelector.SelectAsync(client);

var workingDirectory = Directory.GetCurrentDirectory();

await using var session = await client.CreateSessionAsync(new SessionConfig
{
    Model = selectedModel,
    Streaming = true,
    OnPermissionRequest = WorkshopPermissionHandler.CreateForTarget(targetUri),
    Tools =
    [
        AccessibilityRuleCatalog.CreateLookupTool(),
        PlaywrightSnapshotReader.CreateTool(workingDirectory)
    ],
    AvailableTools =
    [
        "accessibility_rule_lookup",
        "read_latest_accessibility_snapshot",
        "playwright-browser_navigate"
    ],
    McpServers = new Dictionary<string, McpServerConfig>
    {
        ["playwright"] = new McpStdioServerConfig
        {
            Command = "npx",
            Args = ["-y", "@playwright/mcp@0.0.78", "--browser=msedge"],
            WorkingDirectory = workingDirectory,
            Tools = ["browser_navigate"]
        }
    }
});

Console.WriteLine($"Analyzing: {targetUri.AbsoluteUri}\n");
await ResponseStreamer.SendAndPrintAsync(session, Prompts.CreateReportPrompt(targetUri));
```

</details>

Continue to [Step 7: Run and explain the application](../07-run-explain/).
