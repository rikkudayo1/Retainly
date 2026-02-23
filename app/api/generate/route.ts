import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { extractText } from "unpdf";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const text = formData.get("text") as string | null;
    const file = formData.get("file") as File | null;

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
        { success: false, error: "No text or file provided" },
        { status: 400 },
      );
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a study assistant. When given a text, return ONLY a valid JSON object with no markdown, no backticks, no explanation. Use exactly this structure:
{
  "summary": "2-3 sentence summary of the text",
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
Generate at least 5 key concepts, 10 quiz questions, and 5+ flashcards, flashcards size depends on how much the data are given.`,
        },
        {
          role: "user",
          content: inputText,
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content!;
    const result = JSON.parse(raw);

    return NextResponse.json({
      success: true,
      output: result,
    });
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
