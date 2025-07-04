import React, { useState, useRef, useEffect } from "react";
import type { FormEvent } from "react";
import { marked } from "marked";

// Initial session state for the agent
const initialState = {
  checklist: {
    symptoms: ["fever", "cough"],
    vitals: { temp: 38.5 },
  },
  phase: "summary",
  history: [],
  report: "",
  virtual_patient: "",
};

type Message = {
  role: "user" | "ai";
  content: string;
};

const INPUT_HEIGHT = 90;

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionState, setSessionState] = useState<any>(initialState);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Fetch initial AI message on mount
  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:8000/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "", state: initialState }),
        });
        const data = await res.json();
        setMessages([{ role: "ai", content: data.ai_message }]);
        setSessionState(data.state);
      } catch {
        setMessages([{ role: "ai", content: "Error: Could not reach backend." }]);
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom on new message
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((msgs) => [...msgs, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, state: sessionState }),
      });
      const data = await res.json();
      setMessages((msgs) => [...msgs, { role: "ai", content: data.ai_message }]);
      setSessionState(data.state);
    } catch (err) {
      setMessages((msgs) => [...msgs, { role: "ai", content: "Error: Could not reach backend." }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "#23272f",
        fontFamily: "system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        ref={chatRef}
        style={{
          width: "100%",
          maxWidth: 600,
          margin: "0 auto",
          padding: "48px 0 0 0",
          boxSizing: "border-box",
          position: "relative",
          height: `calc(100vh - ${INPUT_HEIGHT}px)`,
          overflowY: "auto",
        }}
      >
        {messages.length === 0 && (
          <div style={{ color: "#888", textAlign: "center", marginTop: 40 }}>
            Loading conversation...
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              margin: "14px 0",
              textAlign: msg.role === "user" ? "right" : "left",
              width: "100%",
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {msg.role === "ai" ? (
              <span
                style={{
                  fontSize: 15,
                  color: "#fff",
                  fontWeight: 400,
                  fontStyle: "italic",
                  background: "none",
                  padding: 0,
                  borderRadius: 0,
                  maxWidth: "80%",
                  wordBreak: "break-word",
                  lineHeight: 1.5,
                }}
                dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }}
              />
            ) : (
              <span
                style={{
                  fontSize: 15,
                  color: "#fff",
                  fontWeight: 500,
                  background: "none",
                  padding: 0,
                  borderRadius: 0,
                  maxWidth: "80%",
                  wordBreak: "break-word",
                  lineHeight: 1.5,
                }}
              >
                {msg.content}
              </span>
            )}
          </div>
        ))}
      </div>
      <form
        onSubmit={sendMessage}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
          width: "100%",
          maxWidth: 600,
          margin: "0 auto",
          display: "flex",
          gap: 12,
          alignItems: "center",
          background: "#23272f",
          padding: "0 16px 32px 16px",
          borderTop: "2px solid #23272f",
        }}
      >
        <div
          style={{
            background: "#23272f",
            borderRadius: 8,
            flex: 1,
            display: "flex",
            alignItems: "center",
            border: "1px solid #444",
            padding: "0 0 0 0",
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={loading ? "Waiting for AI..." : "Type your message..."}
            disabled={loading}
            style={{
              flex: 1,
              padding: "14px 18px",
              borderRadius: 8,
              border: "none",
              background: "#23272f",
              color: "#fff",
              fontSize: 15,
              outline: "none",
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: "14px 28px",
            borderRadius: 8,
            border: "none",
            background: loading || !input.trim() ? "#444" : "#fff",
            color: loading || !input.trim() ? "#aaa" : "#23272f",
            fontWeight: 600,
            fontSize: 15,
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            transition: "background 0.2s, color 0.2s",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default App;
