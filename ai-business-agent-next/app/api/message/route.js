import OpenAI from "openai";
import { businessProfile } from "../../../lib/business-profile";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4000;

export async function POST(request) {
  try {
    const body = await request.json();
    const message = body.message;
    const history = Array.isArray(body.history)
      ? body.history
        .filter(
          (item) =>
            item &&
            ["user", "assistant"].includes(item.role) &&
            typeof item.content === "string"
        )
        .slice(-10)
        .map((item) => ({
          role: item.role,
          content: item.content.slice(0, 2000),
        }))
      : [];



    // Validate the current message.
    if (
      typeof message !== "string" ||
      !message.trim() ||
      message.length > MAX_MESSAGE_LENGTH
    ) {
      return Response.json(
        {
          success: false,
          error: "Enter a message containing 1 to 4000 characters.",
        },
        { status: 400 }
      );
    }

    // Validate conversation history.
    if (!Array.isArray(history) || history.length > MAX_MESSAGES) {
      return Response.json(
        {
          success: false,
          error: "Invalid conversation history.",
        },
        { status: 400 }
      );
    }

    const validHistory = history.every(
      (item) =>
        item &&
        typeof item.content === "string" &&
        item.content.trim().length > 0 &&
        item.content.length <= MAX_MESSAGE_LENGTH &&
        ["user", "assistant"].includes(item.role)
    );

    if (!validHistory) {
      return Response.json(
        {
          success: false,
          error: "Conversation history contains invalid messages.",
        },
        { status: 400 }
      );
    }

    // Convert the previous messages into model input.
    const conversation = history.map((item) => ({
      role: item.role,
      content: item.content,
    }));

    // Add the latest message.
    conversation.push({
      role: "user",
      content: message.trim(),
    });

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",

      instructions: `
You are AgentFlow, a professional business assistant.

Use the following business profile as your source of
business information:

${JSON.stringify(businessProfile, null, 2)}

RULES:
- Answer questions using the provided business profile.
- Never invent services, prices, contact details, opening
  hours, delivery terms, or company policies.
- If a requested detail is missing or says "Not provided",
  explain that the information needs confirmation.
- Help customers politely and professionally.
- Never disclose passwords, API keys, private customer
  records, or confidential internal information.
- Never claim an action has been completed unless a
  connected system confirms it.
- If you are unsure, say so instead of guessing.
`,
      input: [
        ...history.map((item) => ({
          role: item.role,
          content: item.content,
        })),
      ],
      input: conversation,
    });

    return Response.json({
      success: true,
      reply: response.output_text,
    });
  } catch (error) {
    console.error("AI Agent Error:", error);

    return Response.json(
      {
        success: false,
        error: "The AI could not generate a reply. Check the server terminal.",
      },
      { status: 500 }
    );
  }
}