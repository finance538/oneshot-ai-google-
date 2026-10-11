# AGENTS.md

## Project Architecture
- Single Page Application (SPA) built with React + Vite (`src/App.tsx`).
- Styled using Vanilla CSS (`src/index.css`) to meet specific branding guidelines for "oneShot Brand Studio".
- Interacts with a Serverless Backend via Netlify Functions (`netlify/functions/create-order.ts`).

## Key Directories
- `src/`: React frontend source code.
- `netlify/functions/`: Serverless endpoint for creating Telr payment requests.

## Coding Conventions
- **TypeScript:** Strict typing enabled.
- **Styling:** Vanilla CSS with custom CSS variables defining the brand's primary colors (Obsidian Black and Flame Orange). Uses Flexbox and Grid. TailwindCSS is intentionally avoided.
- **Language:** Arabic language is the primary display language (RTL). English typography is handled by the 'Outfit' font.

## Important Decisions
- The application connects to Telr using their `order.json` API payload, which is proxied through a Netlify Function. This architecture ensures that the Live Authentication Key is never exposed in the browser.
- Framed integration and standard Hosted integration are both supported through conditional rendering based on the active payment method.
- Real-time toggles for security constraints are implemented in the UI. (These toggles are representative and would require corresponding backend risk-rule overrides in Telr's actual API to enforce dynamically on a per-transaction basis).