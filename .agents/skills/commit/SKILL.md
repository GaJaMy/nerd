---
name: commit
description: Draft concise Korean commit messages from this repository's current changes, or commit immediately when the user invokes /commit, using the project's type-colon header and bullet body.
---

# Commit

Use this skill in this repository when the user asks to create, polish, or choose a commit message from current changes. Also use it when the user invokes `/commit`.

## Format

Default to this shape:

```text
type : 전체 작업 내용 요약

- 실제 작업 내역
- 작업 단위별 변경 내용
```

- Use one of `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `build`, `ci`, or `style` as the type.
- Do not include parentheses or a scope by default. Use `feat : ...` unless the user explicitly asks for a scope.
- Write the summary and body in Korean unless the user asks for another language.
- Keep the header concise.
- Keep the body brief but concrete, organized by work unit.

## Workflow

Inspect the repository before drafting:

- Use `git status --short` to see staged, unstaged, and untracked files.
- Use `git diff --stat`, `git diff --cached --stat`, and targeted file reads to understand meaningful changes.
- If the repo has no commits yet or most files are untracked, treat the message as an initial implementation commit and inspect representative app, config, test, and documentation files.
- Do not invent behavior that is not visible in the code or project context.

Choose the commit type by the primary intent:

- `feat`: new user-facing product behavior or initial app implementation.
- `fix`: bug fix.
- `refactor`: behavior-preserving code restructuring.
- `chore`: repository maintenance, ignore rules, dependency housekeeping, or tooling-only work.
- `docs`: documentation-only change.
- `test`: test-only change.
- `build` or `ci`: build system or automation pipeline change.
- `style`: formatting-only change.

When changes are mixed, choose the type for the primary user-visible or project-level outcome and describe supporting config, docs, or tests in body bullets.

## /commit

When the user sends `/commit`, do the commit instead of only drafting a message:

- Inspect the worktree and current staged state.
- Draft the commit message using the format above.
- If no files are staged, stage the current relevant repository changes with `git add` before committing.
- If some files are already staged, commit the staged set and do not automatically add unstaged files unless the user asks for all changes.
- Run `git commit` with the drafted message.
- After committing, report the commit hash and the message used.

If `/commit` would include obviously unrelated or risky changes, pause and ask one concise question before committing. Otherwise, proceed without asking for another confirmation.
