#!/bin/bash

# Generate commit history JSON from git log
# This script extracts git commit information and formats it as JSON

set -e

OUTPUT_FILE="${1:-commit_history.json}"

echo "Generating commit history JSON..."

# Get git log with all fields, using null-safe format
git log --format="%H|%h|%T|%P|%an|%ae|%ad|%cn|%ce|%cd|%s|%b|%B" --date=iso | \
jq -R -s '
  # Split by newlines to get individual commits
  split("\n") |
  # Filter out empty lines
  map(select(length > 0)) |
  # Process each commit line
  map(
    # Split by pipe delimiter
    split("|") |
    # Ensure we have exactly 13 fields (pad with empty strings if needed)
    . as $fields |
    (13 - length) as $missing |
    if $missing > 0 then
      $fields + ([range($missing) | ""])
    else
      $fields[0:13]
    end |
    # Map to structured object with null-safe handling
    {
      commit: (.[0] // "" | if . == null then "" else . end),
      abbreviated_commit: (.[1] // "" | if . == null then "" else . end),
      tree: (.[2] // "" | if . == null then "" else . end),
      parent: (.[3] // "" | if . == null then "" else . end),
      author_name: (.[4] // "" | if . == null then "" else . end),
      author_email: (.[5] // "" | if . == null then "" else . end),
      date: (.[6] // "" | if . == null then "" else . end),
      committer_name: (.[7] // "" | if . == null then "" else . end),
      committer_email: (.[8] // "" | if . == null then "" else . end),
      committer_date: (.[9] // "" | if . == null then "" else . end),
      subject: (.[10] // "" | if . == null then "" else . end),
      body: (.[11] // "" | if . == null then "" else . end),
      full_message: (.[12] // "" | if . == null then "" else . end)
    } |
    # Apply escaping to all string fields (ensure they are strings first)
    .author_name |= (if type == "string" and . != null then (gsub("\n";"\\n") | gsub("\"";"\\\"")) else "" end) |
    .author_email |= (if type == "string" and . != null then (gsub("\n";"\\n") | gsub("\"";"\\\"")) else "" end) |
    .subject |= (if type == "string" and . != null then (gsub("\n";"\\n") | gsub("\"";"\\\"")) else "" end) |
    .body |= (if type == "string" and . != null then (gsub("\n";"\\n") | gsub("\"";"\\\"")) else "" end) |
    .full_message |= (if type == "string" and . != null then (gsub("\n";"\\n") | gsub("\"";"\\\"")) else "" end)
  )
' > "$OUTPUT_FILE"

if [ -f "$OUTPUT_FILE" ] && [ -s "$OUTPUT_FILE" ]; then
  echo "✅ Commit history generated successfully: $OUTPUT_FILE"
  COMMIT_COUNT=$(jq '. | length' "$OUTPUT_FILE" 2>/dev/null || echo "0")
  echo "📊 Total commits: $COMMIT_COUNT"
else
  echo "❌ Failed to generate commit history"
  exit 1
fi

