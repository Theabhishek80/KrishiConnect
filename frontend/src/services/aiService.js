import api from "../api";

/**
 * Krishi AI integration point.
 *
 * Replace the body of `sendMessage` (or point AI_ENDPOINT at your real route)
 * when the AI API is ready. Expected contract:
 *   request : { messages: [{ role: "user" | "assistant", content: string }] }
 *   response: { reply: string }
 * Nothing is simulated here: if the endpoint does not exist the UI shows
 * an honest "not connected yet" message.
 */
const AI_ENDPOINT = "/ai/chat";

export async function sendMessage(messages) {
  const response = await api.post(AI_ENDPOINT, {
    messages: messages.map(({ role, content }) => ({ role, content }))
  });
  const reply = response.data?.reply ?? response.data?.message;
  if (!reply) throw new Error("Empty AI response");
  return reply;
}
