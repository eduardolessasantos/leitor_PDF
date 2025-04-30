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
                    div.setAttribute("data-filename", filename);
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
        const iframeId = "iframe-" + filename;
        let existing = document.getElementById(iframeId);
        if (existing) {
            existing.remove(); // Alterna visibilidade
        } else {
            const iframe = document.createElement("iframe");
            iframe.id = iframeId;
            iframe.src = "/pdf/" + encodeURIComponent(filename);
            iframe.width = "100%";
            iframe.height = "500px";
            iframe.style.marginTop = "10px";
            document.querySelector(`.card[data-filename="${filename}"]`).appendChild(iframe);
        }
    };

    window.tocarAudio = (filename) => {
        const card = document.querySelector(`.card[data-filename="${filename}"]`);
        const loading = document.createElement("p");
        loading.innerText = "⏳ Carregando áudio...";
        loading.className = "loading-msg";
        card.appendChild(loading);

        fetch(`/audio_pdf?filename=${encodeURIComponent(filename)}`)
            .then(res => res.json())
            .then(data => {
                loading.remove();
                if (data.audio_url) {
                    audioPlayer.src = data.audio_url + `?t=${Date.now()}`;
                    audioPlayer.style.display = 'block';
                    audioPlayer.play();
                } else {
                    alert("Erro ao carregar áudio.");
                }
            })
            .catch(() => {
                loading.remove();
                alert("Erro ao carregar áudio.");
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
