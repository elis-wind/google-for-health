import os
import json
from cmath import phase
from dotenv import load_dotenv
from typing import Callable, Optional
from typing_extensions import TypedDict, Literal, Annotated
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_core.messages import HumanMessage, AIMessage

from gemini import call_gemini
from medgemma import call_medgemma

load_dotenv()

class SessionState(TypedDict):
    checklist: dict
    phase: Literal["summary", "diff", "lead", "alts", "errors", "plan", "final_feedback", "outputs"]
    history: Annotated[list, add_messages]
    report: str
    virtual_patient: str

PHASE_PROMPTS = {
    "summary": """
    You are a clinical tutor.\nGiven the checklist, ask the student to summarize the findings. Do not provide summary by yourself\n
    Checklist: {checklist}
    """,

    "diff": """
    You are guiding differential diagnosis. Ask student to provide you with 3-5 possible diagnosis 
    and the reasoning behind them. Do not give the examples, do not provide diagnosis by yourself, do not provide student's response.
    Student reasoning so far: {last}
    """,

    "lead": """
    Help student with diagnosis selection. Ask student for the lead and what supports or contradicts it. Do not provide answers.
    Student reasoning so far: {last}
    """,

    "alts": """
    Help student with alternative diagnosis. Ask what that diagnosis may be, and for the reasoning to rule in/out each option.  Do not provide answers.
    Student reasoning so far: {last}
    """,

    "errors": """
    Help student to reflect on biases/errors. Ask him about possible biases, missing evidence. Do not provide answers.
    Student reasoning so far: {last}
    """,

    "plan": """
    Help student with management plan. Ask student about potential tests, treatments, follow-ups and their justification.  Do not provide answers.
    Student reasoning so far: {last}
    """,

    "final_feedback": """
    Reflect briefly on the session and student's answers (no more than 2-3 sentences). Then thank them and tell them a report and virtual patient will be created next. Give a brief overall feedback as a tutor .
    Student reasoning so far: {last}
    """
}

def make_phase_node(phase_name: str) -> Callable[[SessionState], SessionState]:
    """
    Returns a node function for the given phase that prompts the AI tutor and optionally collects student input.
    Handles student-tutor interaction and updates the session state with messages.
    """
    def node(state: SessionState) -> SessionState:
        last = state["history"][-1].content if state["history"] else ""
        prompt = PHASE_PROMPTS[phase_name].format(
            checklist=json.dumps(state["checklist"], indent=2),
            last=last
        )
        # Call Gemini
        tutor_msg = call_gemini(prompt=prompt, max_tokens=2048, temperature=0)
        # Call MedGemma
        # tutor_msg = call_medgemma(prompt=prompt, max_tokens=2048, temperature=0)
        print(f"\n🤖 AI tutor ({phase_name}): {tutor_msg}\n")

        # Skip student input for the final feedback phase
        if phase_name == "final_feedback":
            return {
                "history": state["history"] + [
                    HumanMessage(content=prompt),
                    AIMessage(content=tutor_msg)
                ],
                "phase": phase_name
            }

        student_msg = input("👨‍🎓 Student: ")

        return {
            "history": state["history"] + [
                HumanMessage(content=prompt),
                AIMessage(content=tutor_msg),
                HumanMessage(content=student_msg)
            ],
            "phase": phase_name
        }
    return node

builder = StateGraph(SessionState)

for phase in ["summary", "diff", "lead", "alts", "errors", "plan", "final_feedback", "outputs"]:
    builder.add_node(phase, make_phase_node(phase))

def generate_report(state: SessionState) -> dict:
    """
    Generates a final report summarizing the session using the interaction history.
    """
    prompt = "Generate a final session report in plain text. Include the initial checklist and a summary of the student’s reasoning. Clearly highlight the student’s strengths and weaknesses in clinical thinking. Avoid repetition and keep the tone professional and constructive"
    msg = json.dumps([m.content for m in state["history"]], indent=2) + prompt
    # Call Gemini
    # response = call_gemini(prompt=msg)
    # Call MedGemma
    response = call_medgemma(prompt=msg)
    return {
        "report": response
    }

