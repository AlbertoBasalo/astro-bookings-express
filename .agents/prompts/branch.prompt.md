---
name: branch
description: Creates a new git branch for the current task.
argument-hint: The task about to be worked on, used to derive the branch name.
agent: agent
model: GPT-5 mini (copilot)
tools: ['execute/getTerminalOutput', 'execute/runInTerminal', 'read', 'edit/editFiles', 'search']
---

# Create Git Branch

## Role

Act as a software developer.

## Task

Create a new git branch for the current task. The branch name should follow the pattern `<type>/<slug>`, where `<type>` is one of `feat`, `bug`, or `chore` based on the nature of the task, and `<slug>` is a concise, hyphen-separated description of the task.

## Workflow Rules

**CRITICAL**: Work ONLY with local git commands. NEVER use GitHub API tools (mcp_github_*) for creating branches or committing. This prevents local/remote history drift.

### Step-by-Step Process

1. **Check current status**:
   ```bash
   git status
   ```

2. **If there are uncommitted changes**, stop and tell the user to run `/commit` first.

3. **Ensure you're on main branch**:
   ```bash
   git checkout main
   git pull origin main
   ```

4. **Create and checkout the new branch**:
   ```bash
   git checkout -b <type>/<slug>
   ```

5. **Verify the branch was created**:
   ```bash
   git branch --show-current
   ```

## Context

The branch name should be derived from the task description and adhere to the naming conventions in AGENTS.md:
- `feat/<slug>` for new features
- `fix/<slug>` for bug fixes  
- `chore/<slug>` for maintenance tasks

Use the terminal tool to run git commands. Use the `committing-changes` skill as reference.

## Output checklist

- [ ] Checked `git status` before starting
- [ ] No uncommitted changes exist (or user confirmed to commit them first)
- [ ] On main branch and pulled latest changes
- [ ] New branch created with `<type>/<slug>` pattern
- [ ] Current branch verified with `git branch --show-current`
- [ ] Confirmed new branch name to user