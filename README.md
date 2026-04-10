# learning-ts

A structured TypeScript learning path — from fundamentals to full-stack development.

Built iteratively with Claude as an interactive course for an experienced Python developer
moving into TypeScript.

## Setup

```bash
# Requires Node.js 20+
node --version

# Install dependencies
npm install
```

## Running lessons

```bash
# Run any lesson file directly
npx ts-node --esm lessons/01-fundamentals/01-variables-and-types.ts
```

## Commands

```bash
npm run typecheck    # Type-check without emitting
npm run lint         # Lint all lesson and project files
npm run format       # Format with Prettier
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
```

## Curriculum

### Phase 1: Language Foundations (Weeks 1-4)

| Week | Topic                                            | Format                            |
| ---- | ------------------------------------------------ | --------------------------------- |
| 1    | Variables, types, functions, control flow        | Interactive lessons               |
| 2    | Interfaces, type aliases, unions, narrowing      | Interactive lessons               |
| 3    | Modules, package.json, tsconfig, ESLint/Prettier | Interactive lessons               |
| 4    | Async/await, Promises, error handling            | Interactive lessons + CLI project |

### Phase 2: Building Things (Weeks 5-8)

| Week | Topic                                      | Format                              |
| ---- | ------------------------------------------ | ----------------------------------- |
| 5    | Generics, utility types, advanced patterns | Lessons + exercises                 |
| 6    | Testing with Vitest, project structure     | Lessons + REST API project          |
| 7-8  | Real-time message processor                | Project (mirrors nanoclaw patterns) |

### Phase 3: Real-World TypeScript (Weeks 9-12)

| Week  | Topic                       | Format                  |
| ----- | --------------------------- | ----------------------- |
| 9-10  | Container orchestrator lite | Project (nanoclaw-lite) |
| 11-12 | React frontend + dashboard  | Project                 |

### Phase 4: Integration & Mastery (Weeks 13-16)

| Week  | Topic                                        | Format                      |
| ----- | -------------------------------------------- | --------------------------- |
| 13-14 | Full-stack integration, CI, advanced tooling | Project                     |
| 15-16 | Reading & contributing to nanoclaw           | Code review + contributions |

## Project arc

Each project builds on the last, culminating in a simplified version of
[nanoclaw](https://github.com/qwibitai/nanoclaw) — a message-driven container
orchestrator for AI agents.

```
CLI tool → REST API → Message processor → Container orchestrator → React dashboard → Full-stack app
```
