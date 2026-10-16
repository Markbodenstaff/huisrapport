# Figma Make setup notes

## Environment

The active report flow requires `DB_HOST`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`. These names are configured in Make, but the latest bootstrap reported `ECONNREFUSED` while initializing the database. Verify the existing entries in Make settings → Secrets and check the database host, port, remote-access rules, and network accessibility. No secret values are stored here.

## Deployment

This repository is a Node.js runtime application with MySQL-backed report routes. Its `npm run build` command performs syntax checks and does not produce a deployable static output directory. Deploy preview was therefore explicitly skipped according to the verifier contract. A `.figma/make/deploy` script was not generated because publishing only `public/` would omit the required server and database behavior.
