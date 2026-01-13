#!/usr/bin/env bash
#
# Install You.com DX Toolkit plugins
# Usage: curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s <plugin-name> --claude|--cursor|--agents
#
# Examples:
#   curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-anthropic-integration --claude
#   curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-anthropic-integration --cursor
#   curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-anthropic-integration --agents
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
error() {
  echo -e "${RED}Error: $1${NC}" >&2
  exit 1
}

warning() {
  echo -e "${YELLOW}Warning: $1${NC}" >&2
}

success() {
  echo -e "${GREEN}$1${NC}"
}

info() {
  echo -e "${BLUE}$1${NC}"
}

# Cleanup function
TEMP_DIR=""
cleanup() {
  if [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ]; then
    info "Cleaning up temporary files..."
    rm -rf "$TEMP_DIR"
  fi
}
trap cleanup EXIT

PLUGIN_NAME=""
INSTALL_MODE=""
REPO="youdotcom-oss/dx-toolkit"
BRANCH="main"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --claude|--cursor|--agents)
      INSTALL_MODE="${1#--}"
      shift
      ;;
    --branch)
      BRANCH="$2"
      shift 2
      ;;
    *)
      if [ -z "$PLUGIN_NAME" ]; then
        PLUGIN_NAME="$1"
      else
        error "Unknown argument: $1"
      fi
      shift
      ;;
  esac
done

# Validate inputs
if [ -z "$PLUGIN_NAME" ] || [ -z "$INSTALL_MODE" ]; then
  error "Usage: curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s <plugin-name> --claude|--cursor|--agents

Required:
  <plugin-name>          Plugin to install (e.g., teams-anthropic-integration)
  --claude               Install for Claude Code
  --cursor               Install for Cursor
  --agents               Install for other AI agents

Optional:
  --branch <branch>      Install from specific branch (default: main)

Examples:
  curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-anthropic-integration --claude
  curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s ai-sdk-integration --cursor
  curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s claude-agent-sdk-integration --agents

Available plugins:
  - teams-anthropic-integration
  - ai-sdk-integration
  - claude-agent-sdk-integration
  - openai-agent-sdk-integration

See https://github.com/youdotcom-oss/dx-toolkit/blob/main/docs/MARKETPLACE.md"
fi

# Validate plugin name format
if [[ ! "$PLUGIN_NAME" =~ ^[a-z0-9-]+$ ]]; then
  error "Invalid plugin name: $PLUGIN_NAME
Plugin names must contain only lowercase letters, numbers, and hyphens."
fi

info "Installing $PLUGIN_NAME for $INSTALL_MODE..."

# Create temporary directory
TEMP_DIR=$(mktemp -d)
info "Downloading plugin..."

# Clone repository to temp directory (sparse checkout for plugin only)
cd "$TEMP_DIR"
git init -q
git remote add origin "https://github.com/$REPO.git"
git config core.sparseCheckout true
echo "plugins/$PLUGIN_NAME/" >> .git/info/sparse-checkout
git pull -q --depth=1 origin "$BRANCH"

# Verify plugin exists
PLUGIN_DIR="$TEMP_DIR/plugins/$PLUGIN_NAME"
if [ ! -d "$PLUGIN_DIR" ]; then
  error "Plugin not found: $PLUGIN_NAME
Check available plugins at: https://github.com/$REPO/tree/$BRANCH/plugins"
fi

# Verify skills directory exists
if [ ! -d "$PLUGIN_DIR/skills" ]; then
  error "Invalid plugin structure: $PLUGIN_NAME
Plugin must have a skills/ directory with agent-skills-spec format."
fi

