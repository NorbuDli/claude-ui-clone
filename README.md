# Claude AI Web Clone

A pixel-perfect, feature-complete clone of the modern **Claude AI** web interface with Claude 3.7 Sonnet hybrid reasoning & extended thinking, live interactive sandboxed **Artifacts** (React, HTML/JS, SVG, Mermaid, Code), Projects workspace, and direct Anthropic API streaming.

![Claude UI Banner](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80)

---

## ✨ Key Features

1. **Pixel-Perfect Claude.ai Design & Typography**:
   - Dark theme palette matching Claude's signature warm aesthetic (`#191816`, `#22211F`, terracotta `#DA7756`).
   - Editorial Serif headlines, clean UI typography, and syntax-highlighted code.
   - Exact sidebar layout with `+ New`, `Projects`, `Artifacts`, `Code (Upgrade)`, `Customize`, and date-grouped chat history with search and pinning.
   - Center landing layout greeting `✳ Hey there, Norbu` with prompt starter chips (`🎓 Learn`, `✏️ Write`, `</> Code`, `☕ Life stuff`, `💡 Claude's choice`).

2. **Claude 3.7 Extended Thinking**:
   - Collapsible **Thinking Process** dropdowns revealing step-by-step reasoning tokens before the final response stream.
   - Configurable thinking effort (`Off`, `Low`, `Medium`, `High`, up to 32,000 token budget).

3. **Interactive Sandboxed Artifacts Engine**:
   - Side-by-side split screen view with **Preview** and **Code** tabs.
   - **React Components**: Live execution using in-browser Babel Standalone, React 18, and Tailwind CSS.
   - **HTML5 Web Apps / Games**: Sandboxed iframe execution with Canvas, audio, and physics simulations.
   - **SVG Vector Art & Mermaid Diagrams**: Crisp rendering with copy and export.
   - **Download & Copy**: One-click download of `.tsx`, `.html`, `.svg`, or code files.

4. **Direct Anthropic API Integration & Zero-Config Demo Mode**:
   - Enter your own Anthropic API Key in the **Settings** modal or `.env` file for direct live streaming from `claude-3-7-sonnet-20250219`, `claude-3-5-sonnet-20241022`, `claude-3-5-haiku-20241022`, or `claude-3-opus-20240229`.
   - Built-in realistic interactive demo simulator allows testing all UI flows, streaming deltas, and live interactive artifacts even before adding an API key.

5. **Claude Projects & Customization**:
   - Create custom Projects with distinct instructions and domain rules.
   - Personalize Claude with your preferred name, role, and custom system instructions.

6. **Rich Multimodal & Voice Support**:
   - Upload images (with vision preview), text files, PDFs, and code files.
   - Speech-to-text voice dictation (Web Speech API).
   - Text-to-speech voice playback for Claude's responses.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open your browser at [http://localhost:3000](http://localhost:3000).

### 3. Adding Your Anthropic API Key
You can add your Anthropic API key in either of two ways:
1. **Via the Web UI (Recommended)**:
   - Click on your profile in the bottom-left corner (or the **Free plan · Upgrade** button in the top-right header).
   - Go to the **Anthropic API Key** tab.
   - Paste your `sk-ant-api03-...` key and click **Save API Key**. It is stored safely in your browser's local storage.
2. **Via `.env` file**:
   - Copy `.env.example` to `.env`
   - Set `VITE_ANTHROPIC_API_KEY=your_key_here`

---

## 🛠️ Tech Stack
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Markdown & Math**: `react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex`, `rehype-highlight`
- **Animations**: Framer Motion
- **Execution Sandbox**: Sandboxed iframe with React 18, Babel Standalone & Tailwind CDN
