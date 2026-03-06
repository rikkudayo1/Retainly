<div align="center">

<img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white" />
<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
<img src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
<img src="https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?style=for-the-badge&logo=tailwind-css&logoColor=white" />
<img src="https://img.shields.io/badge/Groq-AI_Powered-F55036?style=for-the-badge" />
<img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />

<br /><br />

```
██████╗ ███████╗████████╗ █████╗ ██╗███╗   ██╗██╗  ██╗   ██╗
██╔══██╗██╔════╝╚══██╔══╝██╔══██╗██║████╗  ██║██║  ╚██╗ ██╔╝
██████╔╝█████╗     ██║   ███████║██║██╔██╗ ██║██║   ╚████╔╝ 
██╔══██╗██╔══╝     ██║   ██╔══██║██║██║╚██╗██║██║    ╚██╔╝  
██║  ██║███████╗   ██║   ██║  ██║██║██║ ╚████║███████╗██║   
╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝╚══════╝╚═╝   
```

### `~/retainly` — AI-powered learning & retention platform

*Upload → Generate → Master*

<br />

</div>

---

## 📖 Overview

**Retainly** is a full-stack learning platform that turns any document, PDF, or block of text into a complete study kit — AI-generated summaries, flashcard decks, quizzes, and more. Built with a terminal/hacker aesthetic and designed for students who want to study smarter, track their progress, and compete with friends.

```
01. Upload   →   Drop in any document, PDF, or text
02. Generate →   AI creates summaries, quizzes & flashcards
03. Master   →   Study, track streaks, climb the leaderboard
```

---

## ✨ Features

