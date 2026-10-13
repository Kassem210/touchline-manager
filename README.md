# Touchline Manager

A football management game that runs entirely in the browser. Manage a real club (or one you create) across 21 leagues in Europe and Africa, or start a player career at 17.

Features: real 2025/26 squads (optional) or a fictional world, transfers, club facilities, domestic cups, Champions League, Europa League, CAF competitions, international breaks, the World Cup, Euros, AFCON and Club World Cup, live matches with in-match decisions in player career mode, a life system (money, cars, homes, relationships with a partner who reacts to how you live, children), boot sponsorship deals, agents, conversations with your manager, and a family legacy where your son can carry on your career.

No build step and no server: it's plain HTML and JavaScript. Saves are stored in each player's browser (IndexedDB) and can be exported to or imported from a `.json` file.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Page shell and styles |
| `data.js` | Leagues, clubs, nations, name pools |
| `real.js` | Optional real-player pack (2025/26 squads, approximate ratings) |
| `world.js` | National teams, tournaments, facilities, player life, legacy |
| `engine.js` | World generation, calendar, competitions, transfers, seasons |
| `match.js` | Match engine (quick sim and live) |
| `ui.js` | Interface, faces, saves |

## Run it locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Publish on your own domain with GitHub Pages

1. In this repository on GitHub, go to **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, then **Save**.
   After a minute the game is live at `https://<your-username>.github.io/<repo-name>/`.
3. Still in **Settings → Pages**, type your domain (for example `play.yourdomain.com`) under **Custom domain** and save. GitHub adds a `CNAME` file for you.
4. At the company where you bought the domain, open its DNS settings and add:
   - For a subdomain like `play.yourdomain.com`: a **CNAME** record, name `play`, value `<your-username>.github.io`.
   - For the bare domain `yourdomain.com`: four **A** records pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153`.
5. Wait for DNS to update (usually minutes, sometimes a few hours), then tick **Enforce HTTPS** in **Settings → Pages**.

Any other static host works too (Netlify, Cloudflare Pages, Vercel): upload this folder as-is, with no build command.

## Notes

- Club and competition names are real-world names used for a fan project. If you plan to monetise the game, consider renaming them; players can rename clubs and players in-game.
- With the real-player option, about 670 real players use approximate ratings based on 2025/26 squads; everyone else is generated. Using real names on a public site carries legal risk if you monetise it.
