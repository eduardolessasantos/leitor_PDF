import os
from flask import Flask, request, jsonify, send_from_directory, render_template
from flask_cors import CORS
from werkzeug.utils import secure_filename
import fitz
import openai
from gtts import gTTS

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

openai.api_key = os.getenv("OPENAI_API_KEY")

@app.route('/')
def index():
    return render_template('index.html')

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload_pdf', methods=['POST'])
def upload_pdf():
    if 'file' not in request.files:
        return jsonify({'error': 'Nenhum arquivo enviado'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Nome de arquivo inválido'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(save_path)
        return jsonify({'message': 'Arquivo enviado com sucesso'}), 200
    else:
        return jsonify({'error': 'Tipo de arquivo não permitido'}), 400

@app.route('/list_pdfs')
def list_pdfs():
    arquivos = [
        f for f in os.listdir(UPLOAD_FOLDER)
        if os.path.isfile(os.path.join(UPLOAD_FOLDER, f)) and f.lower().endswith('.pdf')
    ]
    return jsonify(arquivos)

@app.route('/pdf/<filename>')
def serve_pdf(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/audio_pdf')
def audio_pdf():
    filename = request.args.get('filename')
    if not filename:
        return jsonify({'error': 'Nome do arquivo não informado'}), 400

    full_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(full_path):
        return jsonify({'error': 'Arquivo não encontrado'}), 404

    try:
        texto = ""
        with fitz.open(full_path) as doc:
            for page in doc:
                texto += page.get_text()

        safe_filename = os.path.splitext(filename)[0] + ".mp3"
        audio_path = os.path.join('static', safe_filename)

        tts = gTTS(text=texto, lang='pt')
        tts.save(audio_path)
        return jsonify({'audio_url': f"/static/{safe_filename}"})
    except Exception as e:
        return jsonify({"error": f"Erro ao gerar áudio: {str(e)}"}), 500

@app.route('/resumo_pdf')
def resumo_pdf():
    filename = request.args.get('filename')
    if not filename:
        return jsonify({'resumo': 'Nome do arquivo não informado'}), 400

    full_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(full_path):
        return jsonify({'resumo': 'Arquivo não encontrado'}), 404

    try:
        texto = ""
        with fitz.open(full_path) as doc:
            for page in doc:
                texto += page.get_text()

        texto_cortado = texto[:2000]
        response = openai.ChatCompletion.create(
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

if __name__ == '__main__':
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
