# Engineering Manager Dashboard

An AI-assisted decision-support dashboard that consolidates engineering signals into explainable insights and follow-up actions.

## Local development

```bash
npm install
npm run dev
```

Use `npm test`, `npm run lint`, and `npm run build` before deployment.

## Slack integration

Slack credentials are only read by the Vercel server functions. Copy `.env.example` for the required environment variable names; never expose the bot token through a `VITE_` variable.

The Slack app needs these bot token scopes:

- `channels:read`
- `channels:history`
- `users:read`

After changing scopes, reinstall the Slack app and update `SLACK_BOT_TOKEN` in Vercel. Invite the bot to at least one configured channel.

Phase 4 reads the latest 14 days, up to 100 root messages per channel, from:

- `#platform-help`
- `#platform-team`
- `#platform-release`
- `#incidents`

`/api/slack/health` verifies authentication, `/api/slack/channels` verifies channel access, and `/api/slack/messages` retrieves and normalizes messages. The frontend falls back to clearly labelled demo data when live retrieval fails.

## Frontend stack

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
