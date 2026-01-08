# GitHub Integration

## Prefer GitHub CLI Over Web Fetch

When given GitHub URLs (PRs, issues, repos), use the `gh` CLI instead of WebFetch for more reliable and complete data access.

### PR Information

```bash
# Get PR details with comments and reviews (comprehensive)
gh pr view <number> --repo <owner>/<repo> --json title,body,comments,reviews,reviewRequests,state,author,additions,deletions,changedFiles

# Get PR diff
gh pr diff <number> --repo <owner>/<repo>

# Get PR files changed
gh pr view <number> --repo <owner>/<repo> --json files

# Get PR checks status
gh pr checks <number> --repo <owner>/<repo>
```

### Complete PR Evaluation Workflow

When asked to evaluate PR feedback, you MUST fetch **all** feedback sources. Do not just fetch comments/reviews - also check security alerts and inline code comments.

**Step 1: Fetch PR comments and reviews**
```bash
gh pr view <number> --repo <owner>/<repo> --json title,body,comments,reviews,state
```

**Step 2: Fetch code scanning alerts (security vulnerabilities)**
```bash
gh api repos/<owner>/<repo>/code-scanning/alerts --jq '
  .[] | select(.state == "open") | {
    number: .number,
    rule: .rule.description,
    severity: .rule.severity,
    file: .most_recent_instance.location.path,
    line: .most_recent_instance.location.start_line
  }
'
```

**Step 3: Fetch inline review comments (code quality, suggestions)**
```bash
gh api repos/<owner>/<repo>/pulls/<number>/comments --jq '
  .[] | {
    id: .id,
    user: .user.login,
    file: .path,
    line: .line,
    body: .body
  }
'
```

**Step 4: Address ALL feedback**
Create a checklist and address each item:
- [ ] Human reviewer comments
- [ ] Claude Code review comments
- [ ] GitHub Advanced Security alerts (ReDoS, injection, etc.)
- [ ] GitHub Code Quality comments (dead code, useless assignments)
- [ ] Inline review suggestions

### Comment Sources

| Source | API/Location | Description |
|--------|--------------|-------------|
| Human reviewers | `gh pr view --json reviews` | Code owners, team members |
| Claude Code | `gh pr view --json comments` | AI-generated review (login: `claude`) |
| GitHub Advanced Security | `gh api .../code-scanning/alerts` | Security vulnerabilities (ReDoS, injection) |
| GitHub Code Quality | `gh api .../pulls/.../comments` | Code quality issues (login: `github-code-quality[bot]`) |
| Inline suggestions | `gh api .../pulls/.../comments` | Line-specific review comments |

### Filtering by Author

```bash
# Get all automated reviews from PR
gh pr view <number> --repo <owner>/<repo> --json reviews --jq '
  .reviews[] | select(.author.login | test("github-|claude")) | {author: .author.login, state: .state}
'

# Get specific inline comment by ID
gh api repos/<owner>/<repo>/pulls/<number>/comments --jq '
  .[] | select(.id == <comment_id>)
'
```

### URL Patterns for Specific Feedback

| URL Pattern | How to Fetch |
|-------------|--------------|
| `.../pull/<n>#issuecomment-<id>` | `gh pr view <n> --json comments` |
| `.../pull/<n>#discussion_r<id>` | `gh api repos/.../pulls/<n>/comments` |
| `.../security/code-scanning/<id>` | `gh api repos/.../code-scanning/alerts/<id>` |

### Review States
- `APPROVED` - Reviewer approved changes
- `CHANGES_REQUESTED` - Reviewer requested changes
- `COMMENTED` - Review with comments only
- `PENDING` - Review not yet submitted

### Issue Information

```bash
# Get issue details
gh issue view <number> --repo <owner>/<repo> --json title,body,comments,state,author

# List issues
gh issue list --repo <owner>/<repo> --json number,title,state
```

### Repository Information

```bash
# Get repo info
gh repo view <owner>/<repo> --json name,description,url

# List workflows
gh workflow list --repo <owner>/<repo>

# View run logs
gh run view <run-id> --repo <owner>/<repo> --log
```

### URL Parsing

When given a GitHub URL, extract the components:

| URL Pattern | Command |
|-------------|---------|
| `github.com/<owner>/<repo>/pull/<number>` | `gh pr view <number> --repo <owner>/<repo>` |
| `github.com/<owner>/<repo>/issues/<number>` | `gh issue view <number> --repo <owner>/<repo>` |
| `github.com/<owner>/<repo>` | `gh repo view <owner>/<repo>` |
| `github.com/<owner>/<repo>/actions/runs/<id>` | `gh run view <id> --repo <owner>/<repo>` |

### JSON Output Fields

Common useful JSON fields for PRs:
- `title`, `body`, `state`, `author`
- `comments` - PR comments
- `reviews` - Review comments and approvals
- `additions`, `deletions`, `changedFiles`
- `files` - List of changed files
- `commits` - Commit history

### Benefits Over WebFetch

1. **Complete data** - Access to all comments, reviews, and metadata
2. **Authentication** - Uses configured GitHub credentials
3. **Structured output** - JSON format for reliable parsing
4. **No rate limiting issues** - Authenticated requests have higher limits
5. **Access to private repos** - Works with repos you have access to
