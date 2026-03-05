import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { extractText } from "unpdf";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

const VISION_MODEL  = "meta-llama/llama-4-scout-17b-16e-instruct";
const CONTENT_MODEL = "llama-3.3-70b-versatile"; // summary, concepts, flashcards
const QUIZ_MODEL    = "qwen/qwen3-32b";           // reasoning model — receives condensed input only

// ─────────────────────────────────────────────────────────────────
// PROMPT 1 — summary + key_concepts + flashcards + quiz_seed
// quiz_seed is a compact concept list we pass to the quiz model
// so it never needs to see the raw source material
// ─────────────────────────────────────────────────────────────────
const CONTENT_PROMPT = `You are an expert study assistant. Given source material, return ONLY a valid JSON object — no markdown fences, no backticks, no text outside the JSON.

LANGUAGE RULE: Detect the language of the input. Every word of your output must be in that same language. Never mix scripts unless a term appears verbatim as a foreign technical word in the source.

Output this exact shape:
{
  "summary": "...",
  "key_concepts": [ { "term": "...", "definition": "..." } ],
  "flashcards": [ { "keyword": "...", "hint": "...", "explanation": "..." } ],
  "quiz_seed": "..."
}

═══ SUMMARY ═══
Markdown: # main title, ## section headings, **bold** key terms, bullet lists, short scannable paragraphs.

═══ KEY CONCEPTS (minimum 5) ═══
Full-sentence definitions explaining purpose and why it matters — not one-liners.
BAD: "Integer — a whole number."
GOOD: "Integer — a numeric data type storing whole numbers without decimals, used for counting, indexing, and operations where fractional values would be meaningless."

═══ FLASHCARDS (minimum depends on the provided information, make sure it's not too few, if it's words list make sure to cover all of it, for example Kanji word lists, Thai word lists, etc.) ═══
KEYWORD: canonical form — Japanese: always 漢字 (よみかた), never kana-only, never せんせい (せんせい). Code/formulas: exact notation.
HINT: one sentence guiding recall. Must NOT contain the keyword, a synonym, or the answer.
EXPLANATION: definition + context + usage example + memory hook.

═══ QUIZ SEED ═══
The quiz_seed field is a SHORT plain-text summary (max 300 words) containing:
- The subject domain and language of the material
- A numbered list of 12-15 distinct, testable concepts from the material, each with a one-sentence description
- Key distinctions and contrasts between related concepts (e.g. "for vs while: for is used when iteration count is known; while is used when condition-based")
- Any specific facts, rules, formulas, or values that appear in the material
Write it densely — this will be the ONLY input the quiz generator sees, so include everything needed to write good questions.`;

