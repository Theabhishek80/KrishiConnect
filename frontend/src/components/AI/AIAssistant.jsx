import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUp,
  Bug,
  CloudSun,
  Landmark,
  Leaf,
  Sparkles,
  Sprout,
  TrendingUp
} from "lucide-react";

import {
  askKisanAI,
  AI_NOT_CONFIGURED,
  AI_SIGN_IN
} from "../../services/aiService";
import { getStoredUser } from "../../utils/auth";

const SUGGESTIONS = [
  { icon: Sprout, text: "Which crop should I grow this season?" },
  { icon: Bug, text: "How do I control pests in tomato naturally?" },
  { icon: TrendingUp, text: "How can I get a better price for my produce?" },
  { icon: CloudSun, text: "Best sowing time for wheat in Madhya Pradesh?" },
  { icon: Leaf, text: "Simple tips for organic farming" },
  { icon: Landmark, text: "Government schemes available for farmers" }
];

const NOT_CONNECTED_MESSAGE =
  "KisanDirect AI is almost ready. The assistant isn't connected to its " +
  "service yet, so I can't answer right now. Please check back soon!";

export default function AIAssistant() {
  const user = getStoredUser();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  // Auto-grow the textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [input]);

  const send = async text => {
    const content = (text ?? input).trim();
    if (!content || busy) return;

    const next = [...messages, { role: "user", content }];

    setMessages(next);
    setInput("");
    setBusy(true);

    try {
      const reply = await askKisanAI(next);
      setMessages([...next, { role: "assistant", content: reply }]);

    } catch (error) {
      const notReady = error?.message === AI_NOT_CONFIGURED;
      const signedOut = error?.message === AI_SIGN_IN;

      setMessages([
        ...next,
        {
          role: "assistant",
          error: true,
          content: notReady
            ? NOT_CONNECTED_MESSAGE
            : signedOut
              ? "Your session has expired. Please sign in again to keep chatting."
              : error?.userMessage ||
                "Sorry, I couldn't get an answer just now. Please try again."
        }
      ]);

    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  const empty = messages.length === 0;

  return (
    <section className="kd-ai-page">

      <div className="kd-ai-shell">

        <header className="kd-ai-head">
          <span className="kd-ai-orb" aria-hidden="true">
            <Sparkles size={22} />
          </span>

          <div>
            <h1>
              KisanDirect AI
              <span className="kd-ai-beta">Beta</span>
            </h1>
            <p>Your friendly agriculture assistant</p>
          </div>
        </header>

        <div className="kd-ai-thread" aria-live="polite">

          {empty && (
            <div className="kd-ai-welcome">
              <h2>
                {user?.name
                  ? `Hello, ${user.name.split(" ")[0]} 👋`
                  : "Hello 👋"}
              </h2>
              <p>
                Ask me about crops, pests, soil, irrigation, storage or
                government schemes.
              </p>

              <div className="kd-ai-suggestions">
                {SUGGESTIONS.map(({ icon: Icon, text }) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => send(text)}
                    disabled={!user}
                  >
                    <Icon size={18} />
                    <span>{text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, i) => (
            <div
              key={i}
              className={`kd-msg ${message.role}${message.error ? " error" : ""}`}
            >
              {message.role === "assistant" && (
                <span className="kd-msg-avatar" aria-hidden="true">
                  <Sparkles size={15} />
                </span>
              )}

              <div className="kd-msg-bubble">{message.content}</div>
            </div>
          ))}

          {busy && (
            <div className="kd-msg assistant">
              <span className="kd-msg-avatar" aria-hidden="true">
                <Sparkles size={15} />
              </span>

              <div className="kd-msg-bubble kd-typing" aria-label="Thinking">
                <i /><i /><i />
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {user ? (
          <div className="kd-ai-composer">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={event => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask anything about farming…"
              aria-label="Message KisanDirect AI"
            />

            <button
              type="button"
              onClick={() => send()}
              disabled={busy || !input.trim()}
              aria-label="Send message"
            >
              <ArrowUp size={20} />
            </button>
          </div>
        ) : (
          <div className="kd-ai-signin">
            <p>Please sign in to chat with KisanDirect AI.</p>
            <Link className="primary-btn" to="/login">Sign in</Link>
          </div>
        )}

        <p className="kd-ai-note">
          AI can make mistakes. Please verify important farming, health or
          financial decisions with an expert.
        </p>

      </div>

    </section>
  );
}
