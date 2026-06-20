let viewer = null;

export function init3DScene() {
    const container = document.getElementById('canvas-container');
    if (!container) {
        console.warn('Контейнер #canvas-container не найден');
        return;
    }

    container.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.src = 'https://sketchfab.com/models/bbb6fd2b16614f319a65af99a4338d77/embed';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.allow = 'autoplay; fullscreen; vr';
    iframe.allowFullscreen = true;

    container.appendChild(iframe);
    viewer = iframe;

    console.log('3D-сцена инициализирована (Sketchfab)');
}

export function addComponentTo3D(categoryKey, sketchfabId) {
    if (!viewer) {
        console.warn('⚠️ 3D-сцена не инициализирована. Сначала вызовите init3DScene()');
        return;
    }

    if (!sketchfabId || sketchfabId === "bbb6fd2b16614f319a65af99a4338d77") {
        viewer.src = 'https://sketchfab.com/models/bbb6fd2b16614f319a65af99a4338d77/embed';
        return;
    }

    viewer.src = `https://sketchfab.com/models/${sketchfabId}/embed`;
    console.log(`🔄 Загружена модель: ${sketchfabId} (категория: ${categoryKey})`);
}