module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // New feature
        "fix", // Bug fix
        "docs", // Documentation changes
        "style", // Code style changes (formatting, etc.)
        "refactor", // Code refactoring
        "perf", // Performance improvements
        "test", // Adding or updating tests
        "build", // Build system or external dependencies
        "ci", // CI/CD changes
        "chore", // Other changes that don't modify src or test files
        "revert", // Revert a previous commit
      ],
    ],
    "scope-enum": [
      2,
      "always",
      [
        "admin", // Admin app changes
        "backend", // Backend app changes
        "db", // Database package changes
        "config", // Configuration changes
        "deps", // Dependency updates
        "release", // Release related
      ],
    ],
    "scope-empty": [2, "never"],
    "subject-case": [2, "always", "lower-case"],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
  },
};