# Determine installation path based on mode
case "$INSTALL_MODE" in
  claude)
    info "Installing for Claude Code..."

    # Install to .claude/plugins/
    INSTALL_DIR="./.claude/plugins/$PLUGIN_NAME"
    mkdir -p "./.claude/plugins"

    # Copy plugin contents
    cp -r "$PLUGIN_DIR"/* "$INSTALL_DIR/"
    success "✅ Plugin installed to $INSTALL_DIR"

    # Configure marketplace in .claude/settings.json
    SETTINGS_FILE="./.claude/settings.json"
    MARKETPLACE_NAME="youdotcom-dx-toolkit"
    MARKETPLACE_REPO="$REPO"

    if [ ! -f "$SETTINGS_FILE" ]; then
      info "Creating .claude/settings.json with marketplace configuration..."
      cat > "$SETTINGS_FILE" << EOF
{
  "extraKnownMarketplaces": {
    "$MARKETPLACE_NAME": {
      "source": {
        "source": "github",
        "repo": "$MARKETPLACE_REPO"
      }
    }
  }
}
EOF
      success "✅ Marketplace configured in .claude/settings.json"
    else
      # Check if marketplace is already configured
      if ! grep -q "$MARKETPLACE_REPO" "$SETTINGS_FILE" 2>/dev/null; then
        info "Adding marketplace to existing .claude/settings.json..."

        # Use jq if available, otherwise provide manual instructions
        if command -v jq &> /dev/null; then
          TEMP_FILE=$(mktemp)
          jq --arg name "$MARKETPLACE_NAME" --arg repo "$MARKETPLACE_REPO" '
            .extraKnownMarketplaces = (.extraKnownMarketplaces // {}) +
            {($name): {"source": {"source": "github", "repo": $repo}}}
          ' "$SETTINGS_FILE" > "$TEMP_FILE" && mv "$TEMP_FILE" "$SETTINGS_FILE"
          success "✅ Marketplace added to .claude/settings.json"
        else
          warning "jq not found - please manually add marketplace to .claude/settings.json"
          cat << EOF

Add this to your .claude/settings.json:

{
  "extraKnownMarketplaces": {
    "$MARKETPLACE_NAME": {
      "source": {
        "source": "github",
        "repo": "$MARKETPLACE_REPO"
      }
    }
  }
}

EOF
        fi
      else
        info "Marketplace already configured in .claude/settings.json"
      fi
    fi

    # Show next steps
    cat << EOF

  ✅ Claude Code Setup Complete!

  Marketplace configured: .claude/settings.json
  Plugin installed: $INSTALL_DIR

  Next steps:
    1. Restart Claude Code (if running)
    2. Skills will be automatically available from marketplace.json
    3. See plugin README for usage: $INSTALL_DIR/README.md

EOF
    ;;

  cursor)
    info "Installing for Cursor..."

    # Install to .claude/plugins/ (Cursor imports from Claude's system)
    INSTALL_DIR="./.claude/plugins/$PLUGIN_NAME"
    mkdir -p "./.claude/plugins"

    # Copy plugin contents
    cp -r "$PLUGIN_DIR"/* "$INSTALL_DIR/"
    success "✅ Plugin installed to $INSTALL_DIR"

    # Show next steps
    cat << EOF

  ✅ Cursor Setup Complete!

  Plugin installed: $INSTALL_DIR

  Next steps:
    1. Open Cursor Settings → Rules → Import Settings
    2. Enable "Claude skills and plugins"
    3. Cursor will automatically discover and use the skills

  Documentation: $INSTALL_DIR/README.md
  See: https://cursor.com/docs/context/rules#claude-skills-and-plugins

EOF
    ;;

  agents)
    info "Installing for other AI agents..."

    # Install to .agents/skills/ for universal agent discovery
    INSTALL_DIR="./.agents/skills/$PLUGIN_NAME"
    mkdir -p "./.agents/skills"

    # Copy plugin contents
    cp -r "$PLUGIN_DIR"/* "$INSTALL_DIR/"
    success "✅ Plugin installed to $INSTALL_DIR"

    # Show next steps
    cat << EOF

  ✅ Universal AI Agents Setup Complete!

  Plugin installed: $INSTALL_DIR

  Your AI agent will automatically discover skills by scanning the .agents/skills/ directory.

  Works with: Claude, Codex, Jules, Cody, Continue, VS Code, and 20+ other AI agents.

  Documentation: $INSTALL_DIR/README.md
  Learn more: https://agents.md/

EOF
    ;;

  *)
    error "Invalid install mode: $INSTALL_MODE"
    ;;
esac

success "Happy coding! 🚀"
