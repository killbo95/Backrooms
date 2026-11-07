# Backrooms multiplayer server

The game is hosted on GitHub Pages, so online rooms use a small Cloudflare Worker and Durable Object for real-time WebSocket messages.

## Deploy once

1. Open a terminal with Node.js installed and clone this repository, or download the repository.
2. From the repository folder, run:

   ```bash
   cd multiplayer
   npx wrangler login
   npx wrangler deploy
   ```

3. Follow Cloudflare's login/deploy prompts. The Worker name is `backrooms-multiplayer`.
4. Copy the deployed Worker URL shown by Wrangler. It will look like `https://backrooms-multiplayer.<your-account-subdomain>.workers.dev`.
5. Open the Backrooms website. Paste that URL into **Multiplayer Server URL** and press **SAVE SERVER URL**. Do this once on each device.

## Play together

- One player chooses **CREATE MULTIPLAYER ROOM** and shares the six-character code.
- Other players paste the same Worker URL, enter the code, and choose **JOIN ROOM**.
- Rooms support up to four players.

The Worker relays player positions and shared level/objective updates. It does not need GitHub credentials or game-site secrets.

## Notes

- The static game remains playable with **PLAY SOLO**.
- Durable Object bindings and the initial class migration are configured in `wrangler.toml`.
- If you change the Durable Object class or binding later, add a new migration rather than editing an already-deployed migration tag.
