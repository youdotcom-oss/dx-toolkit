#!/usr/bin/env bash
#
# Install You.com DX Toolkit plugins
# Usage: ./install-plugin.sh <plugin-name> [version]
#
# Examples:
#   ./install-plugin.sh teams-mcp-integration
#   ./install-plugin.sh teams-mcp-integration 1.0.0
#   curl -fsSL https://raw.githubusercontent.com/youdotcom-oss/dx-toolkit/main/scripts/install-plugin.sh | bash -s teams-mcp-integration
#

set -e

PLUGIN_NAME="$1"
VERSION="${2:-latest}"
REPO="youdotcom-oss/dx-toolkit"

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

# Validate inputs
if [ -z "$PLUGIN_NAME" ]; then
  error "Usage: $0 <plugin-name> [version]

Examples:
  $0 teams-mcp-integration
  $0 teams-mcp-integration 1.0.0

Available plugins:
  - teams-mcp-integration

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
  VERSION="${LATEST_RELEASE#$PLUGIN_NAME@v}"
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

# Detect environment and determine installation path
INSTALL_DIR=""

if [ -d "./plugins" ] || [ "$FORCE_AGENT_SDK" = "true" ]; then
  # Agent SDK environment
  INSTALL_DIR="./plugins/$PLUGIN_NAME"
  info "Detected Agent SDK environment"
elif [ -d "./.cursor" ]; then
  # Cursor IDE
  INSTALL_DIR="./.cursor/plugins/$PLUGIN_NAME"
  info "Detected Cursor IDE"
elif [ -d "./.windsurf" ]; then
  # Windsurf IDE
  INSTALL_DIR="./.windsurf/plugins/$PLUGIN_NAME"
  info "Detected Windsurf IDE"
else
  # Generic/fallback
  INSTALL_DIR="./$PLUGIN_NAME"
  info "Installing to current directory"
fi

# Create installation directory
mkdir -p "$INSTALL_DIR"

# Download and extract
info "Installing to: $INSTALL_DIR"

if ! curl -fsSL "$DOWNLOAD_URL" | tar -xz -C "$INSTALL_DIR" 2>/dev/null; then
  error "Failed to download or extract plugin.
Check that the release exists: https://github.com/$REPO/releases/tag/$TAG"
fi

success "✅ $PLUGIN_NAME v$VERSION installed successfully!"

# Show next steps based on environment
echo ""
info "Next steps:"

if [[ "$INSTALL_DIR" =~ ^./plugins/ ]]; then
  # Agent SDK
  cat << EOF

  Add to your Agent SDK code:

    import { query } from "@anthropic-ai/claude-agent-sdk";

    for await (const message of query({
      prompt: "Hello",
      options: {
        plugins: [
          { type: "local", path: "./plugins/$PLUGIN_NAME" }
        ]
      }
    })) {
      // Plugin features available
    }

  Documentation: $INSTALL_DIR/README.md

EOF
elif [[ "$INSTALL_DIR" =~ ^./.cursor/ ]]; then
  # Cursor
  cat << EOF

  For Cursor-specific setup:
  1. Copy AGENTS.md to .cursor/rules/:
     cp "$INSTALL_DIR/AGENTS.md" .cursor/rules/$PLUGIN_NAME.md

  2. Enable in Cursor Settings → Rules

  Documentation: $INSTALL_DIR/README.md

EOF
elif [[ "$INSTALL_DIR" =~ ^./.windsurf/ ]]; then
  # Windsurf
  cat << EOF

  For Windsurf-specific setup:
  1. Copy AGENTS.md to .windsurf/rules/:
     cp "$INSTALL_DIR/AGENTS.md" .windsurf/rules/$PLUGIN_NAME.md

  Documentation: $INSTALL_DIR/README.md

EOF
else
  # Generic
  cat << EOF

  Read the plugin documentation:
    cat $INSTALL_DIR/README.md

  For Claude Code:
    /plugin marketplace add youdotcom-oss/dx-toolkit
    /plugin install $PLUGIN_NAME

  For Agent SDK:
    mkdir -p plugins
    mv $PLUGIN_NAME plugins/
    # Then use: plugins: [{ type: "local", path: "./plugins/$PLUGIN_NAME" }]

EOF
fi

success "Happy coding! 🚀"
