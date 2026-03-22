# learning-ts

TypeScript learning repository for an experienced Python developer (data scientist / AI engineer).

## Context

- The learner is proficient in Python (uv, FastAPI, Streamlit, Terraform)
- Goal: read, understand, and write production TypeScript fluently
- Capstone: build a simplified nanoclaw (message-driven container orchestrator)
- Format: interactive lessons (weeks 1-3), then project-based with code review

## Tech stack

- Runtime: Node.js 20+ (Bun covered later)
- Package manager: npm (pnpm covered later)
- TypeScript: strict mode
- Linting: ESLint + Prettier
- Testing: Vitest
- Projects use ES modules (`"type": "module"`)

## Conventions

- Lessons live in `lessons/` — executable `.ts` files with inline comments
- Projects live in `projects/` — each has its own README with brief and acceptance criteria
- Early lessons include Python↔TypeScript comparisons (weeks 1-3 only)
- Run lesson files with: `npx ts-node --esm <file>`
