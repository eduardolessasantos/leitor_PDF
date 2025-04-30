from gtts import gTTS
import fitz
#from transformers import pipeline
import tempfile
from flask import Flask, send_from_directory, jsonify, request, send_file
from flask_cors import CORS
import os
import json
import openai
import atexit
from urllib.parse import unquote

BASE_DIR_DYNAMIC = None

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
    global BASE_DIR_DYNAMIC
    if not BASE_DIR_DYNAMIC:
        return "Diretório base do áudio não definido.", 400

    decoded_filename = unquote(filename)
    file_path = os.path.join(BASE_DIR_DYNAMIC, decoded_filename)

    if not os.path.exists(file_path):
        return "Áudio não encontrado.", 404

    directory = os.path.dirname(file_path)
    filename_only = os.path.basename(file_path)

    return send_from_directory(app.static_folder, filename)

@app.route('/pdf/<path:filename>')
def get_pdf(filename):
    global BASE_DIR_DYNAMIC
    if not BASE_DIR_DYNAMIC:
        return "Diretório base não definido.", 400

    decoded_filename = unquote(filename)
    file_path = os.path.join(BASE_DIR_DYNAMIC, decoded_filename)

    if not os.path.exists(file_path):
        return "Arquivo não encontrado.", 404

    directory = os.path.dirname(file_path)
    filename_only = os.path.basename(file_path)

    return send_from_directory(directory, filename_only)

@app.route('/directory_structure')
def directory_structure():
    global BASE_DIR_DYNAMIC
    base_path = request.args.get('base', '').strip()
    path = request.args.get('path', '').strip()

    if not base_path:
        return jsonify([])

    BASE_DIR_DYNAMIC = base_path  # 🔥 Agora salvamos a pasta base dinamicamente!

    directory = os.path.join(base_path, path)

    if not os.path.exists(directory):
        return jsonify([])

    def get_structure(directory):
        structure = []
        for item in os.listdir(directory):
            full_path = os.path.join(directory, item)
            if os.path.isdir(full_path):
                children = get_structure(full_path)
                if children:
                    structure.append({
                        'name': item,
                        'type': 'folder',
                        'children': children
                    })
            elif os.path.isfile(full_path) and item.lower().endswith('.pdf'):
                structure.append({
                    'name': item,
                    'type': 'file',
                    'path': os.path.relpath(full_path, base_path).replace("\\", "/")
                })
        return structure

    return jsonify(get_structure(directory))



@app.route('/audio_pdf')
def audio_pdf():
    global BASE_DIR_DYNAMIC
    if not BASE_DIR_DYNAMIC:
        return jsonify({"error": "Diretório base não definido."}), 400

    path = request.args.get('path')
    if not path:
        return jsonify({"error": "Caminho do arquivo não informado."}), 400

    decoded_path = unquote(path)
    full_path = os.path.join(BASE_DIR_DYNAMIC, decoded_path)

    if not os.path.exists(full_path):
        return jsonify({"error": "Arquivo PDF não encontrado."}), 404

    try:
        import fitz
        texto = ""
        with fitz.open(full_path) as doc:
            for page in doc:
                texto += page.get_text()

        from gtts import gTTS
        # Cria subpasta "__audio" dentro da pasta base (organizado)
        audio_dir = os.path.join(BASE_DIR_DYNAMIC, "__audio")
        if not os.path.exists(audio_dir):
            os.makedirs(audio_dir)

        safe_filename = os.path.splitext(os.path.basename(path))[0] + ".mp3"
        audio_path = os.path.join(audio_dir, safe_filename)

        tts = gTTS(text=texto, lang='pt')
        tts.save(audio_path)

        return jsonify({'audio_url': f"/audio/__audio/{safe_filename}"})
    except Exception as e:
        print(f"[ERRO AO GERAR ÁUDIO] {str(e)}")
        return jsonify({"error": f"Erro ao gerar áudio: {str(e)}"}), 500

@app.route('/audio/__audio/<filename>')
def serve_audio(filename):
    global BASE_DIR_DYNAMIC
    if not BASE_DIR_DYNAMIC:
        return "Base directory not defined", 400

    audio_dir = os.path.join(BASE_DIR_DYNAMIC, "__audio")
    audio_path = os.path.join(audio_dir, filename)

    if not os.path.exists(audio_path):
        return "Áudio não encontrado", 404

    return send_from_directory(audio_dir, filename, mimetype='audio/mpeg')

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.route('/resumo_pdf')
def resumo_pdf():
    global BASE_DIR_DYNAMIC
    if not BASE_DIR_DYNAMIC:
        return jsonify({"resumo": "Diretório base não definido."}), 400

    path = request.args.get('path')
    if not path:
        return jsonify({"resumo": "Caminho do arquivo não informado."}), 400

    if not os.path.exists(app.static_folder):
        os.makedirs(app.static_folder)
    
    decoded_path = unquote(path)
    full_path = os.path.join(BASE_DIR_DYNAMIC, decoded_path)

    if not os.path.exists(full_path):
        return jsonify({"resumo": "Arquivo não encontrado."}), 404

    texto = ""
    import fitz
    with fitz.open(full_path) as doc:
        for page in doc:
            texto += page.get_text()

    texto_cortado = texto[:2000]  # Corte para evitar textos muito grandes

    try:

        client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Você é um assistente que resume textos de forma clara e objetiva."},
                {"role": "user", "content": f"Resuma o seguinte conteúdo do PDF:\n\n{texto_cortado}"}
            ],
            max_tokens=300,
            temperature=0.5
        )
        resumo = response.choices[0].message.content.strip()
        return jsonify({'resumo': resumo})
    except Exception as e:
        return jsonify({'resumo': f"Erro ao gerar resumo: {str(e)}"})


def limpar_audios():
    static_folder = app.static_folder
    if not os.path.exists(static_folder):
        return
    
    for filename in os.listdir(static_folder):
        if filename.endswith('.mp3'):
            try:
                os.remove(os.path.join(static_folder, filename))
                print(f"Removido arquivo: {filename}")
            except Exception as e:
                print(f"Erro ao remover {filename}: {e}")

# Registra a função para ser chamada ao encerrar
atexit.register(limpar_audios)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
    #app.run(port=5000)
