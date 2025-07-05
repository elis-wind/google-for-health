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
            const res = await fetch("http://localhost:8000/chat/simple", {
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
            {/* Header with navigation only */}
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
                    Student Report
                </h1>
                <div style={{ display: "flex", gap: 8 }}>
                    <Link to="/" style={{
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
                        Go to Virtual Tutor
                    </Link>
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
                </div>
            </div>

            {/* Main content: two columns */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "flex-start",
                    marginTop: 80,
                    width: "100%",
                    maxWidth: 900,
                    marginLeft: "auto",
                    marginRight: "auto",
                    gap: 32,
                }}
            >
                {/* First column: text */}
                <div style={{
                    flex: 1,
                    color: "#fff",
                    fontSize: 18,
                    padding: 24,
                    background: "#23272f",
                    borderRadius: 12,
                    minHeight: 300,
                    boxShadow: "0 2px 8px #0002",
                    overflow: "auto"
                }}>
                    <h4>Final Session Report: Clinical Reasoning for Chronic Dyspnea</h4>
                    <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                        <h5>Summary of Student's Reasoning:</h5>
                        <p>
                            The student's reasoning progression was limited in this session. When prompted to summarize key findings expected in a patient with chronic dyspnea (Step 1: Interpretive summary). Subsequently, when asked to provide 3-5 possible differential diagnoses with reasoning (Step 2: Differential diagnosis), the student ultimately indicated "i dont know," suggesting an inability to formulate a differential at that stage.
                        </p>

                        <h5>Student's Strengths:</h5>
                        <p>
                            The student correctly identified the patient's chief complaint as "chronic dyspnea" and acknowledged the referral source. This demonstrates a fundamental ability to register the primary presenting problem and its context.
                        </p>

                        <h5>Student's Weaknesses:</h5>
                        <p>
                            Inability to Formulate Differential Diagnosis (Step 2): The student was unable to generate a list of possible diagnoses or articulate reasoning for them, even at a high level. This indicates a difficulty in connecting the presenting symptom (chronic dyspnea) to its broad etiological categories.
                        </p>

                        <h5>For Step 2: Differential Diagnosis for Chronic Dyspnea</h5>
                        <p>
                            Without specific patient data beyond "chronic dyspnea," a broad differential built from the major categories is expected. The factual database provides key etiological categories [30-37]:
                        </p>
                        <ul>
                            <li><strong>Chronic Lung Diseases:</strong> Obstructive: COPD (smoker, non-reversible obstruction), Asthma (young, atopic, reversible obstruction, variable symptoms) [30]. Restrictive: Ventilatory pump impairment (e.g., Chest wall hypoventilation like kyphoscoliosis, severe obesity; Neuromuscular diseases) or Diffuse Interstitial Lung Diseases (dry cough, crackles) [31].</li>
                            <li><strong>Chronic Heart Diseases:</strong> Heart Failure (ischemic, hypertrophic, valvulopathy, crackles), Constrictive Pericarditis, Arrhythmias [32].</li>
                            <li><strong>Pulmonary Hypertension:</strong> Pulmonary Arterial Hypertension (PAH), Post-embolic Pulmonary Hypertension [33, 34].</li>
                            <li><strong>Oxygen Transport Abnormalities:</strong> Chronic Anemia, Carbon Monoxide Poisoning [35].</li>
                            <li><strong>Psychogenic Chronic Dyspnea:</strong> (Diagnosis of exclusion, anxiety context) [36].</li>
                        </ul>
                        <p>
                            The student needs to develop the skill of systematically approaching a chief complaint by first fully characterizing it and then brainstorming differential diagnoses based on common etiologies found in the knowledge base, even in the absence of detailed patient information.
                        </p>
                    </div>
                </div>
                {/* Second column: image */}
                <div style={{
                    flex: 1,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-start",
                    minHeight: 300,
                    background: "#23272f",
                    borderRadius: 12,
                    boxShadow: "0 2px 8px #0002",
                    overflow: "auto"
                }}>
                    <img
                        src="http://localhost:8000/handouts/dyspnee-image"
                        alt="Dyspnea handout"
                        style={{
                            borderRadius: "12px",
                            background: "#222",
                            maxWidth: "100%",
                            height: "auto",
                            objectFit: "contain"
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default App;
