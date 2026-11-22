# Repository Guidelines

## Stack and Module Map

ShopLedger is a Node.js application using Express and CommonJS. Its browser interface is plain HTML, CSS, and JavaScript. Data is stored in `data/db.json`.

- `server.js` creates the Express app and mounts the route modules.
- `routes/` contains product, order, customer, and report API handlers.
- `lib/` contains pricing, tax, inventory, order, ledger, invoice, date, coupon, store, and report logic.
- `public/` contains the UI and static assets; `config.js` contains app configuration.

## Commands

- `npm start` starts the server (`node server.js`); the default port is `3000`, configurable with `PORT`.
- `npm test` is currently a placeholder that exits with an error; no automated test runner is configured.

## Change Rules

- Before changing behavior, write characterization tests that capture the current behavior.
- Change only the module the ticket is about. Avoid unrelated edits.
- Tests must never read or modify `data/db.json`; use isolated test data instead.
- Add no dependencies. Use the packages already declared in `package.json`.