### 🤖 AI Generation Engine
A two-pass pipeline powered by [Groq](https://groq.com/):

- **Pass 1** — `llama-3.3-70b-versatile` reads the raw input and generates a summary, key concepts, flashcards, and a compact `quiz_seed`
- **Pass 2** — `qwen/qwen3-32b` (reasoning model) receives only the seed to generate high-quality quiz questions — never the full source
- **Vision support** — `llama-4-scout-17b-16e-instruct` handles image inputs
- **Auto language detection** — all output matches the source language (English, Thai, and more)

### 📄 Document Library
Upload PDFs and text files once, reuse them everywhere. Extracted text is stored in Supabase and accessible across summaries, flashcards, quizzes, and AI chat without re-uploading.

### ✨ AI Summary
- Accepts file, pasted text, or an image as input
- Produces rich, structured markdown with headings, bullet points, and bold key terms
- Tabbed output: **Summary** and **Key Concepts**
- Rendered with `react-markdown` + GitHub Flavored Markdown

### 🃏 Flashcard System
- AI-generated cards with `keyword`, `hint`, and `explanation` fields
- Combine a file and pasted text simultaneously as input
- **Study mode** includes:
  - XP + leveling system (8 levels: Novice → Master)
  - Combo streak multipliers (×1.5 up to ×3 for 7+ in a row)
  - Per-card mastery tracking (unknown → weak → shaky → mastered)
  - Particle burst animations and floating XP labels
- **Public library** — publish decks, browse community decks, star and clone them
- Sort by popularity, newest, or most-added

### 🧪 Quiz System
- Multiple-choice questions (A/B/C/D) with per-question explanations
- Score tracking, weakness analysis, and full retry support
- After finishing, **challenge a friend** directly — sends them your score as a benchmark
- Browse and play community quizzes

### 💬 AI Chat
- Multi-session chat with named, persistent conversations
- Attach a stored file as document context, or attach an image directly
- Streamed responses for real-time typing effect
- Rename and delete sessions
- Persona: *Retainly AI — a smart and friendly study assistant*

### 🏆 Gamification
| Feature | Details |
|---|---|
| **Gems** | Virtual currency, earned & spent. Synced via Supabase Realtime |
| **Daily Streak** | Login streak with break detection. 30 gems daily reward |
| **XP & Levels** | Session XP with combo multipliers. 8 named levels |
| **Leaderboard** | Weekly and all-time. 100 pts per study session |
| **Gacha** | Spend 200 gems to unlock color themes. Arknights-inspired reveal animation |

### 👥 Social & Groups
- **Friends** — send/accept/decline/remove. See friends' streaks and gems
- **Challenges** — challenge friends after a quiz. 48-hour expiry window. Inbox/sent/history tabs
- **Groups** — Discord-style study groups with:
  - Custom banners, icons, and cover colors
  - Role system: owner / admin / member
  - Join via `RET-XXX` code
  - Live **activity feed** (quiz scores, streaks, library adds)
  - **Shared library** of contributed quizzes and decks
  - **Assignments** with optional due dates and per-member completion tracking

### 👤 User Profiles
- Public profile pages at `/profile/[username]`
- Avatar upload with crop modal, profile banner picker
- Displayed stats: streak 🔥, gems 💎, published deck count, activity heatmap
- Inline friend request management

### 🎨 Design System
- Terminal/hacker aesthetic throughout — monospace fonts, `~/retainly/[page]` breadcrumbs, noise texture overlays
- CSS variable theming (`--theme-primary`, `--theme-glow`) swappable via gacha unlocks
- Smooth page transitions with staggered `fadeUp` animations and skeleton loaders

### 🌐 Internationalization
- English and Thai supported via `LanguageContext` + `translations.ts`
- AI generation auto-detects and matches input language

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui + Radix UI |
| Backend / DB | Supabase (Postgres + Auth + Realtime + Storage) |
| AI / LLM | Groq SDK (Llama 3.3, Llama 4 Scout, Qwen3) |
| PDF Parsing | unpdf |
| Markdown | react-markdown + remark-gfm |
| Deployment | Vercel |
| Language | TypeScript 5 |

---

## 📁 Project Structure

```
retainly/
├── app/
│   ├── (main)/
│   │   ├── page.tsx              # Landing / home
│   │   ├── layout.tsx            # App shell with sidebar
│   │   ├── flashcards/           # Generate, study, publish, browse
│   │   ├── quizzes/              # Generate, study, browse, publish
│   │   ├── summary/              # AI summary generator
│   │   ├── chat/                 # Multi-session AI chat
│   │   ├── upload/               # Document library
│   │   ├── gacha/                # Theme gacha system
│   │   ├── challenges/           # Friend challenges inbox
│   │   ├── leaderboard/          # Weekly / all-time rankings
│   │   ├── friends/              # Friend management
│   │   ├── groups/               # Study groups
│   │   ├── profile/[username]/   # Public user profiles
│   │   └── settings/             # Profile settings
│   ├── api/
│   │   ├── generate/             # Two-pass AI generation pipeline
│   │   ├── chat/                 # Streaming AI chat
│   │   ├── extract/              # PDF text extraction
│   │   └── cron/clear-feed/      # Scheduled feed cleanup
│   └── auth/                     # Supabase auth callback
├── components/
│   ├── Sidebars/                 # Collapsible app sidebar
│   ├── ui/                       # shadcn/ui base components
│   ├── ActivityHeatmap.tsx       # GitHub-style contribution graph
│   ├── PublicDeckCard.tsx        # Reusable deck card
│   ├── ImageCropModal.tsx        # Avatar / banner crop
│   └── MarkdownContent.tsx       # Styled markdown renderer
├── context/
│   ├── GemsContext.tsx           # Global gems state
│   ├── ThemeContext.tsx          # Theme switching
│   └── LanguageContext.tsx       # i18n
├── hooks/
│   ├── useStreak.ts              # Daily streak + reward logic
│   ├── useGems.ts                # Realtime gems sync
│   └── useChatSessions.ts        # Chat session persistence
└── lib/
    ├── db/                       # Supabase query helpers
    │   ├── decks.ts / quizzes.ts
    │   ├── friends.ts / groups.ts
    │   ├── challenges.ts
    │   └── activity.ts
    └── supabase.ts               # Client + server Supabase instances
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Groq](https://console.groq.com) API key

### Installation

```bash
# Clone the repository
git clone https://github.com/rikkudayo1/Retainly.git
cd Retainly

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm run start
```

---

## 🗄 Database

Retainly uses **Supabase Postgres** with the following core tables:

| Table | Purpose |
|---|---|
| `user_profiles` | Username, bio, avatar, streak, gems, XP |
| `decks` + `cards` | Flashcard decks and individual cards |
| `quizzes` + `quiz_questions` | Quiz metadata and questions |
| `public_decks` | Published decks with star counts |
| `quiz_attempts` | Score history per user per quiz |
| `friends` | Friendship rows (pending / accepted) |
| `challenges` | Quiz challenges between friends |
| `groups` + `group_members` | Study groups and membership roles |
| `group_feed` | Activity feed events per group |
| `group_library` | Shared quizzes/decks contributed to groups |
| `group_assignments` | Assigned quizzes with due dates |
| `files` | Uploaded document metadata and extracted text |
| `chat_sessions` + `chat_messages` | AI chat history |
| `activity_log` | Daily activity for heatmap + leaderboard |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is private. All rights reserved.

---

<div align="center">

```
// built with ♥ and too much caffeine
```

</div>