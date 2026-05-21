# Contributing to FPVLovers Frontend

## Commit Message Convention

This project enforces [Conventional Commits](https://www.conventionalcommits.org/) on every commit. The enforcement is automatic — **husky** installs a `commit-msg` git hook that runs **commitlint** before any commit is accepted. If your commit message doesn't follow the convention, the commit is rejected immediately with an error.

This keeps the git history readable, makes changelogs automatable, and ensures every change is categorized consistently.

### Format

```
<type>(<scope>): <subject>
```

- `type` — required, must be one of the valid types listed below
- `scope` — optional, a short noun describing the area of change (e.g., `src`, `imports`, `tooling`)
- `subject` — required, a short description in lowercase, no trailing period

### Valid Commit Types

| Type       | When to use                                                        |
|------------|--------------------------------------------------------------------|
| `feat`     | A new feature                                                      |
| `fix`      | A bug fix                                                          |
| `docs`     | Documentation changes only                                         |
| `style`    | Formatting, whitespace, missing semicolons — no logic change       |
| `refactor` | Code restructuring without a feature addition or bug fix           |
| `test`     | Adding or updating tests                                           |
| `chore`    | Build process, tooling, or dependency updates                      |
| `perf`     | Performance improvements                                           |
| `ci`       | CI/CD configuration changes                                        |

### Example Valid Commit Messages

```
refactor(src): migrate app/ to src/app/
chore(tooling): add husky and commitlint
fix(imports): update relative lib imports to @/lib/ aliases
docs(claude): update architecture documentation
feat(tools): add new flight analyzer widget
```

---

## When a Commit Is Rejected

If your commit message doesn't follow the convention, commitlint will block the commit and print an error like this:

```
⧗   input: Update stuff
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]

✖   found 2 problems, 0 warnings
```

### How to fix it

Amend your commit message with:

```sh
git commit --amend
```

This opens your editor so you can rewrite the message. Once you save and close, the hook runs again. If the new message is valid, the commit goes through.

If you're using the `-m` flag, you can amend inline:

```sh
git commit --amend -m "fix(imports): correct broken @/lib alias paths"
```
