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

### Instructions

Before creating the branch make sure to commit any pending changes using the `/commit` command prompt. Use the terminal tool to run git commands.

## Context

The branch name should be derived from the task description and should adhere to the naming conventions outlined in the AGENTS.md documentation. Use the terminal tool to run git commands.

## Output checklist:

- [ ] The branch name follows the `<type>/<slug>` pattern.