import { useState, useRef, useEffect } from "react";
import type { FormEvent } from "react";
import { marked } from "marked";

// Initial session state for the agent - now empty by default
const initialState = {
  checklist: {},
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
  const [showSettings, setShowSettings] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful medical assistant.");
  const [initialMessage, setInitialMessage] = useState("Please help me start my medical case analysis.");
  const inputRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Don't fetch initial AI message automatically - wait for user to start
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
      // Use the simple chat endpoint for clean conversations
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          state: sessionState,
          system_prompt: systemPrompt
        }),
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

  const resetConversation = () => {
    setMessages([]);
    setSessionState(initialState);
    setInput("");
    // No automatic initial message - wait for user to start
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
      {/* Header with controls */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          background: "#23272f",
          borderBottom: "1px solid #444",
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: 600,
          margin: "0 auto",
        }}
      >
        <h1 style={{ color: "#fff", fontSize: 18, fontWeight: 600, margin: 0 }}>
          Medical Assistant
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid #444",
              background: showSettings ? "#444" : "transparent",
              color: "#fff",
              fontSize: 14,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            Settings
          </button>
          <button
            onClick={resetConversation}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid #444",
              background: "transparent",
              color: "#fff",
              fontSize: 14,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#444")}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div
          style={{
            position: "fixed",
            top: 60,
            left: 0,
            right: 0,
            zIndex: 15,
            background: "#2a2e37",
            borderBottom: "1px solid #444",
            padding: "16px",
            maxWidth: 600,
            margin: "0 auto",
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                color: "#fff",
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 8,
              }}
            >
              System Prompt:
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Enter your custom system prompt..."
              style={{
                width: "100%",
                minHeight: 80,
                padding: "12px",
                borderRadius: 6,
                border: "1px solid #444",
                background: "#23272f",
                color: "#fff",
                fontSize: 14,
                outline: "none",
                resize: "vertical",
                fontFamily: "system-ui, sans-serif",
              }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                display: "block",
                color: "#fff",
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 8,
              }}
            >
              Initial Message:
            </label>
            <input
              type="text"
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder="Enter the initial message to start the conversation..."
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 6,
                border: "1px solid #444",
                background: "#23272f",
                color: "#fff",
                fontSize: 14,
                outline: "none",
                fontFamily: "system-ui, sans-serif",
                marginBottom: 8,
              }}
            />
            <button
              onClick={() => {
                if (initialMessage.trim()) {
                  setInput(initialMessage);
                  setShowSettings(false);
                  inputRef.current?.focus();
                }
              }}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "1px solid #444",
                background: "#444",
                color: "#fff",
                fontSize: 14,
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              Use Initial Message
            </button>
          </div>
        </div>
      )}

      <div
        ref={chatRef}
        style={{
          width: "100%",
          maxWidth: 600,
          margin: "0 auto",
          padding: `${showSettings ? 320 : 108}px 0 0 0`,
          boxSizing: "border-box",
          position: "relative",
          height: `calc(100vh - ${INPUT_HEIGHT}px)`,
          overflowY: "auto",
        }}
      >
        {messages.length === 0 && (
          <div style={{ color: "#888", textAlign: "center", marginTop: 40 }}>
            Configure your settings above and send a message to start the conversation...
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
