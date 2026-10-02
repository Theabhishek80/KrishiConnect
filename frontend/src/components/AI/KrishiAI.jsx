import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUp, ChevronLeft, Sparkles } from "lucide-react";
import { sendMessage } from "../../services/aiService";

const SUGGESTIONS = [
  "Which crops suit the kharif season?",
  "How do I store tomatoes for longer?",
  "Explain how to price my produce fairly"
];

export default function KrishiAI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const submit = async text => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const reply = await sendMessage(next);
      setMessages(m => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages(m => [
        ...m,
        {
          role: "assistant",
          error: true,
          content:
            "Krishi AI isn't connected yet, so I can't answer this right now. Please try again later."
        }
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const onKeyDown = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <section className="kd-ai-shell">
      <header className="kd-ai-header">
        <Link to="/" className="kd-ai-back" aria-label="Back to home">
          <ChevronLeft size={20} />
        </Link>
        <span className="kd-ai-logo" aria-hidden="true"><Sparkles size={18} /></span>
        <div>
          <h1>Krishi AI</h1>
          <p>Your farming and marketplace assistant</p>
        </div>
      </header>

      <div className="kd-ai-messages" aria-live="polite">
        {!messages.length && !loading && (
          <div className="kd-ai-empty">
            <span className="kd-ai-logo big" aria-hidden="true"><Sparkles size={26} /></span>
            <h2>Namaste! How can I help today?</h2>
            <p>Ask about crops, storage, pricing or how to use KisanDirect.</p>
            <div className="kd-ai-suggestions">
              {SUGGESTIONS.map(s => (
                <button key={s} type="button" onClick={() => submit(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`kd-ai-msg ${m.role}${m.error ? " error" : ""}`}>
            {m.content}
          </div>
        ))}

        {loading && (
          <div className="kd-ai-msg assistant" aria-label="Krishi AI is typing">
            <span className="kd-ai-typing"><i /><i /><i /></span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form className="kd-ai-composer" onSubmit={e => { e.preventDefault(); submit(); }}>
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask Krishi AI…"
          aria-label="Message Krishi AI"
          maxLength={2000}
        />
        <button type="submit" disabled={!input.trim() || loading} aria-label="Send message">
          <ArrowUp size={20} />
        </button>
      </form>
    </section>
  );
}
