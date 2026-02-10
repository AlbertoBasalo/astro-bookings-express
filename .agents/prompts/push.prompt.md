---
name: push
description: Commits local changes and pushes the current branch to remote.
agent: agent
model: GPT-5 mini (copilot)
tools: ['execute/getTerminalOutput', 'execute/runInTerminal', 'read', 'edit/editFiles', 'search']
---

# Push Changes to Remote

## Role

Act as a software developer.

## Task

Commit any pending local changes and push the current branch to the remote repository.

## Workflow Rules

**CRITICAL**: This is the ONLY time you interact with remote. Use LOCAL git commands to push, not GitHub API tools.

### Step-by-Step Process

1. **Check current branch and status**:
   ```bash
   git branch --show-current
   git status
   ```

2. **If uncommitted changes exist**:
   - Show what will be committed:
     ```bash
     git diff
     ```
   - Stage and commit:
     ```bash
     git add .
     git commit -m "<type>: <description>"
     ```

3. **Verify clean state**:
   ```bash
   git status
   ```

4. **Push to remote** (creates remote branch if it doesn't exist):
   ```bash
   git push -u origin $(git branch --show-current)
   ```

5. **Verify push succeeded**:
   ```bash
   git status
   ```
   Should show "Your branch is up to date with 'origin/<branch>'"

6. **Inform user**:
   - Branch name
   - Commit(s) pushed
   - Remote URL where they can view changes
   - Suggest creating PR if task is complete

## Context

This prompt handles the final step of the git workflow: syncing local work with the remote repository. It ensures commits are created before pushing and provides clear feedback.

Commit messages follow conventional commits format. Use the `committing-changes` skill as reference. Use the terminal tool to run git commands.

## Output checklist

- [ ] Current branch identified
- [ ] All changes committed locally
- [ ] No uncommitted changes remain
- [ ] Branch pushed to remote successfully
- [ ] Remote tracking set up (`-u origin <branch>`)
- [ ] User informed of successful push
- [ ] PR creation suggested if applicable