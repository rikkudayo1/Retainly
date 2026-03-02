# Retainly

Retainly is an AI-powered study assistant designed to enhance learning and information retention. It transforms your notes, documents, and even images into a suite of interactive study materials, including summaries, quizzes, and flashcards. Built with Next.js and Supabase, Retainly offers a gamified and community-driven approach to studying.

## Features

-   **AI Content Generation**:
    -   **Summaries**: Generate concise summaries from text, uploaded files (PDF, TXT, MD), or images.
    -   **Quizzes**: Automatically create multiple-choice quizzes with instant feedback and explanations.
    -   **Flashcards**: Instantly produce flashcard decks from your study materials.

-   **Interactive Study Tools**:
    -   **AI Study Assistant**: Chat with an AI to ask questions, clarify concepts, and plan your study sessions.
    -   **Flashcard Study Mode**: A dedicated interface for effective memorization with hints and performance tracking.

-   **Community & Gamification**:
    -   **Public Decks**: Publish your flashcard decks and browse a library of decks shared by the community.
    -   **Public Quizzes**: Publish your quizzes and browse a quiz shared by the community.
    -   **Leaderboard**: Compete on weekly and all-time leaderboards by earning points from study activities.
    -   **Daily Streaks & Rewards**: Maintain a daily login streak and claim gem rewards.
    -   **Gacha System**: Spend your earned gems to unlock new UI themes and personalize your experience.

-   **Personalization & Management**:
    -   **File Library**: Upload and manage your study documents in a central library for easy access across all tools.
    -   **Customizable Profiles**: Set your username, bio, avatar, and a custom profile banner.
    -   **Theme Engine**: Switch between multiple color themes, light/dark modes, and a unique "pixel" style mode.
    -   **Multi-language Support**: The interface supports both English and Thai.

## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (with App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
-   **AI**: [Groq API](https://groq.com/) for fast language model inference
-   **Backend**: [Supabase](https://supabase.com/) (Auth, PostgreSQL, Storage)
-   **Key Libraries**:
    -   `unpdf`: for PDF text extraction.
    -   `react-markdown`: for rendering generated content.
    -   `vaul`: for mobile-friendly drawers.
    -   `cmdk`: for command palette components.

## Getting Started

To run this project locally, follow these steps:

### 1. Prerequisites

-   Node.js (v20 or later)
-   npm, yarn, or pnpm
-   A Supabase account
-   A Groq API key

### 2. Installation

First, clone the repository to your local machine:

```bash
git clone https://github.com/rikkudayo1/Retainly.git
cd Retainly
```

Next, install the project dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root of the project and add the following environment variables. You can get the Supabase variables from your project's dashboard under `Project Settings > API`.

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Groq AI
GROQ_API_KEY=YOUR_GROQ_API_KEY
```

### 4. Supabase Setup

You will need to set up your Supabase project to match the application's schema.

1.  **Tables**: Create the required tables in your Supabase database. Key tables include `user_profiles`, `files`, `decks`, `cards`, `public_decks`, `chat_sessions`, `chat_messages`, and `activity_log`.
2.  **RPC Functions**: Set up the PostgreSQL functions used for operations like managing gems and calculating leaderboard stats (e.g., `increment_gems`, `spend_gems`, `get_public_decks`). The definitions can be inferred from their usage in `lib/db.ts`.
3.  **Storage**: Create a public Storage bucket named `avatars` to store user profile pictures.
4.  **Authentication**:
    -   Enable the Email provider.
    -   To enable social logins, add and configure the GitHub and Google OAuth providers in your Supabase dashboard. Ensure the callback URL is set correctly: `http://localhost:3000/auth/callback`.

### 5. Running the Development Server

Once your environment is configured, start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

The project uses the Next.js App Router and is organized as follows:

-   `app/(main)`: Main application routes that require authentication.
-   `app/auth`: Authentication-related pages (login, signup, callback).
-   `app/api`: API route handlers for AI generation, chat, and file extraction.
-   `components/`: Reusable React components, including UI primitives built with shadcn/ui.
-   `context/`: React Context providers for managing global state like themes (`ThemeContext`) and language (`LanguageContext`).
-   `hooks/`: Custom React hooks for handling complex state logic, such as chat sessions, gems, and streaks.
-   `lib/`: Core application logic, including Supabase client setup (`supabase.ts`), database interaction functions (`db.ts`), and static definitions (`banners.ts`, `translations.ts`).
-   `public/`: Static assets.