// ─────────────────────────────────────────────────────────────────
// PROMPT 2 — quiz only, receives quiz_seed not raw source
// ─────────────────────────────────────────────────────────────────
const QUIZ_PROMPT = `You are a quiz designer for an educational app. You will receive a concise concept summary extracted from study material. Generate exactly 10 multiple-choice questions based on it. Return ONLY a valid JSON array — no markdown fences, no backticks, no text outside the JSON.

LANGUAGE RULE: Every word — questions, choices, explanations — must be in the same language stated in the concept summary. Zero foreign-script bleed.

Output: array of 10 objects:
{ "question": "...", "choices": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "A", "explanation": "..." }

═══ STEP 1 — PLAN first, write second ═══
Before writing any question, mentally assign one concept per question across these levels:
  RECALL (max 2)      — state a fact or definition directly from the material
  COMPREHENSION (2-3) — explain purpose, effect, or meaning in context
  APPLICATION (2-3)   — reason through a NEW scenario using the knowledge
  ANALYSIS (2-3)      — compare concepts, find cause-effect, explain WHY
  EVALUATION (1-2)    — predict outcome of a change, judge best approach, find a flaw

═══ STEP 2 — RULES (every question must pass all of these) ═══

RULE 1 — EXACTLY ONE correct answer
Check every choice individually: can a student correctly argue THIS choice is the answer?
If more than one passes → the question is broken, redesign it.
BROKEN: "Which of these is a loop?" choices: for / while / do-while / if
WHY: for, while, do-while are ALL correct — three right answers.
FIXED: Ask what distinguishes them, or a scenario where only one fits.

RULE 2 — No vocabulary-lookup questions
Never: "What is X?" / "Which keyword does Y?" / "อะไรคือ X ที่ใช้สำหรับ Y?"
These test label memorisation, not understanding.
WRONG: "อะไรคือชนิดตัวแปรที่ใช้ในการเก็บข้อมูลจำนวนเต็ม?"
WRONG: "Which command is used for looping?"

RULE 3 — No duplicate concepts
Each question covers a different concept or a genuinely different angle. If two questions are about the same topic, replace one with a different concept.

RULE 4 — No repeated sentence structure
Every question must open differently. No multiple questions starting with "อะไรคือ", "ข้อใดคือ", "Which of the following is".

RULE 5 — No "All of the above" or "None of the above"

RULE 6 — Plausible distractors only
Wrong choices must represent real misconceptions — not absurd options a student can eliminate without studying.

RULE 7 — Only real terminology
Every term in every choice must be a real term that actually exists in the subject domain.
WRONG: listing "Function call", "Method call", "Control structure" as choices alongside if/for/while — these are category names, not C/C++ keywords.
RIGHT: choices are actual keywords, operators, types, or named concepts from the material.

RULE 8 — Vary correct answer position
Distribute correct answers: roughly 2-3 each across A, B, C, D. Do not cluster in one slot.

RULE 9 — Meaningful explanations
Each explanation must: (a) reason WHY the correct answer is right, (b) explain why the most tempting wrong answer is wrong.
WRONG: "คำตอบที่ถูกต้องคือ While เพราะ While ใช้สำหรับวนลูป" — just restates the answer.

═══ GOOD QUESTION STRUCTURES — use variety ═══
• Comparison: "ความแตกต่างที่สำคัญที่สุดระหว่าง [A] กับ [B] คืออะไร?"
• Scenario: "โปรแกรมเมอร์ต้องการ [X] ในสถานการณ์ที่ [Y] ควรเลือกใช้วิธีใด?"
• Predict outcome: "ถ้า [X เปลี่ยนไป] ผลลัพธ์จะเป็นอย่างไร?"
• Bug/fault: "โค้ดต่อไปนี้มีปัญหาอะไร? [short snippet]"
• Cause-effect: "เหตุใดการใช้ [concept] ในกรณีนี้จึงทำให้เกิด [problem]?"
• Best approach: "หากต้องการ [goal] วิธีใดเหมาะสมที่สุด?"
• Find the flaw: "ข้อใดอธิบายสาเหตุที่โค้ดนี้ผิดพลาดได้ถูกต้องที่สุด?"
• Challenge a claim: "นักเรียนอ้างว่า [wrong claim] ข้อใดโต้แย้งได้ดีที่สุด?"

═══ STEP 3 — SELF-CHECK before outputting ═══
□ All 5 cognitive levels covered
□ Every question has exactly ONE unambiguously correct answer
□ All 10 questions cover different concepts or angles
□ No two questions share the same opening structure
□ No "all/none of the above"
□ All distractors are plausible real concepts
□ All choice terms actually exist in the subject domain
□ Correct answer spread across A, B, C, D
□ Every explanation reasons WHY, not just restates
□ Zero foreign-language characters not in source material
Fix any failure before outputting.`;

