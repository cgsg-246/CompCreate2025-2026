import { initUI, renderSelectedComponents } from './ui.js';
import { init3DScene, addComponentTo3D } from './scened3d.js';
import { analyzeBuildWithAI } from './ai.js';

const currentBuild = {
    case: null, motherboard: null, cpu: null, cooler: null,
    ram: null, gpu: null, storage: null, power: null, case_fans: null
};

async function startApp() {
    try {
        init3DScene();

        const response = await fetch('http://localhost:5000/api/products');
        if (!response.ok) throw new Error('Не удалось загрузить базу данных комплектующих');
        const hardwareDatabase = await response.json();

        initUI(hardwareDatabase, handleProductSelection, handleProductDeletion);
        console.log("Конструктор успешно запущен!");
    } catch (e) {
        console.error("Ошибка старта приложения:", e);
    }
}

async function handleProductSelection(categoryKey, product) {
    currentBuild[categoryKey] = product;

    addComponentTo3D(categoryKey, product.sketchfabId);

    renderSelectedComponents(currentBuild);

    updateTotalPriceAndAI();
}

function handleProductDeletion(categoryKey) {
    currentBuild[categoryKey] = null;

    addComponentTo3D(categoryKey, "bbb6fd2b16614f319a65af99a4338d77");

    renderSelectedComponents(currentBuild);

    updateTotalPriceAndAI();
}

async function updateTotalPriceAndAI() {
    const total = Object.values(currentBuild).reduce((sum, item) => {
        return sum + (item ? (item.price_approx || 0) : 0);
    }, 0);

    const priceDisplay = document.getElementById('total-price');
    if (priceDisplay) {
        priceDisplay.innerText = `Итого: ${total.toLocaleString()} ₽`;
    }

    const aiBox = document.getElementById('ai-status');
    if (aiBox) {
        aiBox.innerHTML = '<div style="color: var(--accent-blue)">🤖 ИИ пересчитывает параметры совместимости и FPS...</div>';
    }

    const aiRes = await analyzeBuildWithAI(currentBuild);

    if (aiBox) {
        aiBox.innerHTML = `
            <p><strong>Вердикт ИИ:</strong> ${aiRes.verdict || 'Компоненты успешно состыкованы.'}</p>
            <p style="margin-top: 10px;">🎮 Cyberpunk 2077: <span style="color: var(--accent-blue)">${aiRes.perf_cyberpunk || '—'}</span></p>
            <p>🎮 CS2: <span style="color: var(--accent-blue)">${aiRes.perf_cs2 || '—'}</span></p>
            <p>🎮 DOTA 2: <span style="color: var(--accent-blue)">${aiRes.perf_dota2 || '—'}</span></p>
        `;

        if (aiRes.compatibility_errors && aiRes.compatibility_errors.length > 0) {
            aiBox.innerHTML += `
                <div style="color: var(--accent-pink); margin-top: 12px; padding-top: 8px; border-top: 1px dashed var(--accent-pink);">
                    Ошибки сборки: <br>${aiRes.compatibility_errors.join('<br>')}
                </div>
            `;
        }
    }
}

startApp();
