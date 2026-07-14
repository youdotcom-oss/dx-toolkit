#!/bin/bash
# Check workspace dependencies for correct version format
#
# This script ensures all workspace packages and plugins use exact versions
# for @youdotcom-oss dependencies (no workspace:*, ^, or ~ prefixes).
#
# WHY EXACT VERSIONS?
# - Published npm packages require concrete version numbers
# - Prevents cascading version resolution issues
# - Enables manual control over when to update dependencies
# - Supports coordinated prerelease testing (e.g., mcp@1.4.0-next.1)
#
# HOW DEPENDENCIES ARE UPDATED:
# - Publish workflows create GitHub issues when dependencies need updating
# - Maintainers review, test, and manually update dependent packages/plugins
# - This gives flexibility for prerelease coordination and prevents auto-breakage
#
# WHERE THIS RUNS:
# - CI workflow (.github/workflows/ci.yml) on every PR and push to main
# - Pre-commit hooks (optional, via lint-staged)

set -e

echo "Checking workspace dependencies in packages/ and plugins/..."

ERRORS=0

# Check packages/ directory
echo ""
echo "Checking packages/..."
if grep -r "workspace:\*" packages/*/package.json 2>/dev/null; then
  echo "❌ Error in packages/: Use exact versions, not workspace:*"
  ERRORS=1
fi

if grep -rE '"@youdotcom-oss/[^"]+": "[\\^~]' packages/*/package.json 2>/dev/null; then
  echo "❌ Error in packages/: Use exact versions for workspace dependencies (no ^ or ~ prefixes)"
  ERRORS=1
fi

# Check plugins/ directory
if [[ -d "plugins" ]]; then
  echo ""
  echo "Checking plugins/..."

  if grep -r "workspace:\*" plugins/*/package.json 2>/dev/null; then
    echo "❌ Error in plugins/: Use exact versions, not workspace:*"
    ERRORS=1
  fi

  if grep -rE '"@youdotcom-oss/[^"]+": "[\\^~]' plugins/*/package.json 2>/dev/null; then
    echo "❌ Error in plugins/: Use exact versions for workspace dependencies (no ^ or ~ prefixes)"
    ERRORS=1
  fi
fi

echo ""
if [[ $ERRORS -eq 0 ]]; then
  echo "✅ All workspace dependencies use exact versions"
  exit 0
else
  echo "❌ Workspace dependencies must use exact versions for published packages."
  echo ""
  echo "Correct format:"
  echo "  \"@youdotcom-oss/mcp\": \"1.3.4\""
  echo ""
  echo "Incorrect formats:"
  echo "  \"@youdotcom-oss/mcp\": \"^1.3.4\"  (no ^ prefix)"
  echo "  \"@youdotcom-oss/mcp\": \"~1.3.4\"  (no ~ prefix)"
  echo "  \"@youdotcom-oss/mcp\": \"workspace:*\"  (no workspace:*)"
  echo ""
  echo "NOTE: Dependencies are NOT auto-bumped by publish workflows."
  echo "When a package is published, an issue is created for manual review."
  exit 1
fi
