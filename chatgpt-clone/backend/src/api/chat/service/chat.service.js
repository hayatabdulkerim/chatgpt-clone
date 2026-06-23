import db from "../../../../db/db.config.js";
import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash-lite";
const geminiClient = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// _____________________________________________________________

// get conversations / history
export const getRecentConversationRows = async (limit = 5) => {
  const normalizedLimit = Number.parseInt(limit, 10);

  const safeLimit =
    Number.isNaN(normalizedLimit) || normalizedLimit <= 0
      ? 20
      : normalizedLimit;

  const { rows } = await db.query(
    `SELECT id, role, content, created_at
     FROM conversations
     ORDER BY id DESC
     LIMIT ${safeLimit}`,
  );

  return rows.reverse();
};

// _____________________________________________________________

// Gemini AI response
const generateAssistantAnswer = async (historyRows, question) => {
  const formattedHistory = historyRows.map((row) => ({
    role: row.role === "assistant" ? "model" : "user",
    parts: [{ text: row.content }],
  }));

  const chat = geminiClient.chats.create({
    model: GEMINI_MODEL,
    config: {
      maxOutputTokens: 1024,
    },
    history: formattedHistory,
  });

  const result = await chat.sendMessage({
    message: question,
  });

  return {
    text: result.text,
    totalTokens: result.usageMetadata.totalTokenCount,
  };
};

// _____________________________________________________________

// get message by id
const getMessageById = async (messageId) => {
  const { rows } = await db.query(
    `SELECT id, role, content, token_count, created_at
     FROM conversations
     WHERE id = $1
     LIMIT 1`,
    [messageId],
  );

  if (!rows[0]) return null;

  return {
    id: rows[0].id,
    role: rows[0].role,
    content: rows[0].content,
    tokenCount: Number(rows[0].token_count || 0),
    createdAt: rows[0].created_at,
  };
};

// _____________________________________________________________

// main service
export async function createConversationService(question) {
  try {
    if (!question.trim()) {
      const error = new Error("Question is required");
      error.status = 400;
      throw error;
    }

    // history
    const historyRows = await getRecentConversationRows(5);

    // insert user message
    const userResult = await db.query(
      `INSERT INTO conversations (content, role)
       VALUES ($1, 'user')
       RETURNING id`,
      [question],
    );

    const userId = userResult.rows[0].id;

    // AI response
    const { text, totalTokens } = await generateAssistantAnswer(
      historyRows,
      question,
    );

    // insert assistant message
    const assistantResult = await db.query(
      `INSERT INTO conversations (role, content, token_count)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ["assistant", text, totalTokens],
    );

    const assistantId = assistantResult.rows[0].id;

    // fetch full records
    const userConversation = await getMessageById(userId);

    const assistantConversation = await getMessageById(assistantId);

    return {
      userConversation,
      assistantConversation,
    };
  } catch (error) {
    throw error;
  }
}
