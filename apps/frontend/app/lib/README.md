# Lib Layer Rules

`app/lib` stores reusable, domain-agnostic logic.

## Responsibilities

- Keep route pages as orchestration layers with full JSX markup.
- Place only generic hooks, utils, and HTTP helpers in `lib`.
- Inject domain behavior through page-level config and data.

## Boundaries

- Do not import domain constants, enums, or entity types inside `lib`.
- `lib` APIs should accept adapters/config callbacks instead of hardcoded business rules.
- If a function cannot be reused outside one domain, keep it in the route for now.
