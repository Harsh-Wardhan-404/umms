# UMMS Backend

Simple Express + TypeScript backend for the UMMS project.

### Tech stack
- Node.js + TypeScript
- Express
- (Planned) PostgreSQL with Prisma

### Requirements
- Node.js 18+ (recommend latest LTS)
- npm 9+

## Getting started

### 1) Clone
```bash
git clone https://github.com/Harsh-Wardhan-404/umms_backend.git
cd umms_backend
```

### 2) Install dependencies
```bash
npm install
```

### 3) Build
```bash
npm run build
```

### 4) Run
```bash
npm start
# Server starts on http://localhost:3000
```

### 5) Verify
```bash
curl http://localhost:3000/
# -> "Hello World"
```

Notes:
- Current `dev` script runs build + start once (no watch). Hot‑reload can be added later with `nodemon` or `ts-node-dev`.

## Scripts
- `npm run build`: Compile TypeScript to `dist/` via `tsc -b`
- `npm start`: Run compiled app from `dist/index.js`
- `npm run dev`: Build then start (one‑shot)

## Project structure
```
.
├── src/
│   └── index.ts           # App entrypoint (Express)
├── dist/                  # Transpiled JS output (build)
├── tsconfig.json          # TS compiler options
└── package.json
```




## Contributing

### Branching strategy
Trunk‑based development is recommended for this repo size:
- Create short‑lived branches off `main`:
  - `feature/<scope>-<desc>`
  - `fix/<issue>-<desc>`
  - `chore/<desc>`, `docs/<desc>`, `refactor/<desc>`, `test/<desc>`
- Open a PR into `main` (no direct pushes).

Example:
```bash
git checkout -b feature/auth-login
# commit work...
git push -u origin feature/auth-login
# open PR to main
```

### Pull requests
- Required before merging to `main`.
- At least one approval.
- Status checks must pass (tests/lint/build as they’re added).
- Keep PRs small and focused; link related issues.

### Commit messages
Use Conventional Commits:
- `feat: add user login route`
- `fix: handle null user on session restore`
- `chore: bump typescript`
- `docs: update README`
- `refactor: extract router`

