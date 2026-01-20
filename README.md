# JohnsBingo

A feature-rich, interactive Bingo board designed for streamers and parties, featuring customizable themes, penalty mechanics, and a specialized "Battle Mode."

---

## 🚀 Key Features

### 🎮 Game Modes & Win Conditions
* **Standard (Lines):** Win by completing a horizontal, vertical, or diagonal line.
* **Blackout (All):** Fill every square on the board to win.
* **Battle Mode (Shields):** A defensive mode where completed lines become "Fortified" with a rainbow-shield effect, making those squares immune to penalties.
* **Pattern Modes:** Specialized winning conditions including **Four Corners**, **X Pattern**, and **+ Pattern**.

### 🛡️ Battle Mode Protection
* **Rainbow Shields:** Protected squares cycle through a smooth rainbow animation.
* **Penalty Immunity:** Once a square is protected, it cannot be removed by "Random Removal" or "Total Clear" penalties.
* **Visual Feedback:** Fortified squares feature a shield icon and a glowing animated outline.

### ⚠️ Penalty System
* **Random Removal (Yellow):** A red highlight jumps across the board before a random unprotected square slowly fades away over 5 seconds.
* **Total Clear (Red):** Instantly wipes all marked squares that are not currently protected by a shield.
* **Dynamic Buttons:** Action buttons are automatically generated under the board and color-coded (Yellow for Random, Red for Clear) for quick access.

### 🎨 Customization & Themes
* **Theme Presets:** Choose from Carbon Dark, Light Clean, Neon Glow, or Purple Haze.
* **Color Control:** Manually adjust Accent, Marked, and Free Space colors via the settings panel.
* **Adjustable Text:** Scale cell text size from Small to Huge to fit your display needs.

### 📋 List Management
* **Word List Manager:** Save multiple custom word lists to local storage and load them later.
* **Add from List:** Merge existing items with saved lists to quickly build large boards.
* **Export/Import:** Export your saved lists as a JSON file for backup or sharing.

### 📺 Streamer Tools
* **Chat Commands:** Automatically generates unique chat commands (e.g., `!itm1`) for every square on the board to help viewers follow along.
* **Interactive Header:** Editable board title directly in the header that auto-saves to your session.
* **Persistence:** Your board state, marked squares, and settings are saved automatically so you can refresh without losing progress.

---

## 🛠️ Technical Details
* **Confetti Engine:** Integrated `canvas-confetti` for celebrations.
* **Animations:** Uses CSS `cubic-bezier` transitions for high-performance visual effects.
* **Storage:** Utilizes browser `localStorage` to keep your game data persistent across sessions.
