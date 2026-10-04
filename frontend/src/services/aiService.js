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
export const AI_SIGN_IN = "AI_SIGN_IN";

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
      // Do not send our own error bubbles back to the model.
      messages: messages
        .filter(m => !m.error)
        .map(m => ({
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
    const status = error?.response?.status;
    const code = error?.response?.data?.code;

    // Backend has no key yet / key rejected, or the endpoint is missing.
    if (code === "AI_NOT_CONFIGURED" || status === 404 || status === 405) {
      throw new Error(AI_NOT_CONFIGURED);
    }

    if (status === 401) {
      throw new Error(AI_SIGN_IN);
    }

    // Friendly message written by the backend (rate limit, busy, ...).
    const serverMessage = error?.response?.data?.error;

    if (serverMessage) {
      const friendly = new Error(serverMessage);
      friendly.userMessage = serverMessage;
      throw friendly;
    }

    throw error;
  }
}
