import { initUI, renderSelectedComponents } from './ui.js';
import { init3DScene, addComponentTo3D } from './scened3d.js';
import { analyzeBuildWithAI } from './ai.js';
import { login, register, logout, isAuthenticated } from './auth.js';
import { apiRequest } from './apiClient.js';

let builds = [];
let activeBuildId = null;

function getActiveBuild() {
    return builds.find(b => b.id === activeBuildId) || null;
}

async function loadSavedBuilds() {
    const token = sessionStorage.getItem('auth_token');
    let loadedBuilds = [];
    if (token) {
        try {
            const data = await apiRequest('/api/builds');
            if (data && data.builds) {
                loadedBuilds = data.builds;
                localStorage.setItem('cached_builds', JSON.stringify(loadedBuilds));
            }
        } catch (e) {
            const cached = localStorage.getItem('cached_builds');
            if (cached) loadedBuilds = JSON.parse(cached);
        }
    } else {
        const guest = sessionStorage.getItem('guest_builds');
        if (guest) loadedBuilds = JSON.parse(guest);
    }
    if (loadedBuilds.length === 0) {
        const defaultBuild = {
            id: `build_${Date.now()}`,
            name: 'Моя сборка',
            components: {
                case: null, motherboard: null, cpu: null, cooler: null,
                ram: null, gpu: null, storage: null, psu: null, case_fans: null
            },
            createdAt: new Date().toISOString()
        };
        loadedBuilds = [defaultBuild];
        if (token) {
            try {
                const newBuild = await apiRequest('/api/builds', {
                    method: 'POST',
                    body: JSON.stringify({ name: defaultBuild.name, components: defaultBuild.components })
                });
                if (newBuild && newBuild.build) loadedBuilds[0] = newBuild.build;
            } catch (e) { }
        }
        localStorage.setItem('cached_builds', JSON.stringify(loadedBuilds));
        if (!token) sessionStorage.setItem('guest_builds', JSON.stringify(loadedBuilds));
    }
    builds = loadedBuilds;
    activeBuildId = builds[0]?.id || null;
    const savedId = localStorage.getItem('active_build_id');
    if (savedId && builds.some(b => b.id === savedId)) {
        activeBuildId = savedId;
    }
    applyActiveBuild();
    updateAuthUI();
}

function applyActiveBuild() {
    const active = getActiveBuild();
    if (!active) {
        const newId = `build_${Date.now()}`;
        const newBuild = {
            id: newId,
            name: 'Новая сборка',
            components: {
                case: null, motherboard: null, cpu: null, cooler: null,
                ram: null, gpu: null, storage: null, psu: null, case_fans: null
            },
            createdAt: new Date().toISOString()
        };
        builds.push(newBuild);
        activeBuildId = newId;
        saveBuildsToStorage();
    }
    const comps = getActiveBuild().components;
    renderSelectedComponents(comps);
    updateTotalPriceAndAI();
    const firstItem = Object.values(comps).find(v => v !== null);
    if (firstItem) {
        addComponentTo3D('', firstItem.sketchfabId);
    } else {
        addComponentTo3D('', null);
    }
    renderBuildSelector();
}

async function saveBuildsToStorage() {
    const token = sessionStorage.getItem('auth_token');
    const dataToStore = builds.map(b => ({ ...b }));
    if (token) {
        localStorage.setItem('cached_builds', JSON.stringify(dataToStore));
    } else {
        sessionStorage.setItem('guest_builds', JSON.stringify(dataToStore));
    }
}

