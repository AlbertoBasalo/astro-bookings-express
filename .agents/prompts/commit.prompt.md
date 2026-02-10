---
name: commit
description: Commits pending changes.
agent: agent
model: GPT-5 mini (copilot)
tools: ['execute/getTerminalOutput', 'execute/runInTerminal', 'read', 'edit/editFiles', 'search']
---
# Commit Changes

## Role

Act as a software developer.

## Task

Commit all pending changes to the local repository.

## Workflow Rules

**CRITICAL**: Work ONLY with local git commands. NEVER use GitHub API tools (mcp_github_*) for committing. All commits must be local until explicitly pushed.

### Step-by-Step Process

1. **Check what will be committed**:
   ```bash
   git status
   git diff
   ```

2. **Stage all changes**:
   ```bash
   git add .
   ```

3. **Verify staged changes**:
   ```bash
   git status
   ```

4. **Create commit with conventional message**:
   ```bash
   git commit -m "<type>: <description>"
   ```
   Where `<type>` is one of: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`

5. **Verify commit was created**:
   ```bash
   git log -1 --oneline
   ```

6. **Show final status**:
   ```bash
   git status
   ```

## Context

Commit message format follows conventional commits:
- `feat:` for new features
- `fix:` for bug fixes
- `chore:` for maintenance
- `docs:` for documentation
- `test:` for tests
- `refactor:` for code restructuring

Use the `committing-changes` skill as reference. Use the terminal tool to run git commands.

## Output checklist

- [ ] Checked `git status` and `git diff` before committing
- [ ] All intended files are staged
- [ ] Commit message follows `<type>: <description>` format
- [ ] Commit created successfully (verified with `git log -1`)
- [ ] No uncommitted changes remain (verified with `git status`)
- [ ] Changes are LOCAL only (not pushed to remote unless explicitly requested)
