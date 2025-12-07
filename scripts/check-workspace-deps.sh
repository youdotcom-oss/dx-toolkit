#!/bin/bash
# Check workspace dependencies for correct version format
# This script ensures all workspace packages use exact versions (no workspace:*, ^, or ~ prefixes)

set -e

echo "Checking workspace dependencies..."

ERRORS=0

# Check for workspace:* pattern
if grep -r "workspace:\*" packages/*/package.json 2>/dev/null; then
  echo "❌ Error: Use exact versions, not workspace:*"
  ERRORS=1
fi

# Check for ^ or ~ prefixes in @youdotcom-oss dependencies
if grep -rE '"@youdotcom-oss/[^"]+": "[\\^~]' packages/*/package.json 2>/dev/null; then
  echo "❌ Error: Use exact versions for workspace dependencies (no ^ or ~ prefixes)"
  ERRORS=1
fi

if [[ $ERRORS -eq 0 ]]; then
  echo "✅ All workspace dependencies use exact versions"
  exit 0
else
  echo ""
  echo "Workspace dependencies must use exact versions for published packages."
  echo "Example: \"@youdotcom-oss/mcp\": \"1.3.4\" (not \"^1.3.4\" or \"workspace:*\")"
  exit 1
fi
