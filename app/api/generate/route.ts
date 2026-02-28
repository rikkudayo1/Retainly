import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { extractText } from "unpdf";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const TEXT_MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are a study assistant. When given a text or image, return ONLY a valid JSON object with no markdown, no backticks, no explanation. 
          
For the summary field, write in markdown format with:
- A # heading for the main topic
- ## subheadings for each major section  
- **bold** for key terms
- Bullet points for lists
- Short scannable paragraphs
Also, reply in the same language that is given to you in the text or image

Use exactly this structure:
{
  "summary": "Keep paragraphs not too short, understandable, covered all the topics and scannable.",
  "key_concepts": [
    { "term": "...", "definition": "..." }
  ],
  "quiz": [
    {
      "question": "...",
      "choices": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "answer": "A",
      "explanation": "Brief explanation of why this is the correct answer"
    }
  ],
  "flashcards": [
    {
      "keyword": "...",
      "hint": "A short one-sentence clue without giving away the answer",
      "explanation": "Full detailed explanation of the keyword"
    }
  ]
}
Generate at least 5 key concepts, 10 quiz questions, and 5+ flashcards. Flashcard count depends on how much data is given.`;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const text = formData.get("text") as string | null;
    const file = formData.get("file") as File | null;
    const imageBase64 = formData.get("imageBase64") as string | null;
    const imageMimeType = formData.get("imageMimeType") as string | null;

    // ── Image input ──────────────────────────────────────────
    if (imageBase64 && imageMimeType) {
      const completion = await groq.chat.completions.create({
        model: VISION_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${imageMimeType};base64,${imageBase64}`,
                },
              },
              {
                type: "text",
                text: "Analyze this image and generate study materials from it.",
              },
            ],
          },
        ] as any,
        response_format: { type: "json_object" },
      });

      const raw = completion.choices[0].message.content!;
      const result = JSON.parse(raw);
      return NextResponse.json({ success: true, output: result });
    }

    // ── Text / file input ────────────────────────────────────
    let inputText = "";

    if (text && text.trim() !== "") {
      inputText = text;
    } else if (file) {
      if (file.type === "application/pdf") {
        const buffer = await file.arrayBuffer();
        const { text: extracted } = await extractText(new Uint8Array(buffer), {
          mergePages: true,
        });
        inputText = extracted;
      } else {
        inputText = await file.text();
      }
    } else {
      return NextResponse.json(
        { success: false, error: "No text, file, or image provided" },
        { status: 400 },
      );
    }

    const completion = await groq.chat.completions.create({
      model: TEXT_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: inputText },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content!;
    const result = JSON.parse(raw);

    return NextResponse.json({ success: true, output: result });
  } catch (error: any) {
    console.error("🔴 Groq Error:", error);
    const isTooLong = error?.status === 413 || error?.message?.includes("413");
    return NextResponse.json(
      {
        success: false,
        error: isTooLong ? "Message too long" : "Failed to generate content",
      },
      { status: isTooLong ? 413 : 500 },
    );
  }
}