async function updateBuildOnServer(buildId, updates) {
    const token = sessionStorage.getItem('auth_token');
    if (!token) return;
    try {
        await apiRequest(`/api/builds/${buildId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    } catch (e) {
        console.warn('Ошибка обновления сборки на сервере', e);
    }
}

function switchBuild(buildId) {
    activeBuildId = buildId;
    localStorage.setItem('active_build_id', buildId);
    applyActiveBuild();
}

async function createBuild(name) {
    const newBuild = {
        id: `build_${Date.now()}`,
        name: name || 'Новая сборка',
        components: {
            case: null, motherboard: null, cpu: null, cooler: null,
            ram: null, gpu: null, storage: null, psu: null, case_fans: null
        },
        createdAt: new Date().toISOString()
    };
    builds.push(newBuild);
    activeBuildId = newBuild.id;
    await saveBuildsToStorage();
    const token = sessionStorage.getItem('auth_token');
    if (token) {
        try {
            const result = await apiRequest('/api/builds', {
                method: 'POST',
                body: JSON.stringify({ name: newBuild.name, components: newBuild.components })
            });
            if (result && result.build) {
                const idx = builds.findIndex(b => b.id === newBuild.id);
                builds[idx] = result.build;
                activeBuildId = result.build.id;
                await saveBuildsToStorage();
            }
        } catch (e) { }
    }
    applyActiveBuild();
    renderBuildSelector();
}

async function deleteBuild(buildId) {
    if (builds.length <= 1) {
        alert('Нельзя удалить последнюю сборку');
        return;
    }
    if (!confirm(`Удалить сборку "${builds.find(b => b.id === buildId)?.name}"?`)) return;
    builds = builds.filter(b => b.id !== buildId);
    if (activeBuildId === buildId) {
        activeBuildId = builds[0]?.id || null;
    }
    await saveBuildsToStorage();
    const token = sessionStorage.getItem('auth_token');
    if (token) {
        try {
            await apiRequest(`/api/builds/${buildId}`, { method: 'DELETE' });
        } catch (e) { }
    }
    applyActiveBuild();
    renderBuildSelector();
}

async function renameBuild(buildId, newName) {
    const build = builds.find(b => b.id === buildId);
    if (!build) return;
    build.name = newName;
    await saveBuildsToStorage();
    await updateBuildOnServer(buildId, { name: newName });
    renderBuildSelector();
}

function renderBuildSelector() {
    const container = document.getElementById('build-selector');
    if (!container) return;
    let html = `
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 10px;">
            <select id="build-select" style="flex:1; padding:8px; background:#0a0b1e; color:white; border:1px solid #9d4edd; border-radius:4px;">
    `;
    builds.forEach(b => {
        html += `<option value="${b.id}" ${b.id === activeBuildId ? 'selected' : ''}>${b.name}</option>`;
    });
    html += `
            </select>
            <button id="build-new-btn" class="auth-btn" style="padding:6px 12px;">+</button>
            <button id="build-rename-btn" class="auth-btn" style="padding:6px 12px;">✏️</button>
            <button id="build-delete-btn" class="auth-btn" style="padding:6px 12px;">🗑️</button>
        </div>
    `;
    container.innerHTML = html;
    document.getElementById('build-select').addEventListener('change', (e) => {
        switchBuild(e.target.value);
    });
    document.getElementById('build-new-btn').addEventListener('click', () => {
        const name = prompt('Введите название новой сборки:', 'Новая сборка');
        if (name !== null) createBuild(name);
    });
    document.getElementById('build-rename-btn').addEventListener('click', () => {
        const active = getActiveBuild();
        if (!active) return;
        const newName = prompt('Введите новое название:', active.name);
        if (newName !== null && newName.trim() !== '') {
            renameBuild(active.id, newName.trim());
        }
    });
    document.getElementById('build-delete-btn').addEventListener('click', () => {
        const active = getActiveBuild();
        if (!active) return;
        deleteBuild(active.id);
    });
}

function updateAuthUI() {
    const isAuth = isAuthenticated();
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    if (loginBtn) loginBtn.style.display = isAuth ? 'none' : 'inline-block';
    if (registerBtn) registerBtn.style.display = isAuth ? 'none' : 'inline-block';
    if (logoutBtn) logoutBtn.style.display = isAuth ? 'inline-block' : 'none';
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('show');
}

function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.classList.remove('show');
    const msg = document.getElementById('login-message');
    if (msg) { msg.textContent = ''; msg.className = 'form-message'; }
}

function closeRegisterModal() {
    const modal = document.getElementById('register-modal');
    if (modal) modal.classList.remove('show');
    const msg = document.getElementById('register-message');
    if (msg) { msg.textContent = ''; msg.className = 'form-message'; }
}

document.getElementById('login-btn').addEventListener('click', () => {
    closeRegisterModal();
    openModal('login-modal');
});
document.getElementById('register-btn').addEventListener('click', () => {
    closeLoginModal();
    openModal('register-modal');
});
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

document.getElementById('login-submit').addEventListener('click', async function (e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const submitBtn = this;
    const msgEl = document.getElementById('login-message');
    if (!email || !password) {
        msgEl.textContent = 'Заполните все поля';
        msgEl.className = 'form-message error';
        return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Вход...';
    submitBtn.classList.add('btn-loading');
    try {
        await login(email, password);
        msgEl.textContent = 'Вход выполнен!';
        msgEl.className = 'form-message success';
        setTimeout(async () => {
            closeLoginModal();
            document.getElementById('login-email').value = '';
            document.getElementById('login-password').value = '';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Войти';
            submitBtn.classList.remove('btn-loading');
            await loadSavedBuilds();
            updateAuthUI();
        }, 1000);
    } catch (e) {
        msgEl.textContent = e.message;
        msgEl.className = 'form-message error';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Войти';
        submitBtn.classList.remove('btn-loading');
    }
});

document.getElementById('register-submit').addEventListener('click', async function (e) {
    e.preventDefault();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value.trim();
    const submitBtn = this;
    const msgEl = document.getElementById('register-message');
    if (!email || !password) {
        msgEl.textContent = 'Заполните все поля';
        msgEl.className = 'form-message error';
        return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Регистрация...';
    submitBtn.classList.add('btn-loading');
    try {
        await register(email, password);
        msgEl.textContent = 'Регистрация успешна!';
        msgEl.className = 'form-message success';
        setTimeout(async () => {
            closeRegisterModal();
            document.getElementById('register-email').value = '';
            document.getElementById('register-password').value = '';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Зарегистрироваться';
            submitBtn.classList.remove('btn-loading');
            await loadSavedBuilds();
            updateAuthUI();
        }, 1000);
    } catch (e) {
        msgEl.textContent = e.message;
        msgEl.className = 'form-message error';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Зарегистрироваться';
        submitBtn.classList.remove('btn-loading');
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    logout();
    updateAuthUI();
    localStorage.removeItem('cached_builds');
    sessionStorage.removeItem('guest_builds');
    builds = [];
    loadSavedBuilds();
    alert('Вы вышли из системы');
});

async function handleProductSelection(categoryKey, product) {
    const fixKey = categoryKey === 'power' ? 'psu' : categoryKey;
    const active = getActiveBuild();
    if (!active) return;
    active.components[fixKey] = product;
    renderSelectedComponents(active.components);
    updateTotalPriceAndAI();
    addComponentTo3D(fixKey, product.sketchfabId);
    await saveBuildsToStorage();
    await updateBuildOnServer(active.id, { components: active.components });
}

async function handleProductDeletion(categoryKey) {
    const active = getActiveBuild();
    if (!active) return;
    active.components[categoryKey] = null;
    renderSelectedComponents(active.components);
    updateTotalPriceAndAI();
    addComponentTo3D(categoryKey, null);
    await saveBuildsToStorage();
    await updateBuildOnServer(active.id, { components: active.components });
}

async function updateTotalPriceAndAI() {
    const active = getActiveBuild();
    if (!active) return;
    const comps = active.components;
    const total = Object.values(comps).reduce((sum, item) => {
        return sum + (item ? (item.price_approx || 0) : 0);
    }, 0);
    const priceDisplay = document.getElementById('total-price');
    if (priceDisplay) priceDisplay.innerText = `Итого: ${total.toLocaleString()} ₽`;
    const aiBox = document.getElementById('ai-status');
    if (aiBox) aiBox.innerHTML = '<div style="color: #00d2ff">Проверка готовности сборки</div>';
    const aiRes = await analyzeBuildWithAI(comps);
    if (aiBox) {
        aiBox.innerHTML = `
            <p><strong>Вердикт ИИ:</strong> ${aiRes.verdict || 'Компоненты успешно состыкованы.'}</p>
            <p>Cyberpunk 2077: <span style="color: #00d2ff">${aiRes.perf_cyberpunk || '—'}</span></p>
            <p>CS2: <span style="color: #00d2ff">${aiRes.perf_cs2 || '—'}</span></p>
            <p>DOTA 2: <span style="color: #00d2ff">${aiRes.perf_dota2 || '—'}</span></p>
        `;
        if (aiRes.compatibility_errors && aiRes.compatibility_errors.length > 0) {
            aiBox.innerHTML += `
                <div style="color: #ff007f; margin-top: 12px; padding-top: 8px; border-top: 1px dashed #ff007f;">
                    Ошибки: <br>${aiRes.compatibility_errors.join('<br>')}
                </div>
            `;
        }
    }
}

function handleProductPreview(categoryKey, product) {
    addComponentTo3D(categoryKey, product.sketchfabId);
}

async function startApp() {
    try {
        init3DScene();
        const response = await fetch('./assets/database.json');
        if (!response.ok) throw new Error('Не удалось загрузить базу данных');
        const hardwareDatabase = await response.json();
        initUI(hardwareDatabase, handleProductSelection, handleProductDeletion, handleProductPreview);
        await loadSavedBuilds();
        console.log("Конструктор запущен");
    } catch (e) {
        console.error("Ошибка старта:", e);
    }
}

startApp();