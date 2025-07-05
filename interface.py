import fitz
import gradio as gr
import io
from PIL import Image


def get_pdf_with_highlight(msg, history):
    doc = fitz.open('ITEM-R2C_DYSPNEE_AIGUE_ET_CHRONIQUE.pdf')
    page = doc[0]

    # Search for the term and highlight
    highlights = page.search_for(msg)
    for rect in highlights:
        page.add_highlight_annot(rect)

    # Render the page with highlight
    pix = page.get_pixmap(dpi=150)
    img = Image.open(io.BytesIO(pix.tobytes("png")))
    return msg, img


title = 'Medical reasoning training'
with gr.Blocks(title=title, theme=gr.themes.Default(primary_hue="red", secondary_hue="pink", neutral_hue = "sky")) as demo:
    image_output = gr.Image(render=False)

    gr.HTML("<center><h1>Medical Tutoring</h1><center>")
    with gr.Row():
        with gr.Column(scale=1):
            WELCOME_MESSAGE = '<b>AI Tutor</b>'
            chatbot = gr.Chatbot(placeholder=WELCOME_MESSAGE, type='messages')
            chatInterface = gr.ChatInterface(
                get_pdf_with_highlight,
                chatbot=chatbot,
                additional_outputs=image_output,
                type='messages',
            )
        with gr.Column(scale=1):
            image_output.render()

demo.launch()