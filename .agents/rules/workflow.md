# Workflow

## Git Commits

**Conventional commits** - `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`  
**Multi-line messages** - Use for detailed context  
**Never --no-verify** - Fix the issue, don't bypass hooks  
*Verify:* Check git log format

## GitHub CLI

**Use `gh` over WebFetch** - Better data access, auth, private repos

**PR evaluation** - Fetch ALL sources:
```bash
# 1. Comments/reviews
gh pr view <n> --repo <owner>/<repo> --json title,body,comments,reviews,state

# 2. Security alerts
gh api repos/<owner>/<repo>/code-scanning/alerts

# 3. Inline comments
gh api repos/<owner>/<repo>/pulls/<n>/comments
```

**PR checklist:**
- [ ] Human reviewer comments
- [ ] AI code review comments  
- [ ] Security alerts (ReDoS, injection)
- [ ] Code quality comments
- [ ] Inline suggestions

**URL patterns:**
| URL | Command |
|-----|---------|
| `github.com/.../pull/<n>` | `gh pr view <n> --repo ...` |
| `github.com/.../issues/<n>` | `gh issue view <n> --repo ...` |
| `.../security/code-scanning/<id>` | `gh api .../code-scanning/alerts/<id>` |

**Review states:** `APPROVED`, `CHANGES_REQUESTED`, `COMMENTED`, `PENDING`
