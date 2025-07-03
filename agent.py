import json
from cmath import phase
from dotenv import load_dotenv
from typing import Callable
from typing_extensions import TypedDict, Literal, Annotated
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_core.messages import HumanMessage, AIMessage

from gemini import call_gemini

load_dotenv()

class SessionState(TypedDict):
    checklist: dict
    phase: Literal["summary", "diff", "lead", "alts", "errors", "plan", "final_feedback", "outputs"]
    history: Annotated[list, add_messages]
    report: str
    virtual_patient: str

PHASE_PROMPTS = {
    "summary": """
    You are a clinical tutor.\nGiven the checklist, ask the student to summarize the findings.\n
    Checklist: {checklist}
    """,

    "diff": """
    You are guiding differential diagnosis. Ask student to provide you with 3-5 possible diagnosis 
    and the reasoning behind them.
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
        tutor_msg = call_gemini(prompt=prompt)
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
    prompt = "Generate a final session report including the initial checklist and the summary of student's reasoning, with strengths and weaknesses"
    msg = json.dumps([m.content for m in state["history"]], indent=2) + prompt
    response = call_gemini(prompt=msg)
    return {
        "report": response
    }

def generate_virtual_patient_persona(state: SessionState) -> dict:
    """
    Generates a virtual patient case based on the student's weaknesses using the conversation history.
    """
    prompt = "Generate a virtual patient persona similar to the student's checklist. This persona should target student's weaknesses in medical reasoning"
    msg = json.dumps([m.content for m in state["history"]], indent=2) + prompt
    response = call_gemini(prompt=msg)
    return {
        "virtual_patient": response
    }

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
    print(f"\nReport:\n", result["report"])
    print(f"\nVirtual patient:\n", result["virtual_patient"])
