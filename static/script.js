document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("uploadForm");
    const lista = document.getElementById("lista-pdfs");
    const audioPlayer = document.getElementById("audioPlayer");

    function carregarPDFs() {
        fetch("/list_pdfs")
            .then(res => res.json())
            .then(arquivos => {
                lista.innerHTML = "";
                arquivos.forEach(filename => {
                    const div = document.createElement("div");
                    div.classList.add("card");
                    div.innerHTML = `
              <p><strong>${filename}</strong></p>
              <button onclick="verPDF('${filename}')">📄 Ver</button>
              <button onclick="tocarAudio('${filename}')">🔊 Ouvir</button>
              <button onclick="resumirPDF('${filename}')">🧠 Resumo</button>
              <div id="resumo-${filename}" class="resumo"></div>
            `;
                    lista.appendChild(div);
                });
            });
    }

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const data = new FormData(form);
        fetch("/upload_pdf", {
            method: "POST",
            body: data,
        })
            .then(res => res.json())
            .then(() => {
                carregarPDFs();
                form.reset();
            });
    });

    window.verPDF = (filename) => {
        window.open("/pdf/" + encodeURIComponent(filename), "_blank");
    };

    window.tocarAudio = (filename) => {
        fetch(`/audio_pdf?filename=${encodeURIComponent(filename)}`)
            .then(res => res.json())
            .then(data => {
                if (data.audio_url) {
                    audioPlayer.src = data.audio_url + `?t=${Date.now()}`;
                    audioPlayer.style.display = 'block';
                    audioPlayer.play();
                }
            });
    };

    window.resumirPDF = (filename) => {
        fetch(`/resumo_pdf?filename=${encodeURIComponent(filename)}`)
            .then(res => res.json())
            .then(data => {
                document.getElementById("resumo-" + filename).innerText = data.resumo;
            });
    };

    carregarPDFs();
});
