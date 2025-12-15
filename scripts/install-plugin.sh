#!/usr/bin/env bash
#
# Install You.com DX Toolkit plugins
# Usage: curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s <plugin-name> --claude|--cursor|--agents.md
#
# Examples:
#   curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-anthropic-integration --claude
#   curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-anthropic-integration --cursor
#   curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-anthropic-integration --agents.md
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

PLUGIN_NAME=""
INSTALL_MODE=""
VERSION="latest"
CUSTOM_DIR=""
REPO="youdotcom-oss/dx-toolkit"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --claude|--cursor|--agents.md)
      INSTALL_MODE="${1#--}"
      shift
      ;;
    --version)
      VERSION="$2"
      shift 2
      ;;
    --dir)
      CUSTOM_DIR="$2"
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
  error "Usage: curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s <plugin-name> --claude|--cursor|--agents.md

Required:
  <plugin-name>          Plugin to install (e.g., teams-anthropic-integration)
  --claude               Install for Claude Code (creates .claude/settings.json)
  --cursor               Install for Cursor (uses Claude's plugin system)
  --agents.md            Install for other AI agents (appends to AGENTS.md)

Optional:
  --version X.Y.Z        Install specific version (default: latest)
  --dir PATH             Directory for --agents.md mode (default: .dx-toolkit)

Examples:
  curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-anthropic-integration --claude
  curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-anthropic-integration --cursor
  curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-anthropic-integration --agents.md

Available plugins:
  - teams-anthropic-integration
  - ai-sdk-integration

See https://github.com/youdotcom-oss/dx-toolkit/blob/main/docs/MARKETPLACE.md"
fi

# Validate plugin name format
if [[ ! "$PLUGIN_NAME" =~ ^[a-z0-9-]+$ ]]; then
  error "Invalid plugin name: $PLUGIN_NAME
Plugin names must contain only lowercase letters, numbers, and hyphens."
fi

info "Installing $PLUGIN_NAME..."

# Construct download URL
if [ "$VERSION" = "latest" ]; then
  # Get latest release tag for this plugin via GitHub API
  info "Fetching latest version..."

  LATEST_RELEASE=$(curl -s "https://api.github.com/repos/$REPO/releases" \
    | grep -o "\"tag_name\": *\"$PLUGIN_NAME@v[^\"]*\"" \
    | head -n 1 \
    | sed 's/"tag_name": *"\(.*\)"/\1/')

  if [ -z "$LATEST_RELEASE" ]; then
    error "No releases found for plugin: $PLUGIN_NAME
Check available plugins at: https://github.com/youdotcom-oss/dx-toolkit/releases"
  fi

  TAG="$LATEST_RELEASE"
  VERSION="${LATEST_RELEASE#"$PLUGIN_NAME"@v}"
  info "Latest version: $VERSION"
else
  # Validate version format
  if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    error "Invalid version format: $VERSION
Expected format: X.Y.Z (e.g., 1.0.0)"
  fi

  TAG="${PLUGIN_NAME}@v${VERSION}"
fi

ARCHIVE_NAME="${PLUGIN_NAME}-v${VERSION}.tar.gz"
DOWNLOAD_URL="https://github.com/$REPO/releases/download/$TAG/$ARCHIVE_NAME"

info "Downloading from: $DOWNLOAD_URL"

# Determine installation path based on mode
INSTALL_DIR=""

case "$INSTALL_MODE" in
  claude|cursor)
    # Both Claude Code and Cursor use .claude/plugins/
    INSTALL_DIR="./.claude/plugins/$PLUGIN_NAME"
    mkdir -p "./.claude/plugins"

    if [ "$INSTALL_MODE" = "claude" ]; then
      info "Installing for Claude Code..."

      # Configure marketplace in .claude/settings.json
      SETTINGS_FILE="./.claude/settings.json"
      MARKETPLACE_NAME="youdotcom-dx-toolkit"
      MARKETPLACE_REPO="youdotcom-oss/dx-toolkit"

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
            # Use jq for proper JSON merging
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
    else
      info "Installing for Cursor (uses Claude's plugin system)..."
    fi
    ;;

  agents.md)
    # Install to custom directory for agents.md pattern
    BASE_DIR="${CUSTOM_DIR:-.dx-toolkit}"
    INSTALL_DIR="./$BASE_DIR/plugins/$PLUGIN_NAME"
    mkdir -p "./$BASE_DIR/plugins"
    info "Installing for agents.md pattern to $INSTALL_DIR..."
    ;;

  *)
    error "Invalid install mode: $INSTALL_MODE"
    ;;
