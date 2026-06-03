/** @type {import('lint-staged').Config} */
export default {
  "frontend/src/**/*.{ts,tsx}": [
    "prettier --write",
  ],
  "frontend/src/**/*.{css}": [
    "prettier --write",
  ],
  "**/*.{json,md,yaml,yml}": [
    "prettier --write",
  ],
  "backend/**/*.py": [
    "ruff format",
    "ruff check --fix",
  ],
};
