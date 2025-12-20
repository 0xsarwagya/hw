#!/usr/bin/env tsx
/**
 * AI-Powered Changelog Generator
 * 
 * Fetches merged PRs from GitHub and uses Mistral API to generate
 * a comprehensive changelog in Keep a Changelog format.
 */

import { Octokit } from "@octokit/rest";
import * as fs from "fs/promises";
import * as path from "path";

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

// Types
interface PRInfo {
  number: number;
  title: string;
  description: string;
  mergedAt: string | null;
  author: string;
  url: string;
  labels: string[];
}

interface CategorizedPR {
  type: "feat" | "fix" | "docs" | "refactor" | "perf" | "test" | "build" | "ci" | "chore";
  scope?: string;
  breaking: boolean;
  description: string;
  pr: PRInfo;
}

interface MistralResponse {
  type: string;
  scope?: string;
  breaking: boolean;
  description: string;
}

// Configuration
const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
const MISTRAL_MODEL = "mistral-large-latest";

// CLI Arguments
interface CliArgs {
  since?: string;
  output?: string;
  repo?: string;
  dryRun?: boolean;
}

// Parse CLI arguments
function parseArgs(): CliArgs {
  const args: CliArgs = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--since" && i + 1 < argv.length) {
      args.since = argv[++i];
    } else if (arg === "--output" && i + 1 < argv.length) {
      args.output = argv[++i];
    } else if (arg === "--repo" && i + 1 < argv.length) {
      args.repo = argv[++i];
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Usage: tsx scripts/generate-changelog-ai.ts [options]

Options:
  --since <tag>      Only include PRs merged since this tag
  --output <file>    Output file path (default: CHANGELOG.md)
  --repo <owner/repo> GitHub repository (default: from package.json)
  --dry-run         Preview without writing to file
  --help, -h        Show this help message

Environment Variables:
  GITHUB_TOKEN      GitHub personal access token (required)
  MISTRAL_API_KEY   Mistral API key (required)
`);
      process.exit(0);
    }
  }

  return args;
}

// Get repository info from package.json
async function getRepoFromPackageJson(): Promise<string> {
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
    const repoUrl = packageJson.repository?.url || "";
    
    // Extract owner/repo from URL (e.g., "https://github.com/Vestcodes/vcecom.git" -> "Vestcodes/vcecom")
    const match = repoUrl.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/);
    if (match) {
      return match[1];
    }
    
    throw new Error("Could not extract repository from package.json");
  } catch (error) {
    throw new Error(`Failed to read package.json: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Validate environment variables
function validateEnv(): { githubToken: string; mistralApiKey: string } {
  const githubToken = process.env.GITHUB_TOKEN;
  const mistralApiKey = process.env.MISTRAL_API_KEY;

  if (!githubToken) {
    throw new Error("GITHUB_TOKEN environment variable is required");
  }
  if (!mistralApiKey) {
    throw new Error("MISTRAL_API_KEY environment variable is required");
  }

  return { githubToken, mistralApiKey };
}

// Fetch merged PRs from GitHub
async function fetchMergedPRs(
  octokit: Octokit,
  owner: string,
  repo: string,
  since?: string
): Promise<PRInfo[]> {
  console.log(`📡 Fetching merged PRs from ${owner}/${repo}...`);

  const prs: PRInfo[] = [];
  let page = 1;
  const perPage = 100;

  // Get date filter if --since tag is provided
  let sinceDate: Date | undefined;
  if (since) {
    try {
      const { data: tagData } = await octokit.repos.getTag({
        owner,
        repo,
        tag: since,
      });
      sinceDate = new Date(tagData.commit.commit.committer?.date || tagData.commit.commit.author?.date || "");
      console.log(`📅 Filtering PRs merged after ${sinceDate.toISOString()}`);
    } catch (error) {
      console.warn(`⚠️  Could not find tag ${since}, fetching all PRs`);
    }
  }

  while (true) {
    try {
      const { data, headers } = await octokit.pulls.list({
        owner,
        repo,
        state: "closed",
        sort: "updated",
        direction: "desc",
        per_page: perPage,
        page,
      });

      // Filter for merged PRs and apply date filter
      const mergedPRs = data
        .filter((pr) => pr.merged_at !== null)
        .filter((pr) => {
          if (!sinceDate) return true;
          const mergedAt = new Date(pr.merged_at!);
          return mergedAt > sinceDate;
        })
        .map((pr) => ({
          number: pr.number,
          title: pr.title,
          description: pr.body || "",
          mergedAt: pr.merged_at,
          author: pr.user?.login || "unknown",
          url: pr.html_url,
          labels: pr.labels.map((label) => label.name),
        }));

      prs.push(...mergedPRs);

      // Check if we've reached the date limit
      if (sinceDate && mergedPRs.length > 0) {
        const oldestMergedAt = new Date(mergedPRs[mergedPRs.length - 1].mergedAt!);
        if (oldestMergedAt <= sinceDate) {
          break;
        }
      }

      // Check if there are more pages
      if (!headers.link || !headers.link.includes('rel="next"')) {
        break;
      }

      page++;
    } catch (error) {
      if (error instanceof Error && "status" in error && (error as any).status === 404) {
        throw new Error(`Repository ${owner}/${repo} not found. Check your GITHUB_TOKEN permissions.`);
      }
      throw error;
    }
  }

  // Sort by merged date (newest first)
  prs.sort((a, b) => {
    const dateA = a.mergedAt ? new Date(a.mergedAt).getTime() : 0;
    const dateB = b.mergedAt ? new Date(b.mergedAt).getTime() : 0;
    return dateB - dateA;
  });

  console.log(`✅ Found ${prs.length} merged PR(s)`);
  return prs;
}

// Categorize PR using Mistral API
async function categorizePR(
  pr: PRInfo,
  mistralApiKey: string,
  retries = 3
): Promise<CategorizedPR> {
  const prompt = `You are a changelog generator. Analyze this Pull Request and categorize it.

PR Title: ${pr.title}
PR Description: ${pr.description || "No description provided"}
PR Labels: ${pr.labels.join(", ") || "None"}

Analyze this PR and return a JSON object with the following structure:
{
  "type": "feat" | "fix" | "docs" | "refactor" | "perf" | "test" | "build" | "ci" | "chore",
  "scope": "optional scope (e.g., 'products', 'orders', 'auth') or null",
  "breaking": true | false,
  "description": "A concise, user-facing description of what changed (1-2 sentences, no technical jargon)"
}

Rules:
- Use "feat" for new features
- Use "fix" for bug fixes
- Use "docs" for documentation changes
- Use "refactor" for code refactoring without behavior changes
- Use "perf" for performance improvements
- Use "test" for test additions/changes
- Use "build" for build system changes
- Use "ci" for CI/CD changes
- Use "chore" for maintenance tasks
- Set "breaking" to true only if this is a breaking change
- Description should be user-facing, not technical (avoid mentioning files, functions, or implementation details)
- Keep description concise (1-2 sentences max)

Return ONLY valid JSON, no markdown, no code blocks, no explanations.`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(MISTRAL_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mistralApiKey}`,
        },
        body: JSON.stringify({
          model: MISTRAL_MODEL,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mistral API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No content in Mistral API response");
      }

      // Parse JSON response (handle markdown code blocks)
      let jsonContent = content.trim();
      if (jsonContent.startsWith("```")) {
        // Extract JSON from markdown code block
        jsonContent = jsonContent.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      const parsed: MistralResponse = JSON.parse(jsonContent);

      // Validate and normalize type
      const validTypes = ["feat", "fix", "docs", "refactor", "perf", "test", "build", "ci", "chore"];
      const type = validTypes.includes(parsed.type) ? parsed.type : "chore";

      return {
        type: type as CategorizedPR["type"],
        scope: parsed.scope || undefined,
        breaking: parsed.breaking === true,
        description: parsed.description || pr.title,
        pr,
      };
    } catch (error) {
      if (attempt === retries) {
        console.warn(`⚠️  Failed to categorize PR #${pr.number} after ${retries} attempts, using fallback`);
        // Fallback: try to infer from title
        const title = pr.title.toLowerCase();
        let type: CategorizedPR["type"] = "chore";
        if (title.includes("fix") || title.includes("bug")) type = "fix";
        else if (title.includes("feat") || title.includes("add") || title.includes("new")) type = "feat";
        else if (title.includes("doc")) type = "docs";
        else if (title.includes("refactor")) type = "refactor";
        else if (title.includes("perf")) type = "perf";
        else if (title.includes("test")) type = "test";
        else if (title.includes("build")) type = "build";
        else if (title.includes("ci")) type = "ci";

        return {
          type,
          breaking: title.includes("breaking") || title.includes("!:"),
          description: pr.title,
          pr,
        };
      }
      // Wait before retry (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error("Failed to categorize PR");
}

// Batch categorize PRs with rate limiting
async function categorizePRs(
  prs: PRInfo[],
  mistralApiKey: string
): Promise<CategorizedPR[]> {
  console.log(`🤖 Categorizing ${prs.length} PR(s) using Mistral API...`);

  const categorized: CategorizedPR[] = [];
  const batchSize = 5; // Process 5 PRs concurrently
  const delayBetweenBatches = 1000; // 1 second delay between batches

  for (let i = 0; i < prs.length; i += batchSize) {
    const batch = prs.slice(i, i + batchSize);
    const batchPromises = batch.map((pr) => categorizePR(pr, mistralApiKey));

    try {
      const batchResults = await Promise.all(batchPromises);
      categorized.push(...batchResults);
      console.log(`  ✓ Processed ${Math.min(i + batchSize, prs.length)}/${prs.length} PR(s)`);
    } catch (error) {
      console.error(`  ✗ Error processing batch: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Rate limiting: wait between batches (except for the last one)
    if (i + batchSize < prs.length) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return categorized;
}

// Map PR type to changelog category
function getChangelogCategory(type: CategorizedPR["type"]): string {
  const categoryMap: Record<string, string> = {
    feat: "Added",
    fix: "Fixed",
    docs: "Documentation",
    refactor: "Changed",
    perf: "Changed",
    test: "Changed",
    build: "Changed",
    ci: "Changed",
    chore: "Changed",
  };
  return categoryMap[type] || "Changed";
}

// Generate changelog markdown
function generateChangelog(
  categorizedPRs: CategorizedPR[],
  version?: string
): string {
  // Group PRs by category
  const grouped: Record<string, CategorizedPR[]> = {};
  const breakingChanges: CategorizedPR[] = [];

  for (const categorized of categorizedPRs) {
    if (categorized.breaking) {
      breakingChanges.push(categorized);
    }
    const category = getChangelogCategory(categorized.type);
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(categorized);
  }

  // Build changelog
  let changelog = `# Changelog\n\n`;
  changelog += `All notable changes to this project will be documented in this file.\n\n`;
  changelog += `The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\n`;
  changelog += `and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n`;

  // Version header
  const date = new Date().toISOString().split("T")[0];
  if (version) {
    changelog += `## [${version}] - ${date}\n\n`;
  } else {
    changelog += `## [Unreleased]\n\n`;
  }

  // Breaking changes section (if any)
  if (breakingChanges.length > 0) {
    changelog += `### Breaking Changes\n\n`;
    for (const pr of breakingChanges) {
      const scopeText = pr.scope ? `**${pr.scope}**: ` : "";
      changelog += `- ${scopeText}${pr.description} ([#${pr.pr.number}](${pr.pr.url}))\n`;
    }
    changelog += `\n`;
  }

  // Standard categories
  const categoryOrder = ["Added", "Changed", "Fixed", "Documentation"];
  for (const category of categoryOrder) {
    if (grouped[category] && grouped[category].length > 0) {
      // Filter out breaking changes (already shown above)
      const nonBreaking = grouped[category].filter((pr) => !pr.breaking);
      if (nonBreaking.length > 0) {
        changelog += `### ${category}\n\n`;
        for (const pr of nonBreaking) {
          const scopeText = pr.scope ? `**${pr.scope}**: ` : "";
          changelog += `- ${scopeText}${pr.description} ([#${pr.pr.number}](${pr.pr.url}))\n`;
        }
        changelog += `\n`;
      }
    }
  }

  // Other categories
  for (const [category, prs] of Object.entries(grouped)) {
    if (!categoryOrder.includes(category) && prs.length > 0) {
      const nonBreaking = prs.filter((pr) => !pr.breaking);
      if (nonBreaking.length > 0) {
        changelog += `### ${category}\n\n`;
        for (const pr of nonBreaking) {
          const scopeText = pr.scope ? `**${pr.scope}**: ` : "";
          changelog += `- ${scopeText}${pr.description} ([#${pr.pr.number}](${pr.pr.url}))\n`;
        }
        changelog += `\n`;
      }
    }
  }

  changelog += `<!-- generated by changelog-ai -->\n`;

  return changelog;
}

// Main function
async function main() {
  try {
    const args = parseArgs();
    const { githubToken, mistralApiKey } = validateEnv();

    // Get repository info
    const repo = args.repo || (await getRepoFromPackageJson());
    const [owner, repoName] = repo.split("/");
    if (!owner || !repoName) {
      throw new Error(`Invalid repository format: ${repo}. Expected format: owner/repo`);
    }

    // Initialize Octokit
    const octokit = new Octokit({ auth: githubToken });

    // Fetch PRs
    const prs = await fetchMergedPRs(octokit, owner, repoName, args.since);

    if (prs.length === 0) {
      console.log("ℹ️  No PRs found. Exiting.");
      return;
    }

    // Categorize PRs
    const categorizedPRs = await categorizePRs(prs, mistralApiKey);

    // Generate changelog
    const changelog = generateChangelog(categorizedPRs, args.since);

    // Output
    const outputPath = args.output || path.join(process.cwd(), "CHANGELOG.md");

    if (args.dryRun) {
      console.log("\n📝 Generated changelog (dry-run):\n");
      console.log(changelog);
    } else {
      await fs.writeFile(outputPath, changelog, "utf-8");
      console.log(`\n✅ Changelog written to ${outputPath}`);
    }
  } catch (error) {
    console.error("\n❌ Error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run if executed directly
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});

