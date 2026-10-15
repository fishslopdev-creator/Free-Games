# Free-Games

These are free games! Quick, quiet games that run in any web browser: no downloads, no sign-in, no ads, no sound.

## Games

| Game | Controls |
| --- | --- |
| Snake | Arrow keys / WASD, on-screen buttons, or swipe |
| 2048 | Arrow keys / WASD, on-screen buttons, or swipe (with undo + auto-save) |
| Minesweeper | Mouse (right-click to flag), keyboard, or Flag mode for touch |
| Memory Match | Mouse or keyboard |
| Tic-Tac-Toe | Mouse or number keys; vs. computer or a friend |
| Breakout | Mouse, touch, or arrow keys |

## Made for school computers

- **Nothing to install.** Plain HTML, CSS and JavaScript. No plugins, Flash, or downloads.
- **No outside servers.** No CDNs, web fonts, trackers, or third-party game sites, so nothing extra has to load.
- **Works offline.** Download the repo as a ZIP, unzip it, and double-click `index.html`. It also runs from a USB drive or a shared folder.
- **Light on old or slow PCs and Chromebooks.** The whole site is tiny and the games are simple.
- **Quiet.** No sound at all.
- **Pauses itself.** Games pause when you switch tabs or windows.
- **Accessible.** Light, dark, and high-contrast themes, adjustable text size, a reduce-motion option, full keyboard play, screen-reader labels, and layouts that fit small screens.
- **Scores stay on the computer.** Best scores and settings are saved in the browser only. If the school browser blocks storage, the games still work and just won't remember scores.

## Putting it online (GitHub Pages)

1. In the repo on GitHub, go to **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, pick the branch, and choose the `/ (root)` folder.
3. Save. After a minute the site will be at `https://<your-username>.github.io/Free-Games/`.

## Adding a game

Copy one of the pages in `games/` (for example `memory.html` + `memory.js`). Keep the `../assets/style.css` and `../assets/settings.js` includes so themes and scores work, then add a card for it in `index.html`.
