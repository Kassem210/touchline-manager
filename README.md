# Touchline Manager

A football management game that runs entirely in the browser. Manage a real club (or one you create) across 21 leagues in Europe and Africa, or start a player career at 17.

Features: real 2025/26 squads (optional) or a fictional world, transfers, club facilities, domestic cups, Champions League, Europa League, CAF competitions, international breaks, the World Cup, Euros, AFCON and Club World Cup, live matches with in-match decisions in player career mode, a life system (money, cars, homes, relationships with a partner who reacts to how you live, children), boot sponsorship deals, agents, conversations with your manager, random events where you make choices, schools and football training for your children, and a family legacy where your son can carry on your career.

No build step and no server: it's plain HTML and JavaScript. Saves are stored in each player's browser (IndexedDB) and can be exported to or imported from a `.json` file.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Page shell and styles |
| `data.js` | Leagues, clubs, nations, name pools |
| `real.js` | Optional real-player pack (2025/26 squads, approximate ratings) |
| `world.js` | National teams, tournaments, facilities, player life, legacy |
| `online.js` | Friends and chat over Firebase (the Phone page) |
| `progress.js` | Playstyle traits, weekly training, potential that rises and falls, partner personalities |
| `ads.js` | Pitch-side advertising boards in the live match tracker (edit to add your own sponsors) |
| `career.js` | Discipline and getting sacked, reputation and press, season goals, veteran years, life after football |
| `events.js` | Random events with choices, children's schools and football training |
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

## Phone (friends and chat)

The Phone page uses Firebase (anonymous sign-in and Firestore). The project settings are in `online.js`, and the security rules are in `firestore.rules`: paste them into Firebase → Firestore Database → Rules and press Publish.

## Touchline Team (the `team/` folder)

A separate web app for real sports teams and clubs (football, basketball, tennis, gymnastics or any other sport). It lives at `/team/` on the same site, e.g. `https://<your-username>.github.io/touchline-manager/team/`.

- **Coaches** see each player's morning check-in (sleep, energy, soreness), meals, workouts and training load, take the register after every session with an optional rating, set plans, send feedback or instructions, update season stats and post notices or match-day squads. Alerts flag low energy, high soreness, missed sessions, players who said they can't make the next session, and instructions nobody has confirmed.
- **Players** log meals, workouts and a daily check-in, say whether they can make each session, tick off their plan, confirm instructions and see their own attendance, ratings and stats.
- **Accounts**: email and password through Firebase Authentication, with password reset by email. A coach creates a club and gets a 6-character code and invite link; players sign up and join with it. The club owner can make other members coaches.
- **Privacy**: players only ever see their own logs, plans, feedback, attendance and ratings. Coaches see everyone's. Ratings, attendance and stats can only be written by coaches. All of this is enforced by `firestore.rules`, not just hidden in the page.
- There's a demo team on the sign-in page for anyone who wants to look around before signing up.

### Turning it on (one time, in the Firebase console for project `touchline-1adc4`)

1. **Authentication → Sign-in method → Add new provider → Email/Password → Enable → Save.** (Anonymous sign-in stays on for the game.)
2. **Firestore Database → Rules**: paste the whole of `firestore.rules` (it contains the game's rules plus a "Touchline Team" section), replace `DEV_PASSWORD` as before, then **Publish**.
3. **Authentication → Settings → Authorized domains**: make sure the domain the site runs on is listed (your `github.io` domain and any custom domain).

Optional: under **Authentication → Templates** you can change the sender name and wording of the password-reset email.

### Data layout

`users/{uid}` (profile and list of clubs), `joinCodes/{code}`, and per club `clubs/{clubId}` with `members`, `sessions`, `announcements`, `registers` (coach only), and per-player `logs`, `plans`, `feedback`, `attendance`, `stats` and `rsvp`, each tagged with the player's `uid`.
