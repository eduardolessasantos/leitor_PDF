const treeContainer = document.getElementById('tree');
const pdfViewer = document.getElementById('pdfViewer');
const audioPlayer = document.getElementById('audioPlayer');
const resumoBox = document.getElementById('resumoBox');
const resumoTexto = document.getElementById('resumoTexto');

function fetchDirectoryStructure() {
    fetch('/directory_structure')
        .then(response => response.json())
        .then(data => {
            buildTree(data, treeContainer);
        });
}

function buildTree(data, container, level = 0) {
    container.innerHTML = '';
    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'pdf-card';
        card.style.marginLeft = `${level * 20}px`;

        const cardHeader = document.createElement('div');
        cardHeader.className = 'pdf-card-header';
        const icon = document.createElement('span');
        icon.className = 'icon';
        if (item.type === 'folder') {
            icon.textContent = '📁';
        } else {
            icon.textContent = '📄';
        }
        const title = document.createElement('span');
        title.textContent = item.name;
        title.className = 'pdf-card-title';

        cardHeader.appendChild(icon);
        cardHeader.appendChild(title);
        card.appendChild(cardHeader);

        if (item.type === 'folder') {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'hidden';
            buildTree(item.children, childrenContainer, level + 1);
            cardHeader.onclick = () => {
                const isHidden = childrenContainer.classList.contains('hidden');
                childrenContainer.classList.toggle('hidden');
            };
            card.appendChild(childrenContainer);
        } else {
            cardHeader.onclick = () => {
                viewPDF(item.path);
                clearExtras();
                document.querySelectorAll('.pdf-actions').forEach(btns => btns.remove());

                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'pdf-actions';

                const btnAudio = document.createElement('button');
                btnAudio.textContent = '🔊 Ouvir';
                btnAudio.onclick = (e) => {
                    e.stopPropagation();
                    tocarAudio(item.path);
                };

                const btnResumo = document.createElement('button');
                btnResumo.textContent = '🧠 Resumir';
                btnResumo.onclick = (e) => {
                    e.stopPropagation();
                    gerarResumo(item.path);
                };

                actionsDiv.appendChild(btnAudio);
                actionsDiv.appendChild(btnResumo);
                card.appendChild(actionsDiv);
            };

            // Botões de extra
            const btnsDiv = document.createElement('div');
            btnsDiv.style.marginTop = '5px';
            btnsDiv.style.paddingLeft = '20px';

            const btnAudio = document.createElement('button');
            btnAudio.textContent = '🔊 Ouvir';
            btnAudio.onclick = (e) => {
                e.stopPropagation();
                tocarAudio(item.path);
            };

            const btnResumo = document.createElement('button');
            btnResumo.textContent = '🧠 Resumir';
            btnResumo.onclick = (e) => {
                e.stopPropagation();
                gerarResumo(item.path);
            };

            btnsDiv.appendChild(btnAudio);
            btnsDiv.appendChild(btnResumo);
            wrapper.appendChild(btnsDiv);
        }

        container.appendChild(card);
    });
}



function viewPDF(path) {
    console.log(path);
    const relativePath = path.replace(/\\/g, '/');
    console.log(relativePath);
    pdfViewer.src = `/pdf/${relativePath}`;
    console.log(pdfViewer.src);
}

function tocarAudio(path) {
    showLoadingOverlay("Carregando áudio...");
    audioPlayer.style.display = 'none';
    audioPlayer.src = '';

    fetch(`/audio_pdf?path=${encodeURIComponent(path)}`)
        .then(res => res.json())
        .then(data => {
            if (data.audio_url) {
                audioPlayer.src = data.audio_url + `?t=${Date.now()}`;
                audioPlayer.style.display = 'block';
                audioPlayer.load();
                audioPlayer.oncanplaythrough = () => {
                    hideLoadingOverlay();
                    audioPlayer.play();
                };
                audioPlayer.onerror = () => {
                    hideLoadingOverlay();
                    alert("Erro ao carregar áudio.");
                };
            } else {
                hideLoadingOverlay();
                alert("Erro: resposta inválida do servidor.");
            }
        })
        .catch(err => {
            hideLoadingOverlay();
            alert("Erro ao buscar o áudio.");
            console.error(err);
        });
}




function gerarResumo(path) {
    resumoTexto.textContent = 'Gerando resumo...';
    resumoBox.style.display = 'block';
    fetch(`/resumo_pdf?path=${encodeURIComponent(path)}`)
        .then(res => res.json())
        .then(data => {
            resumoTexto.textContent = data.resumo;
        })
        .catch(err => {
            resumoTexto.textContent = 'Erro ao gerar resumo.';
        });
}

function clearExtras() {
    audioPlayer.pause();
    audioPlayer.src = '';
    audioPlayer.style.display = 'none';
    resumoBox.style.display = 'none';
    resumoTexto.textContent = '';
}

function showLoadingOverlay(text) {
    let overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '9999';
    overlay.style.color = 'white';
    overlay.style.fontSize = '20px';
    overlay.innerHTML = `<div class="spinner"></div><div style="margin-top: 10px;">${text}</div>`;

    document.body.appendChild(overlay);
}

function hideLoadingOverlay() {
    let overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

let baseDirectory = "";

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('folderPicker').addEventListener('click', () => {
        const userBase = prompt("Digite o caminho completo da pasta onde estão os PDFs:");
        if (userBase) {
            baseDirectory = userBase.trim();
            carregarEstruturaDiretorio();
            document.getElementById('selected-folder-info').textContent = `📁 Pasta atual: ${baseDirectory}`;
        }
    });
});

function carregarEstruturaDiretorio() {
    if (!baseDirectory) return;

    fetch(`/directory_structure?base=${encodeURIComponent(baseDirectory)}`)
        .then(response => response.json())
        .then(data => {
            buildTree(data, treeContainer);
            console.log(data);
        })
        .catch(err => {
            alert('Erro ao carregar estrutura do diretório.');
            console.error(err);
        });
}

