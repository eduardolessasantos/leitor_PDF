from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
import os
import json
from gtts import gTTS
from flask import send_file
import fitz  # PyMuPDF
from transformers import pipeline
import tempfile

app = Flask(__name__, static_folder='static')
CORS(app)

# Altere aqui se o caminho for diferente
#BASE_DIR = r"C:\\Users\\Eduardo\\Documents\\Concurso_Niteroi\\Analista_Informatica_ION_RJ_2025\\01-Apostilas"
BASE_DIR = os.path.join(os.path.dirname(__file__), 'pdfs')

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory(app.static_folder, filename)

@app.route('/pdf/<path:filename>')
def get_pdf(filename):
    return send_from_directory(BASE_DIR, filename)

@app.route('/directory_structure')
def directory_structure():
    path = request.args.get('path', '')
    directory = os.path.join(BASE_DIR, path)

    def get_structure(directory):
        structure = []
        for item in os.listdir(directory):
            full_path = os.path.join(directory, item)
            if os.path.isdir(full_path) and item not in ['img', 'static']:
                structure.append({
                    'name': item,
                    'type': 'folder',
                    'children': get_structure(full_path)
                })
            elif os.path.isfile(full_path) and item.lower().endswith('.pdf'):
                structure.append({
                    'name': item,
                    'type': 'file',
                    'path': os.path.relpath(full_path, BASE_DIR).replace("\\", "/")
                })
        return structure

    return jsonify(get_structure(directory))

@app.route('/audio_pdf')
def audio_pdf():
    path = request.args.get('path')
    full_path = os.path.join(BASE_DIR, path)

    texto = ""
    with fitz.open(full_path) as doc:
        for page in doc:
            texto += page.get_text()

    tts = gTTS(text=texto, lang='pt')
    temp_audio = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
    tts.save(temp_audio.name)
    return send_file(temp_audio.name, mimetype="audio/mpeg")

@app.route('/resumo_pdf')
def resumo_pdf():
    path = request.args.get('path')
    full_path = os.path.join(BASE_DIR, path)

    texto = ""
    with fitz.open(full_path) as doc:
        for page in doc:
            texto += page.get_text()

    # Limitar texto por segurança
    texto_cortado = texto[:1000]

    resumidor = pipeline("summarization", model="facebook/bart-large-cnn")
    resumo = resumidor(texto_cortado)[0]['summary_text']

    return jsonify({'resumo': resumo})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
