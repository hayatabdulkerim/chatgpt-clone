import db from "../../../../db/db.config";
import { GoogleGenAI } from "@google/genai"; //This package is Google's SDK for interacting with Gemini AI models.


const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash-lite";
const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); //This line creates an instance (object) of the GoogleGenAI class and stores it in geminiClient.

//______________________________________________________________________________________________________________________

// get conversations / get chat history

export const getRecentConversationRows = async (limit = 5) => {  // has a default value of 5
  const normalizedLimit = Number.parseInt(limit, 10); // converts the input into a base 10 or a decimal
  const safeLimit =
    Number.isNaN(normalizedLimit) || normalizedLimit <= 0
      ? 20
      : normalizedLimit;
  const [rows] = await db.execute(   // an array of the last few chats
    `SELECT id, role, content, created_at
    FROM conversations
    ORDER BY id DESC  
    LIMIT ${safeLimit}`,
  );
  return rows.reverse();
};

//______________________________________________________________________________________________________________________

// get ai answer

const generateAssistantAnswer = async (historyRows, question) => {
  // Format history for Gemini startChat (it expects it this way)
  const formattedHistory = historyRows.map((row) => ({
    role: row.role === "assistant" ? "model" : "user",
    parts: [{ text: row.content }],
  }));

  //Creates a Gemini chat session.
  const chat = geminiClient.chats.create({   // after this chat contains a Gemini chat object.
    model: GEMINI_MODEL,
    config: {
      maxOutputTokens: 1024, //Limits response size.
    },
    history: formattedHistory,
    // systemInstrunstion: 'only answer in amharic'
  });

  const result = await chat.sendMessage({ message: question });  
  
  // result contains data like the response and the total token count
  // result = {
  //   text: "SQL is a database query language",
  //   usageMetadata: {
  //     totalTokenCount: 55,
  //   },
  // };

  return {
    text: result.text,    // the answer to the question
    totalTokens: result.usageMetadata.totalTokenCount,  // total count
  };
};

//______________________________________________________________________________________________________________________



// get the last user question or ai answer (for a frontend )

const getMessageById = async (messageId) => {
  const [rows] = await db.execute(
    "SELECT id, role, content, token_count, created_at FROM conversations WHERE id = ? LIMIT 1",
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


//______________________________________________________________________________________________________________________

// called in the controller which means this function runs first

export async function createConversationService(question) {
  try {
    // validation
    if (!question.trim()) {
      const error = new Error("Question is required");
      error.status = 400;
      throw error;
    }

    // get recent conversations
    const historyRows = await getRecentConversationRows(5);

    // insert new conversation (add the user question to the database)
    const [result] = await db.execute(
      'INSERT INTO conversations (content, role) VALUES (?, "user")',
      [question],
    );

    // get the answer and total token count from the ai
    const { text, totalTokens } = await generateAssistantAnswer(
      historyRows,
      question,
    );

    // insert new conversation (add the ai response to the database)
    const [createAssistantMessageResult] = await db.execute(
      "INSERT INTO conversations (role, content, token_count) VALUES (?, ?, ?)",
      ["assistant", text, totalTokens],
    );

    const userConversation = await getMessageById(result.insertId); // get the last user question
    const assistantConversation = await getMessageById(  // get the last ai answer
      createAssistantMessageResult.insertId, 
    );

    return {
      userConversation,
      assistantConversation,
    };
  } catch (error) {
    throw error;
  }
}
