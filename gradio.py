import gradio as gr


def launch_gradio() -> None:

    title = 'Medical reasoning training'
    with gr.Blocks(title=title, theme=gr.themes.Default(primary_hue="red", secondary_hue="pink", neutral_hue = "sky")) as demo:
        gr.HTML("""
        <style>
        /* Limit width and center the app content */
        .gradio-container {
            max-width: 1440px;
            margin-left: auto;
            margin-right: auto;
        }
        </style>
        """)

        gr.HTML("<center><h1>Medical Tutoring</h1><center>")
        with gr.Row():
            with gr.Column(scale=1):
                WELCOME_MESSAGE = '<b>HalChat - Votre assistant chercheur.</b>'
                chatbot = gr.Chatbot(placeholder=WELCOME_MESSAGE, type='messages')
                chatInterface = gr.ChatInterface(
                    lambda x: x,
                    chatbot=chatbot,
                    type='messages',
                )

    demo.launch()
    