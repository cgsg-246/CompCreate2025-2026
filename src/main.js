import * as THREE from 'three';
import { initUI } from './ui.js';
import { init3DScene, addComponentTo3D } from './scened3d.js';
import { analyzeBuildWithAI } from './ai.js';

window.THREE = THREE;

const currentBuild = {
    case: null,
    motherboard: null,
    cpu: null,
    cooler: null,
    ram: null,
    gpu: null,
    storage: null,
    power: null,
    case_fans: null
};

async function startApp() {
    try {
        init3DScene();

        const response = await fetch('./assets/database.json');
        const hardwareDatabase = await response.json();

        initUI(hardwareDatabase, handleProductSelection);

        console.log("Конструктор успешно запущен!");
    } catch (e) {
        console.error("Ошибка старта приложения:", e);
    }
}

async function handleProductSelection(categoryKey, product) {
    currentBuild[categoryKey] = product;

    const btn = document.querySelector(`.menu-btn[data-category="${categoryKey}"]`);
    if (btn) btn.innerText = product.name.slice(0, 18) + '...';

    addComponentTo3D(categoryKey, product.modelName);

    const total = Object.values(currentBuild).reduce((sum, item) => {
        return sum + (item ? (item.price || 0) : 0);
    }, 0);

    const priceDisplay = document.getElementById('total-price');
    if (priceDisplay) {
        priceDisplay.innerText = `Итого: ${total.toLocaleString()} ₽`;
    }

    const aiBox = document.getElementById('ai-status');
    if (aiBox) {
        aiBox.innerHTML = '<div style="color: var(--accent-blue)">🤖 ИИ проверяет совместимость 9 компонентов...</div>';
    }

    const aiRes = await analyzeBuildWithAI(currentBuild);

    if (aiBox) {
        aiBox.innerHTML = `
            <p><strong>Вердикт ИИ:</strong> ${aiRes.verdict || 'Компоненты успешно состыкованы.'}</p>
            <p style="margin-top: 10px;">🎮 Cyberpunk 2077: <span style="color: var(--accent-blue)">${aiRes.perf_cyberpunk || '—'}</span></p>
            <p>🎮 CS2: <span style="color: var(--accent-blue)">${aiRes.perf_cs2 || '—'}</span></p>
        `;

        if (aiRes.compatibility_errors && aiRes.compatibility_errors.length > 0) {
            aiBox.innerHTML += `
                <div style="color: var(--accent-pink); margin-top: 12px; padding-top: 8px; border-top: 1px dashed var(--accent-pink);">
                    ⚠️ Ошибки сборки: <br>${aiRes.compatibility_errors.join('<br>')}
                </div>
            `;
        }
    }
}

startApp();

