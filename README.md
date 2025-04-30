# 📘 Leitor de PDFs com Áudio e Resumo com Inteligência Artificial

Este projeto é uma aplicação web desenvolvida em **Python (Flask)** com frontend em **HTML, CSS e JS**, que permite:

- 📂 Navegar por pastas contendo arquivos PDF
- 🔊 Ouvir o conteúdo dos PDFs lido por voz (via Google Text-to-Speech)
- 🧠 Gerar resumos automáticos com inteligência artificial (OpenAI GPT)
- 🎧 Visualizar o PDF com seus controles de mídia organizados em cards
- 📎 Interface amigável com seleção de diretório dinâmica

---

## 🚀 Funcionalidades

| Recurso | Descrição |
|--------|-----------|
| 📂 Seleção de diretório | Usuário informa o caminho local contendo os PDFs |
| 📄 Visualização em árvore | Estrutura de pastas com arquivos PDF visíveis |
| 🔊 Áudio por página | Geração de áudio (MP3) com leitura do conteúdo do PDF |
| 🧠 Resumo com IA | Resumo automático usando modelo GPT-3.5-Turbo da OpenAI |
| 🧹 Limpeza automática | Arquivos de áudio são limpos ao fechar a aplicação |
| 🎨 Interface em cards | PDF + botões de ação organizados para cada item |
| 📝 Rodapé | "Desenvolvido por Eduardo Lessa © 2025" sempre visível |

---

## 📦 Requisitos

- Python 3.10 ou superior
- Pip

Instale as dependências:

```bash
pip install -r requirements.txt
