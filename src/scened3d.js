let viewer = null;

export function init3DScene() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    container.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.src = 'https://sketchfab.com/models/bbb6fd2b16614f319a65af99a4338d77/embed'; // заглушка
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.allow = 'autoplay; fullscreen';
    iframe.allowFullscreen = true;

    iframe.onerror = () => {
        container.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100%; color: var(--text-muted); flex-direction: column; gap: 10px;">
                <span style="font-size: 2rem;">🖥️</span>
                <span>Модель не загружена</span>
                <span style="font-size: 0.9rem;">Выберите деталь для просмотра</span>
            </div>
        `;
    };

    container.appendChild(iframe);
    viewer = iframe;
}

export function addComponentTo3D(categoryKey, sketchfabId) {
    if (!viewer) {
        console.warn('3D-сцена не инициализирована. Сначала вызовите init3DScene()');
        return;
    }

    if (!sketchfabId || sketchfabId === "bbb6fd2b16614f319a65af99a4338d77") {
        viewer.src = 'https://sketchfab.com/models/bbb6fd2b16614f319a65af99a4338d77/embed';
        return;
    }

    viewer.src = `https://sketchfab.com/models/${sketchfabId}/embed`;
    console.log(`Загружена модель: ${sketchfabId} (категория: ${categoryKey})`);
}