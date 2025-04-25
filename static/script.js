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
        const wrapper = document.createElement('div');
        wrapper.style.paddingLeft = `${level * 20}px`;
        const div = document.createElement('div');
        div.className = item.type;
        const arrow = document.createElement('span');
        arrow.className = 'arrow';
        const icon = document.createElement('span');
        icon.className = 'icon';
        if (item.type === 'folder') {
            arrow.textContent = '\u25b6';
            icon.textContent = '\ud83d\udcc1';
        } else {
            arrow.textContent = '';
            icon.textContent = '\ud83d\udcc4';
        }
        const text = document.createElement('span');
        text.textContent = item.name;
        div.appendChild(arrow);
        div.appendChild(icon);
        div.appendChild(text);
        wrapper.appendChild(div);
        if (item.type === 'folder') {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'hidden';
            buildTree(item.children, childrenContainer, level + 1);
            div.onclick = () => {
                const isHidden = childrenContainer.classList.contains('hidden');
                childrenContainer.classList.toggle('hidden');
                arrow.textContent = isHidden ? '\u25bc' : '\u25b6';
            };
            wrapper.appendChild(childrenContainer);
        } else {
            div.onclick = () => {
                viewPDF(item.path);
                clearExtras();
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
        container.appendChild(wrapper);
    });
}

function viewPDF(path) {
    const relativePath = path.replace(/\\/g, '/');
    pdfViewer.src = `/pdf/${relativePath}`;
}

function tocarAudio(path) {
    audioPlayer.src = `/audio_pdf?path=${encodeURIComponent(path)}`;
    audioPlayer.style.display = 'block';
    audioPlayer.play();
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

document.addEventListener("DOMContentLoaded", fetchDirectoryStructure);
