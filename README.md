# 🌼 Pookalam Designer

**Poovum Codeum — ISTE SB NSSCE, Dept. of Computer Science & Engineering**

An interactive, web-based digital canvas for designing a Pookalam — the traditional flower carpet made for Onam. Choose flowers, arrange petals, draw freehand, and let radial symmetry turn a single motif into a full festive design, all rendered live on an HTML5 canvas.

🔗 **Live site:** [irfanfarisf.github.io/pookalam-designer](https://irfanfarisf.github.io/pookalam-designer/)

---

## ✨ Features

- **Flower Tool** — place traditional flower motifs: Chethi (Marigold), Thamara (Lotus), Rose, and Pichakam (Jasmine).
- **Petals (Cut Flowers) Tool** — scatter loose petal confetti across the canvas, like the chopped flower bits used to fill gaps in a real Pookalam.
- **Shape Tool** — add custom decorative shapes to the design.
- **Freehand Draw Tool** — sketch original strokes and patterns.
- **Fill Tool** — flood-fill an enclosed region with a solid colour, a flower pattern, or a petal pattern.
- **Eraser** — remove elements from the canvas.
- **Radial Symmetry** — design once and mirror it automatically in Off / 2 / 4 / 6 / 8 / 12-way symmetry, the way real Pookalams are built ring by ring.
- **Select & Edit** — move, scale, rotate, and recolor any placed object; layered objects are tracked individually.
- **Design Templates** — start from ready-made traditional layouts and customize every element after applying.
- **Save / Load** — designs are saved to the browser's local storage so you can pick up where you left off.
- **High-Resolution PNG Export** — download your finished Pookalam as an image.
- **Responsive UI** — usable across desktop, tablet, and mobile.

## 🛠️ Tech Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) — build tool & dev server
- HTML5 Canvas API for all drawing and rendering
- [Tailwind CSS v4](https://tailwindcss.com/) (via `@tailwindcss/vite`) for styling
- [lucide-react](https://lucide.dev/) for icons
- [gh-pages](https://www.npmjs.com/package/gh-pages) for deployment

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- npm (comes bundled with Node.js)

### Installation & Local Development

```bash
# Clone the repository
git clone https://github.com/irfanfarisf/pookalam-designer.git
cd pookalam-designer

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173` (Vite's default port).

### Available Scripts

| Command           | Description                                       |
|--------------------|----------------------------------------------------|
| `npm run dev`      | Start the local development server with hot reload |
| `npm run build`    | Type-check and build an optimized production bundle to `dist/` |
| `npm run preview`  | Preview the production build locally               |
| `npm run lint`     | Run ESLint over the project                         |
| `npm run deploy`   | Build and publish `dist/` to GitHub Pages           |

## 📦 Deployment

This project is deployed as a static site via **GitHub Pages** using the `gh-pages` package (`npm run deploy`), publishing the `dist/` build output. Since it's a fully client-side app with no backend, it can just as easily be hosted on Vercel or Netlify.

## 📁 Project Structure

```
pookalam-designer/
├── public/           # Static assets (favicon, icon sprite)
├── src/
│   ├── App.tsx        # Main application — canvas engine, tools, UI
│   ├── main.tsx        # React entry point
│   ├── index.css        # Global styles / Tailwind entry
│   └── assets/          # Images used in the UI
├── index.html          # HTML entry point
├── vite.config.ts        # Vite + Tailwind + GitHub Pages base config
└── package.json          # Scripts & dependencies
```

## 🙏 Acknowledgements

Built for **Poovum Codeum**, a Pookalam Designer Website Competition organized by **ISTE SB NSSCE — Department of Computer Science and Engineering**, celebrating Onam through code.

---

*Design it. Code it. Bloom it.* 🌸