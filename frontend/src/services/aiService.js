import api from "../api";

/*
 * ============================================================
 *  KISANDIRECT AI  —  PLUG YOUR API IN HERE
 * ============================================================
 *
 *  The chat page (components/AI/AIAssistant.jsx) calls ONLY this
 *  function, so connecting your real AI takes one edit.
 *
 *  Option A (default): your Spring Boot backend exposes
 *      POST /api/ai/chat   body: { messages: [{role, content}, ...] }
 *      response:           { reply: "text" }
 *
 *  Option B: point straight at another service by setting
 *      VITE_AI_API_URL=https://your-ai-service.example.com/chat
 *  in the frontend environment. Same request/response shape.
 *
 *  The reply text may be in `reply`, `message`, `answer` or `text`.
 */

export const AI_NOT_CONFIGURED = "AI_NOT_CONFIGURED";

const EXTERNAL_URL = import.meta.env.VITE_AI_API_URL;

function extractReply(data) {
  if (typeof data === "string") return data;
  return (
    data?.reply ||
    data?.message ||
    data?.answer ||
    data?.text ||
    ""
  );
}

export async function askKisanAI(messages) {
  try {
    const payload = {
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    };

    const response = EXTERNAL_URL
      ? await api.post(EXTERNAL_URL, payload, { baseURL: "" })
      : await api.post("/ai/chat", payload);

    const reply = extractReply(response.data);

    if (!reply) {
      throw new Error("The assistant returned an empty answer.");
    }

    return reply;

  } catch (error) {
    // 404 / 405 = the endpoint has not been added yet.
    const status = error?.response?.status;

    if (status === 404 || status === 405) {
      throw new Error(AI_NOT_CONFIGURED);
    }

    throw error;
  }
}
