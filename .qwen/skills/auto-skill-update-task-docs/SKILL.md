---
name: update-task-docs
description: Update project task documentation following SDLC workflow rules
source: auto-skill
extracted_at: '2026-07-02T10:49:34.971Z'
---

# Task Documentation Update — SDLC Workflow Compliance

This skill coordinates updates to task, bug, and documentation files following the open-erp SDLC workflow standards.

## When to use

Use this skill when:
- New tasks or bugs are completed and need documentation updates
- Sprint status changes and README dashboards need updating
- Technical specifications need to be created or modified
- Task status summaries need to be generated

## Workflow

1. **Review current state** — Read existing documentation, git log, and task files
2. **Assign subagents** — Use specialized agents for each role:
   - `solution-architect` — Technical review of implementations
   - `qa-engineer` — Bug report creation and verification
   - `project-manager-agent` — Documentation consistency and status updates
3. **Verify completeness** — Ensure all files are updated consistently
4. **Generate summary** — Create or update task status summary document

## Output structure

```
E:\Minh\open-erp\.qwen\skills\auto-skill-update-task-docs\
├── SKILL.md              (this file)
├── task_status_YYYY-MM-DD.md  (generated summary)
└── .gitignore entry    (auto-skill- prefix keeps out of version control)
```

## Input requirements

Before updating, verify:
- Git log shows completed work (commit messages)
- Code implementation matches documentation claims
- Test files have passing tests
- Traceability links are consistent

## Common patterns

### Sprint task update pattern
```markdown
| **TSK-{N}.{M}** | {Title} | {Summary} | [x] Done | {Owner} | [task_{NN}_{slug}.md](./tasks/task_{NN}_{slug}.md) |
```

### Bug update pattern
```markdown
| **BUG-{N}.{NN}** | {Title} | {Brief description} | [x] Completed | {Owner} | [bug_{NN}_{slug}.md](./bugs/bug_{NN}_{slug}.md) |
```

## Integration with SDLC workflow

This skill should be invoked when:
- A sprint is nearing completion and documentation needs sync
- Hotfixes are merged and need bug report creation
- Features complete QA and need status updates
- Project managers request status reports

## References

- SDLC Workflow: `.cursor/skills/sdlc-workflow/SKILL.md`
- Project Principles: `.agents/rules/project_principles.md`
- Technical Guidelines: `.agents/rules/technical_guidelines.md`