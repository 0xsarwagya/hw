export default {
  branches: ["prod"],
  tagFormat: "v${version}",
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "conventionalcommits",
        releaseRules: [
          { type: "feat", scope: "admin", release: "minor" },
          { type: "feat", scope: "backend", release: "minor" },
          { type: "fix", scope: "admin", release: "patch" },
          { type: "fix", scope: "backend", release: "patch" },
          { type: "feat", scope: "db", release: false },
          { type: "fix", scope: "db", release: false },
          { type: "feat", scope: "config", release: false },
          { type: "fix", scope: "config", release: false },
          { type: "docs", release: false },
          { type: "style", release: false },
          { type: "refactor", release: false },
          { type: "test", release: false },
          { type: "chore", release: false },
          { breaking: true, release: "major" },
        ],
      },
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "conventionalcommits",
        presetConfig: {
          types: [
            { type: "feat", section: "✨ Features", hidden: false },
            { type: "fix", section: "🐛 Bug Fixes", hidden: false },
            {
              type: "perf",
              section: "⚡ Performance Improvements",
              hidden: false,
            },
            { type: "refactor", section: "♻️ Code Refactoring", hidden: false },
            { type: "docs", section: "📝 Documentation", hidden: false },
            { type: "test", section: "✅ Tests", hidden: false },
            { type: "build", section: "👷 Build System", hidden: false },
            { type: "ci", section: "🔧 CI", hidden: false },
            { type: "chore", section: "🧹 Chores", hidden: false },
          ],
        },
      },
    ],
    [
      "@semantic-release/changelog",
      {
        changelogFile: "CHANGELOG.md",
      },
    ],
    [
      "@semantic-release/npm",
      {
        npmPublish: false,
      },
    ],
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json"],
        message:
          "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
    [
      "@semantic-release/github",
      {
        successComment: false,
        labels: false,
        releasedLabels: false,
      },
    ],
  ],
};