def generate_virtual_patient_persona(state: SessionState) -> dict:
    """
    Generates a virtual patient case based on the student's weaknesses using the conversation history.
    """
    prompt = "Generate a virtual patient persona in JSON format to help the student practice and improve their medical reasoning. Base the persona on the student's initial checklist, errors identified in the report, and the conversation history. Include only patient-relevant information that allows the student to ask diagnostic and clinical questions. Do not include any diagnoses, learning plans, or tutor comments"
    msg = json.dumps([m.content for m in state["history"]], indent=2) + prompt
    # Call Gemini
    # response = call_gemini(prompt=msg)
    # Call MedGemma
    response = call_medgemma(prompt=msg)
    return {
        "virtual_patient": response
    }

def generate_and_store_report_and_patient(state):
    report = generate_report(state)["report"]
    virtual_patient = generate_virtual_patient_persona(state)["virtual_patient"]

    os.makedirs("data/reports", exist_ok=True)
    with open("data/reports/report_reel.txt", "w") as f:
        f.write(report)

    os.makedirs("data/checklists", exist_ok=True)
    with open("data/checklists/checklist_virtuel.txt", "w") as f:
        f.write(virtual_patient)

builder.add_node("report", generate_report)
builder.add_node("virtual_patient", generate_virtual_patient_persona)

builder.add_edge(START, "summary")
builder.add_edge("summary", "diff")
builder.add_edge("diff", "lead")
builder.add_edge("lead", "alts")
builder.add_edge("alts", "errors")
builder.add_edge("errors", "plan")
builder.add_edge("plan", "final_feedback")
builder.add_edge("final_feedback", "report")
builder.add_edge("report", "virtual_patient")
builder.add_edge("virtual_patient", END)

app = builder.compile()

def _ensure_message_objects(history):
    new_history = []
    for msg in history:
        if isinstance(msg, dict):
            # Try to infer type
            if msg.get("type") == "human" or msg.get("role") == "user":
                new_history.append(HumanMessage(content=msg["content"]))
            elif msg.get("type") == "ai" or msg.get("role") == "ai":
                new_history.append(AIMessage(content=msg["content"]))
            else:
                # Fallback: treat as human
                new_history.append(HumanMessage(content=msg.get("content", "")))
        else:
            new_history.append(msg)
    return new_history

def step_agent(state: SessionState, user_message: Optional[str] = None, system_prompt: Optional[str] = None) -> dict:
    """
    Advances the agent by one phase using the provided user message.
    Returns the updated state and the AI's next message.
    """
    # Ensure history is a list of message objects
    state["history"] = _ensure_message_objects(state.get("history", []))
    # Allowed phases
    phase_order = ["summary", "diff", "lead", "alts", "errors", "plan", "final_feedback", "outputs"]
    # Determine current phase
    phase = state["phase"]
    # Prepare prompt for the current phase
    last = state["history"][-1].content if state["history"] else ""
    prompt = PHASE_PROMPTS[phase].format(
        checklist=json.dumps(state["checklist"], indent=2),
        last=last
    )
    # Call Gemini
    tutor_msg = call_gemini(prompt=prompt, max_tokens=2048, temperature=0, system_prompt=system_prompt)
    # Update history with tutor message
    state["history"].append(HumanMessage(content=prompt))
    state["history"].append(AIMessage(content=tutor_msg))
    # If not final_feedback, add user message if provided
    if phase != "final_feedback" and user_message is not None:
        state["history"].append(HumanMessage(content=user_message))
    # Advance phase
    next_phase_idx = phase_order.index(phase) + 1 if phase in phase_order else len(phase_order) - 1
    next_phase = phase_order[next_phase_idx] if next_phase_idx < len(phase_order) else phase_order[-1]
    state["phase"] = next_phase  # Always a valid literal
    # Ensure all required fields are present
    if "checklist" not in state:
        state["checklist"] = {}
    if "report" not in state:
        state["report"] = ""
    if "virtual_patient" not in state:
        state["virtual_patient"] = ""

    return {"state": state, "ai_message": tutor_msg}

if __name__ == "__main__":
    init_state: SessionState = {
        "checklist": {
            "symptoms": ["fever", "cough"],
            "vitals": {
                "temp": 38.5
            }
        },
        "phase": "summary",
        "history": [],
        "report": "",
        "virtual_patient": ""
    }
    print("Checklist:\n", json.dumps(init_state["checklist"], indent=2))
    result = app.invoke(init_state)
    print("\nReport:\n", result["report"])
    print("\nVirtual patient:\n", result["virtual_patient"])
