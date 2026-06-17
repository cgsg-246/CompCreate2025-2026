import { initUI, renderSelectedComponents } from './ui.js';
import { init3DScene, addComponentTo3D } from './scened3d.js';
import { analyzeBuildWithAI } from './ai.js';
import { login, register, logout, isAuthenticated } from './auth.js';
import { apiRequest } from './apiClient.js';

document.getElementById('login-btn').addEventListener('click', () => {
    document.getElementById('login-modal').style.display = 'flex';
});
document.getElementById('register-btn').addEventListener('click', () => {
    document.getElementById('register-modal').style.display = 'flex';
});

function closeLoginModal() {
    document.getElementById('login-modal').style.display = 'none';
}
function closeRegisterModal() {
    document.getElementById('register-modal').style.display = 'none';
}

document.getElementById('login-close').addEventListener('click', closeLoginModal);
document.getElementById('register-close').addEventListener('click', closeRegisterModal);

window.addEventListener('click', (e) => {
    if (e.target === document.getElementById('login-modal')) closeLoginModal();
    if (e.target === document.getElementById('register-modal')) closeRegisterModal();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeLoginModal();
        closeRegisterModal();
    }
});

document.getElementById('login-submit').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        await login(email, password);
        alert('Вход выполнен!');
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('register-btn').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'inline-block';
        closeLoginModal();
        await loadSavedBuild();
    } catch (e) {
        alert('Ошибка входа: ' + e.message);
    }
});

document.getElementById('register-submit').addEventListener('click', async () => {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    try {
        await register(email, password);
        alert('Регистрация успешна!');
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('register-btn').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'inline-block';
        closeRegisterModal();
        await loadSavedBuild();
    } catch (e) {
        alert('Ошибка регистрации: ' + e.message);
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    logout();
    document.getElementById('login-btn').style.display = 'inline-block';
    document.getElementById('register-btn').style.display = 'inline-block';
    document.getElementById('logout-btn').style.display = 'none';
    location.reload();
});

const currentBuild = {
    case: null,
    motherboard: null,
    cpu: null,
    cooler: null,
    ram: null,
    gpu: null,
    storage: null,
    psu: null,
    case_fans: null
};

async function loadSavedBuild() {
    const token = sessionStorage.getItem('auth_token');
    let build = null;

    if (token) {
        try {
            const data = await apiRequest('/api/build');
            if (data && data.build) {
                build = data.build;
                localStorage.setItem('cached_build', JSON.stringify(build));
                console.log('Загружена сборка с сервера');
            }
        } catch (e) {
            console.warn('Не удалось загрузить с сервера, берём из кэша', e);
            const cached = localStorage.getItem('cached_build');
            if (cached) build = JSON.parse(cached);
        }
    } else {
        const guest = sessionStorage.getItem('guest_build');
        if (guest) build = JSON.parse(guest);
    }

    if (build) {
        Object.keys(build).forEach(key => {
            if (build[key]) {
                currentBuild[key] = build[key];
                addComponentTo3D(key, build[key].sketchfabId);
            }
        });
        renderSelectedComponents(currentBuild);
        updateTotalPriceAndAI();
    }
}

async function saveBuildToStorage() {
    const token = sessionStorage.getItem('auth_token');
    if (token) {
        localStorage.setItem('cached_build', JSON.stringify(currentBuild));
        try {
            await apiRequest('/api/build', {
                method: 'POST',
                body: JSON.stringify({ build: currentBuild })
            });
            console.log('Сборка синхронизирована с сервером');
        } catch (e) {
            console.warn('Ошибка синхронизации:', e);
        }
    } else {
        sessionStorage.setItem('guest_build', JSON.stringify(currentBuild));
    }
}

async function startApp() {
    try {
        init3DScene();

        const response = await fetch('./assets/database.json');
        if (!response.ok) throw new Error('Не удалось загрузить базу данных комплектующих');
        const hardwareDatabase = await response.json();

        initUI(hardwareDatabase, handleProductSelection, handleProductDeletion);

        await loadSavedBuild();

        console.log("Конструктор успешно запущен и готов к работе!");
    } catch (e) {
        console.error("Ошибка старта приложения:", e);
    }
}

async function handleProductSelection(categoryKey, product) {
    const fixKey = categoryKey === 'power' ? 'psu' : categoryKey;
    currentBuild[fixKey] = product;
    console.log(`Деталь записана в память. Текущая сборка:`, currentBuild);

    addComponentTo3D(fixKey, product.sketchfabId);
    renderSelectedComponents(currentBuild);
    updateTotalPriceAndAI();

    await saveBuildToStorage();
}

async function handleProductDeletion(categoryKey) {
    currentBuild[categoryKey] = null;
    addComponentTo3D(categoryKey, "bbb6fd2b16614f319a65af99a4338d77");
    renderSelectedComponents(currentBuild);
    updateTotalPriceAndAI();

    await saveBuildToStorage();
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
        aiBox.innerHTML = '<div style="color: #00d2ff">Проверка готовности сборки для отправки к ИИ...</div>';
    }

    const aiRes = await analyzeBuildWithAI(currentBuild);

    if (aiBox) {
        aiBox.innerHTML = `
            <p><strong>Вердикт ИИ:</strong> ${aiRes.verdict || 'Компоненты успешно состыкованы.'}</p>
            <p style="margin-top: 10px;">Cyberpunk 2077: <span style="color: #00d2ff">${aiRes.perf_cyberpunk || '—'}</span></p>
            <p>CS2: <span style="color: #00d2ff">${aiRes.perf_cs2 || '—'}</span></p>
            <p>DOTA 2: <span style="color: #00d2ff">${aiRes.perf_dota2 || '—'}</span></p>
        `;

        if (aiRes.compatibility_errors && aiRes.compatibility_errors.length > 0) {
            aiBox.innerHTML += `
                <div style="color: #ff007f; margin-top: 12px; padding-top: 8px; border-top: 1px dashed #ff007f;">
                    Ошибки сборки: <br>${aiRes.compatibility_errors.join('<br>')}
                </div>
            `;
        }
    }
}

startApp();