// ─────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────
function cleanJson(raw: string): string {
  return raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

// Parses quiz JSON and gracefully handles truncated output by
// salvaging any complete question objects that were generated.
function parseQuiz(raw: string): object[] {
  const cleaned = cleanJson(raw);
  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : (parsed.quiz ?? []);
  } catch {
    // Output was truncated mid-JSON — extract all complete objects
    const matches = cleaned.match(/\{[\s\S]*?"question"[\s\S]*?"choices"[\s\S]*?"answer"[\s\S]*?"explanation"[\s\S]*?\}/g);
    if (matches && matches.length > 0) {
      const salvaged: object[] = [];
      for (const m of matches) {
        try { salvaged.push(JSON.parse(m)); } catch { /* skip malformed */ }
      }
      if (salvaged.length > 0) return salvaged;
    }
    // Nothing salvageable — return empty so the rest of the response still works
    console.warn("⚠️ Quiz parsing failed, returning empty quiz. Raw length:", cleaned.length);
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const formData     = await req.formData();
    const text         = formData.get("text")         as string | null;
    const file         = formData.get("file")         as File   | null;
    const imageBase64  = formData.get("imageBase64")  as string | null;
    const imageMimeType = formData.get("imageMimeType") as string | null;

    // ── Image input ─────────────────────────────────────────
    if (imageBase64 && imageMimeType) {
      const imageDataUrl = `data:${imageMimeType};base64,${imageBase64}`;

      // Step 1: get content + quiz_seed from vision model
      const contentRes = await groq.chat.completions.create({
        model: VISION_MODEL,
        messages: [
          { role: "system", content: CONTENT_PROMPT },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: imageDataUrl } },
              { type: "text", text: "Generate study materials from this image." },
            ],
          },
        ] as any,
        response_format: { type: "json_object" },
      });

      const content = JSON.parse(contentRes.choices[0].message.content!);
      const quizSeed: string = content.quiz_seed ?? "";
      delete content.quiz_seed;

      // Step 2: generate quiz from compact seed only
      const quizRes = await groq.chat.completions.create({
        model: QUIZ_MODEL,
        messages: [
          { role: "system", content: QUIZ_PROMPT },
          { role: "user",   content: quizSeed },
        ],
        max_tokens: 4000,
        reasoning_format: "hidden",
      } as any);

      const quiz = parseQuiz(quizRes.choices[0].message.content!);
      return NextResponse.json({ success: true, output: { ...content, quiz } });
    }

    // ── Text / file input ────────────────────────────────────
    let inputText = "";
    if (text && text.trim() !== "") {
      inputText = text;
    } else if (file) {
      if (file.type === "application/pdf") {
        const buffer = await file.arrayBuffer();
        const { text: extracted } = await extractText(new Uint8Array(buffer), { mergePages: true });
        inputText = extracted;
      } else {
        inputText = await file.text();
      }
    } else {
      return NextResponse.json({ success: false, error: "No input provided" }, { status: 400 });
    }

    // Step 1: content model reads full source, produces content + compact quiz_seed
    const contentRes = await groq.chat.completions.create({
      model: CONTENT_MODEL,
      messages: [
        { role: "system", content: CONTENT_PROMPT },
        { role: "user",   content: inputText },
      ],
      response_format: { type: "json_object" },
    });

    const content = JSON.parse(contentRes.choices[0].message.content!);
    const quizSeed: string = content.quiz_seed ?? "";
    delete content.quiz_seed;

    // Step 2: quiz model receives only the compact seed (~300 words), not the full source
    const quizRes = await groq.chat.completions.create({
      model: QUIZ_MODEL,
      messages: [
        { role: "system", content: QUIZ_PROMPT },
        { role: "user",   content: quizSeed },
      ],
      max_tokens: 4000,
      reasoning_format: "hidden",
    } as any);

    const quiz = parseQuiz(quizRes.choices[0].message.content!);
    return NextResponse.json({ success: true, output: { ...content, quiz } });

  } catch (error: any) {
    console.error("🔴 Error:", error);
    const isTooLong = error?.status === 413 || error?.message?.includes("413");
    return NextResponse.json(
      { success: false, error: isTooLong ? "Message too long" : "Failed to generate content" },
      { status: isTooLong ? 413 : 500 },
    );
  }
}