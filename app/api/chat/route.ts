import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { messages, fileText } = await req.json();

    const systemPrompt = `You are Retainly AI, a smart and friendly study assistant. You help students understand topics, explain concepts clearly, answer questions, and make learning easier.

Guidelines:
- Be concise but thorough — avoid walls of text, keep it not too much paragraph not too short and not too long, use markdown formatting (headings, bullet points, bold) to make responses scannable
- When explaining concepts, use simple analogies and real-world examples
- If a file/document is provided as context, answer questions about it accurately
- Encourage curiosity and break down complex topics step by step
- You can help with: summarizing topics, explaining concepts, quizzing the user, making study plans, and answering subject-specific questions
- Never refuse to help with legitimate study topics
${fileText ? `\n\n--- DOCUMENT CONTEXT ---\nThe user has attached a document. Use this as context for the conversation:\n\n${fileText.slice(0, 12000)}\n--- END DOCUMENT ---` : ""}`;

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
      max_tokens: 1024,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate response" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}