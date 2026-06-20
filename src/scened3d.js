let viewer = null;
let timeoutId = null;
let currentContainer = null;

export function init3DScene() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    container.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100%; color: var(--text-muted); flex-direction: column; gap: 10px;">
            <span style="font-size: 2rem;">🖥️</span>
            <span>Выберите деталь для просмотра</span>
        </div>
    `;
    currentContainer = container;
    console.log('3D-сцена инициализирована (режим placeholder)');
}

export function addComponentTo3D(categoryKey, sketchfabId) {
    if (!currentContainer) {
        console.warn('Контейнер не найден');
        return;
    }

    if (!sketchfabId || sketchfabId === "bbb6fd2b16614f319a65af99a4338d77") {
        currentContainer.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100%; color: var(--text-muted); flex-direction: column; gap: 10px;">
                <span style="font-size: 2rem;">🖥️</span>
                <span>Модель не доступна</span>
                <span style="font-size: 0.9rem;">Попробуйте выбрать другую деталь</span>
            </div>
        `;
        return;
    }

    currentContainer.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100%; color: var(--text-muted); flex-direction: column; gap: 10px;">
            <span style="font-size: 2rem;">⏳</span>
            <span>Загрузка модели...</span>
        </div>
    `;

    const iframe = document.createElement('iframe');
    iframe.src = `https://sketchfab.com/models/${sketchfabId}/embed`;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.allow = 'autoplay; fullscreen';
    iframe.allowFullscreen = true;

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
        if (currentContainer.contains(iframe)) {
            currentContainer.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; height: 100%; color: var(--text-muted); flex-direction: column; gap: 10px;">
                    <span style="font-size: 2rem;">⚠️</span>
                    <span>Модель не загрузилась</span>
                    <span style="font-size: 0.9rem;">Возможно, она недоступна</span>
                </div>
            `;
        }
    }, 5000);

    iframe.onload = () => {
        clearTimeout(timeoutId);
        currentContainer.innerHTML = '';
        currentContainer.appendChild(iframe);
        viewer = iframe;
    };

    currentContainer.appendChild(iframe);
}