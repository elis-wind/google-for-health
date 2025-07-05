import fitz
import gradio as gr
import io
import pandas as pd
from PIL import Image


df = pd.read_csv('dispnea_chronique_and_aigue.csv')
text_to_page = {
    f'{df.iloc[i].Texte}': int(df.iloc[i].Page)
    for i in range(len(df)) 
}
examples = [df.iloc[i].Texte for i in range(len(df))]

def get_pdf_with_highlight(msg, history):
    try:
        i = int(msg)
        text = df.iloc[i].Texte
        num_page = int(df.iloc[i].Page)
    except:
        text = msg
        num_page = text_to_page.get(text)

    doc = fitz.open('ITEM-R2C_DYSPNEE_AIGUE_ET_CHRONIQUE.pdf')
    page = doc[num_page]

    # Search for the term and highlight
    highlights = page.search_for(text)
    for rect in highlights:
        page.add_highlight_annot(rect)

    # Render the page with highlight
    pix = page.get_pixmap(dpi=150)
    img = Image.open(io.BytesIO(pix.tobytes("png")))
    return text, img

title = 'Medical reasoning training'
with gr.Blocks(title=title, theme=gr.themes.Default(primary_hue="red", secondary_hue="pink", neutral_hue = "sky")) as demo:
    image_output = gr.Image(render=False)
    num_page = gr.State(0)

    gr.HTML("<center><h1>Medical Tutoring</h1><center>")
    with gr.Row():
        with gr.Column(scale=1):
            WELCOME_MESSAGE = '<b>AI Tutor</b>'
            chatbot = gr.Chatbot(placeholder=WELCOME_MESSAGE, type='messages')
            chatInterface = gr.ChatInterface(
                get_pdf_with_highlight,
                chatbot=chatbot,
                additional_outputs=image_output,
                examples=examples,
                type='messages',
            )
        with gr.Column(scale=1):
            image_output.render()

demo.launch()