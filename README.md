## UMMS Frontend

A Vite + React + TypeScript frontend for the UMMS project.

### Tech stack
- **Build tool**: Vite 7
- **Framework**: React 19
- **Language**: TypeScript 5
- **Linting**: ESLint (TypeScript + React Hooks)

### Prerequisites
- **Node.js**: >= 18.17 (LTS) or >= 20.x recommended
- **npm**: >= 9 (repo uses `package-lock.json`)

Check your versions:
```bash
node -v
npm -v
```

### Quick start
```bash
# 1) Clone the repository (choose HTTPS or SSH)
# HTTPS
https://github.com/Harsh-Wardhan-404/umms_frontend.git


# 2) Change into the project directory
cd umms_frontend

# 3) Install dependencies
npm install

# 4) Start the development server (http://localhost:5173 by default)
npm run dev

# 5) Build for production (outputs to dist/)
npm run build

# 6) Preview the production build locally
npm run preview
```

### Available scripts
- `npm run dev`: Start Vite dev server with HMR
- `npm run build`: Type-check via TS project refs and build production bundle
- `npm run preview`: Serve the built `dist/` for local testing
- `npm run lint`: Run ESLint on the codebase



### Environment variables
There are no environment variables required at this time. If/when they are added, create a `.env` file at the repo root (and a `.env.example` for contributors) and document the keys here.

### Linting and code style
- Run lint checks: `npm run lint`
- ESLint is configured with TypeScript support and React hooks rules (`eslint.config.js`).
- Aim for readable, well-structured code per standard React + TypeScript best practices.

### Contributing
 Please follow the guidelines below to keep the project healthy and consistent.

1) Fork and branch
- Fork the repo and create a feature branch from `main`.
- Use a descriptive branch name, e.g. `feat/user-profile`, `fix/navbar-overlap`.

2) Commit messages
- Prefer the Conventional Commits style when possible:
  - `feat: add user profile card`
  - `fix: correct navbar z-index`
  - `chore: update dependencies`
  - `docs: improve setup instructions`

3) Code quality
- Run locally before pushing:
  - `npm run lint`
  - `npm run build`
- Ensure TypeScript errors are resolved and the dev server starts cleanly.

4) Pull requests
- Open a PR to `main` with a clear title and description:
  - What changed and why
  - Screenshots/GIFs for UI changes when helpful
  - Any breaking changes or follow-ups
- Keep PRs focused and reasonably sized.

5) Reviews and changes
- Be responsive to review feedback and keep the PR up to date with `main` as needed.

### Troubleshooting
- Dev server port in use: stop other processes on port 5173 or set a different port via Vite config/CLI.
- TypeScript or ESLint errors: run `npm run lint` and check TypeScript diagnostics from `npm run build` for detailed messages.

