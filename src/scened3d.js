let viewer = null;
let currentContainer = null;

export function init3DScene() {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    currentContainer = container;
    showPlaceholder('Выберите деталь для просмотра', '🖥️');
}

function showPlaceholder(text, icon = '🖥️') {
    if (!currentContainer) return;
    currentContainer.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100%; color: var(--text-muted); flex-direction: column; gap: 10px;">
            <span style="font-size: 2rem;">${icon}</span>
            <span>${text}</span>
        </div>
    `;
}

export function addComponentTo3D(categoryKey, sketchfabId) {
    if (!currentContainer) return;

    if (!sketchfabId || sketchfabId === "bbb6fd2b16614f319a65af99a4338d77") {
        showPlaceholder('Модель не доступна', '🖥️');
        return;
    }

    currentContainer.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'width:100%; height:100%; position:relative;';

    const loading = document.createElement('div');
    loading.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: var(--text-muted);
        font-size: 1.2rem;
        z-index: 10;
        background: rgba(10, 11, 30, 0.8);
        padding: 20px 30px;
        border-radius: 8px;
        text-align: center;
    `;
    loading.textContent = '⏳ Загрузка модели...';

    const iframe = document.createElement('iframe');
    iframe.src = `https://sketchfab.com/models/${sketchfabId}/embed`;
    iframe.style.cssText = 'width:100%; height:100%; border:none; position:absolute; top:0; left:0;';
    iframe.allow = 'autoplay; fullscreen';
    iframe.allowFullscreen = true;

    let timeoutId = setTimeout(() => {
        if (loading.style.display !== 'none') {
            loading.innerHTML = `
                <span style="font-size: 2rem;">⚠️</span><br>
                Модель не загрузилась<br>
                <span style="font-size: 0.8rem;">Попробуйте выбрать другую деталь</span>
            `;
            loading.style.color = '#ff007f';
        }
    }, 10000);

    iframe.onload = () => {
        clearTimeout(timeoutId);
        loading.style.display = 'none';
    };

    wrapper.appendChild(iframe);
    wrapper.appendChild(loading);
    currentContainer.appendChild(wrapper);
    viewer = iframe;
}