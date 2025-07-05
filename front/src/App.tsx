import React from "react";
import { useState, useRef, useEffect } from "react";
import type { FormEvent } from "react";
import { marked } from "marked";
import { Link } from "react-router-dom";

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

// Checklist data
const checklistData = {
  "examinerName": "Guest User",
  "examinerYear": "D1",
  "exportTime": "05/07/2025 16:45",
  "summary": {
    "date": "2025-07-05",
    "time": "16:42",
    "extern": "Guest User (D1)",
    "reasonForVisit": "",
    "clinicalFindings": {
      "respiratory": {
        "smokingStatus": "Active smoking",
        "dependenceLevel": "Strong dependence",
        "quitAttempts": "3%",
        "cannabisUse": false,
        "cough": "Greasy cough",
        "expectoration": {
          "abundant": true,
          "mucous": true
        },
        "chestPain": false,
        "hemoptysis": false,
        "dyspnea": {
          "MMRCStage": 3,
          "inspiratory": false,
          "stridor": false,
          "cornage": false,
          "wheezing": false,
          "expiratory": false,
          "orthopnea": false,
          "kussmaul": false,
          "cheyneStokes": false,
          "apnea": false
        },
        "thoracicExpansion": true
      }
    }
  }
};

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

    // Append the user message to the sessionState.history before sending
    const updatedState = {
      ...sessionState,
      history: [
        ...(sessionState.history || []),
        { role: "user", content: userMsg }
      ]
    };

    try {
      // Use the simple chat endpoint for clean conversations
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          state: updatedState,
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

  // Helper function to render JSON data in a readable format
  const renderJsonData = (data: any, level: number = 0): React.ReactNode => {
    if (typeof data === 'object' && data !== null) {
      return (
        <div style={{ marginLeft: level * 20 }}>
          {Object.entries(data).map(([key, value]) => (
            <div key={key} style={{ marginBottom: 8 }}>
              <span style={{
                color: '#4CAF50',
                fontWeight: 'bold',
                fontSize: 14 + Math.max(0, 2 - level) // Larger font for top-level keys
              }}>
                {key}:
              </span>
              {typeof value === 'object' && value !== null ? (
                renderJsonData(value, level + 1)
              ) : (
                <span style={{
                  color: typeof value === 'boolean' ? '#FF9800' : '#E3F2FD',
                  marginLeft: 8,
                  fontSize: 14
                }}>
                  {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                </span>
              )}
            </div>
          ))}
        </div>
      );
    }
    return <span>{String(data)}</span>;
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
          maxWidth: 1200, // Increased to accommodate two columns
          margin: "0 auto",
        }}
      >
        <h1 style={{ color: "#fff", fontSize: 18, fontWeight: 600, margin: 0 }}>
          Virtual Tutor
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
          <Link to="/virtual-patient" style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "1px solid #444",
            background: "transparent",
            color: "#fff",
            fontSize: 14,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            height: "36px"
          }}
            onMouseOver={e => (e.currentTarget.style.background = "#444")}
            onMouseOut={e => (e.currentTarget.style.background = "transparent")}
          >
            Go to Virtual Patient
          </Link>
          <Link to="/report" style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "1px solid #444",
            background: "transparent",
            color: "#fff",
            fontSize: 14,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            height: "36px"
          }}
            onMouseOver={e => (e.currentTarget.style.background = "#444")}
            onMouseOut={e => (e.currentTarget.style.background = "transparent")}
          >
            Go to Report
          </Link>
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
            maxWidth: 1200, // Increased to accommodate two columns
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

      {/* Main content: two columns */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "flex-start",
          marginTop: showSettings ? 320 : 108,
          width: "100%",
          maxWidth: 1200, // Increased to accommodate two columns
          marginLeft: "auto",
          marginRight: "auto",
          gap: 32,
          padding: "0 16px",
          boxSizing: "border-box",
        }}
      >
        {/* Left column: Checklist JSON */}
        <div style={{
          flex: 1,
          color: "#fff",
          padding: 24,
          background: "#23272f",
          borderRadius: 12,
          minHeight: 400,
          boxShadow: "0 2px 8px #0002",
          overflow: "auto",
          maxHeight: `calc(100vh - ${showSettings ? 320 : 108}px - ${INPUT_HEIGHT}px - 32px)`
        }}>
          <h4 style={{ marginTop: 0, marginBottom: 20, color: "#4CAF50" }}>
            Patient Checklist Data
          </h4>
          {renderJsonData(checklistData)}
        </div>

        {/* Right column: Chat interface */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: `calc(100vh - ${showSettings ? 320 : 108}px - ${INPUT_HEIGHT}px - 32px)`,
          minHeight: 400,
        }}>
          {/* Chat messages */}
          <div
            ref={chatRef}
            style={{
              flex: 1,
              background: "#23272f",
              borderRadius: 12,
              padding: 24,
              marginBottom: 16,
              boxShadow: "0 2px 8px #0002",
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

          {/* Input form */}
          <form
            onSubmit={sendMessage}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              background: "#23272f",
              padding: 16,
              borderRadius: 12,
              boxShadow: "0 2px 8px #0002",
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
      </div>
    </div>
  );
}

export default App;