esac

# Create installation directory
mkdir -p "$INSTALL_DIR"

# Download and extract
info "Installing to: $INSTALL_DIR"

if ! curl -fsSL "$DOWNLOAD_URL" | tar -xz -C "$INSTALL_DIR" 2>/dev/null; then
  error "Failed to download or extract plugin.
Check that the release exists: https://github.com/$REPO/releases/tag/$TAG"
fi

success "✅ $PLUGIN_NAME v$VERSION installed successfully!"

# For agents.md mode, append reference to project's AGENTS.md
if [ "$INSTALL_MODE" = "agents.md" ]; then
  AGENTS_FILE="./AGENTS.md"
  PLUGIN_AGENTS_REF="$INSTALL_DIR/AGENTS.md"
  PLUGIN_TITLE=$(echo "$PLUGIN_NAME" | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')

  BEGIN_MARKER="<!-- BEGIN: You.com DX Toolkit Plugins -->"
  END_MARKER="<!-- END: You.com DX Toolkit Plugins -->"

  if [ ! -f "$AGENTS_FILE" ]; then
    # Create new AGENTS.md with plugin section
    info "Creating AGENTS.md with plugin reference..."
    cat > "$AGENTS_FILE" << EOF
# Project Instructions for AI Agents

$BEGIN_MARKER

## $PLUGIN_TITLE

For ${PLUGIN_NAME//-/ }, see:
\`$PLUGIN_AGENTS_REF\`

$END_MARKER

EOF
    success "✅ Created AGENTS.md with plugin reference"
  elif ! grep -q "$BEGIN_MARKER" "$AGENTS_FILE" 2>/dev/null; then
    # AGENTS.md exists but no plugin section - append to end
    info "Adding plugin section to existing AGENTS.md..."
    cat >> "$AGENTS_FILE" << EOF

$BEGIN_MARKER

## $PLUGIN_TITLE

For ${PLUGIN_NAME//-/ }, see:
\`$PLUGIN_AGENTS_REF\`

$END_MARKER

EOF
    success "✅ Added plugin section to AGENTS.md"
  elif ! grep -q "$PLUGIN_NAME" "$AGENTS_FILE" 2>/dev/null; then
    # Plugin section exists but this plugin not added yet - insert before END_MARKER
    info "Adding plugin to existing plugin section..."
    # Use sed to insert before END_MARKER
    PLUGIN_NAME_SPACES="${PLUGIN_NAME//-/ }"
    sed -i.bak "/$END_MARKER/i\\
\\
## $PLUGIN_TITLE\\
\\
For $PLUGIN_NAME_SPACES, see:\\
\\\`$PLUGIN_AGENTS_REF\\\`\\
" "$AGENTS_FILE" && rm -f "$AGENTS_FILE.bak"
    success "✅ Added plugin reference to AGENTS.md"
  else
    info "Plugin already referenced in AGENTS.md"
  fi
fi

# Show next steps based on environment
echo ""
info "Next steps:"

case "$INSTALL_MODE" in
  claude)
    cat << EOF

  ✅ Claude Code Setup Complete!

  Marketplace configured: .claude/settings.json
  Plugin installed: $INSTALL_DIR

  To use this plugin:
    1. Restart Claude Code (if running)
    2. Use the plugin's slash command (see README.md for details)

  Documentation: $INSTALL_DIR/README.md

EOF
    ;;

  cursor)
    cat << EOF

  ✅ Cursor Setup Complete!

  Plugin installed: $INSTALL_DIR

  To use this plugin:
    1. Open Cursor Settings → Rules → Import Settings
    2. Enable "Claude skills and plugins"
    3. Cursor will automatically discover and use the plugin

  Documentation: $INSTALL_DIR/README.md
  See: https://cursor.com/docs/context/rules#claude-skills-and-plugins

EOF
    ;;

  agents.md)
    BASE_DIR="${CUSTOM_DIR:-.dx-toolkit}"
    cat << EOF

  ✅ Universal AI Agents Setup Complete!

  Plugin installed: $INSTALL_DIR
  Reference added: ./AGENTS.md

  Your AI agent will automatically discover and use this plugin via AGENTS.md.

  Works with: Claude, Codex, Jules, Cody, Continue, VS Code, and 20+ other AI agents.

  Documentation: $INSTALL_DIR/README.md
  Learn more: https://agents.md/

EOF
    ;;
esac

success "Happy coding! 🚀"
