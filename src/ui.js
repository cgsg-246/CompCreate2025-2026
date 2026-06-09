const FIVE_MINUTES = 5 * 60 * 1000;
const priceCache = {};
let currentDB = {};

let activeCategoryKey = "";
let activeItemsList = [];

// Объект-корзина для хранения полной сборки пользователя
const activeBuild = {
    cpu: null, gpu: null, motherboard: null, ram: null, storage: null,
    psu: null, case: null, cooler: null, case_fans: null
};

// Карта связи дата-атрибутов кнопок с ключами JSON
const categoryMapping = {
    "cpu": "cpu", "video_card": "gpu", "motherboard": "motherboard", "ram": "ram",
    "storage": "storage", "power_supply": "psu", "case": "case",
    "cpu_cooler": "cooler", "case_fans": "case_fans"
};

/**
 * Инициализация UI и привязка событий
 */
export function initUI(database) {
    currentDB = database;

    const menuButtons = document.querySelectorAll('.menu-btn');
    const modal = document.getElementById('modal');
    const closeModalBtn = document.getElementById('close-modal');

    menuButtons.forEach(button => {
        button.addEventListener('click', () => {
            const htmlCategory = button.getAttribute('data-category');
            const jsonCategory = categoryMapping[htmlCategory];
            const rusTitle = button.innerText;

            if (jsonCategory) {
                openComponentsModal(rusTitle, jsonCategory);
            }
        });
    });

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            stopPriceUpdater();
        });
    }

    // Слушатели базовых фильтров (Поиск и Цены)
    const searchInput = document.getElementById('search-input');
    const priceSlider = document.getElementById('price-slider');

    if (searchInput) searchInput.addEventListener('input', applyFiltersAndRender);
    if (priceSlider) {
        priceSlider.addEventListener('input', (e) => {
            document.getElementById('price-slider-value').innerText = parseInt(e.target.value).toLocaleString() + " ₽";
            applyFiltersAndRender();
        });
    }

    updateSidebarUI();
}

/**
 * Динамическая генерация фильтров под конкретную категорию
 */
function renderDynamicFilters(categoryKey) {
    const container = document.getElementById('dynamic-filter-container');
    if (!container) return;

    let html = '';

    if (categoryKey === 'cpu' || categoryKey === 'motherboard' || categoryKey === 'cooler') {
        html = `
            <select id="sub-filter" style="width: 100%; padding: 10px; background: #121214; border: 1px solid #333; color: #fff; border-radius: 6px; font-size: 14px; cursor: pointer;">
                <option value="all">Все сокеты</option>
                <option value="AM4">AM4</option>
                <option value="AM5">AM5</option>
                <option value="LGA1700">LGA1700</option>
                <option value="LGA1851">LGA1851</option>
            </select>
        `;
    } else if (categoryKey === 'gpu') {
        html = `
            <select id="sub-filter" style="width: 100%; padding: 10px; background: #121214; border: 1px solid #333; color: #fff; border-radius: 6px; font-size: 14px; cursor: pointer;">
                <option value="all">Вся память</option>
                <option value="6GB">6 GB</option>
                <option value="8GB">8 GB</option>
                <option value="12GB">12 GB</option>
                <option value="16GB">16 GB</option>
            </select>
        `;
    } else if (categoryKey === 'ram') {
        html = `
            <select id="sub-filter" style="width: 100%; padding: 10px; background: #121214; border: 1px solid #333; color: #fff; border-radius: 6px; font-size: 14px; cursor: pointer;">
                <option value="all">Все типы</option>
                <option value="DDR4">DDR4</option>
                <option value="DDR5">DDR5</option>
            </select>
        `;
    } else if (categoryKey === 'storage') {
        html = `
            <select id="sub-filter" style="width: 100%; padding: 10px; background: #121214; border: 1px solid #333; color: #fff; border-radius: 6px; font-size: 14px; cursor: pointer;">
                <option value="all">Все типы</option>
                <option value="M.2">M.2 NVMe</option>
                <option value="SATA">SATA SSD</option>
                <option value="HDD">HDD Диски</option>
            </select>
        `;
    } else if (categoryKey === 'psu') {
        html = `
            <select id="sub-filter" style="width: 100%; padding: 10px; background: #121214; border: 1px solid #333; color: #fff; border-radius: 6px; font-size: 14px; cursor: pointer;">
                <option value="all">Любая мощность</option>
                <option value="500W">500W - 600W</option>
                <option value="700W">700W - 850W</option>
                <option value="1000W">1000W+</option>
            </select>
        `;
    } else {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = html;
    document.getElementById('sub-filter').addEventListener('change', applyFiltersAndRender);
}

/**
 * Открытие окна и сброс состояния фильтрации
 */
async function openComponentsModal(title, categoryKey) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const searchInput = document.getElementById('search-input');
    const priceSlider = document.getElementById('price-slider');

    if (!modal) return;

    if (searchInput) searchInput.value = "";
    if (priceSlider) {
        priceSlider.value = 300000;
        document.getElementById('price-slider-value').innerText = "300 000 ₽";
    }

    if (modalTitle) modalTitle.innerText = title;
    modal.classList.remove('hidden');

    activeCategoryKey = categoryKey;
    activeItemsList = currentDB[categoryKey] || [];

    renderDynamicFilters(categoryKey);
    applyFiltersAndRender();
}

/**
 * Применение фильтров и рендеринг карточек
 */
function applyFiltersAndRender() {
    const productsList = document.getElementById('products-list');
    const searchInput = document.getElementById('search-input');
    const priceSlider = document.getElementById('price-slider');
    const subFilter = document.getElementById('sub-filter');

    if (!productsList) return;

    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const maxPrice = priceSlider ? parseInt(priceSlider.value) : 300000;
    const subValue = subFilter ? subFilter.value : "all";

    productsList.innerHTML = '';

    const filteredItems = activeItemsList.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(query);
        const itemPrice = priceCache[item.name]?.price || 0;
        const matchesPrice = itemPrice <= maxPrice;

        let matchesSub = true;
        if (subValue !== "all") {
            const nameUpper = item.name.toUpperCase();
            if (["cpu", "motherboard", "cooler"].includes(activeCategoryKey)) {
                matchesSub = item.socket === subValue;
            } else if (activeCategoryKey === 'gpu' || activeCategoryKey === 'ram' || activeCategoryKey === 'storage') {
                matchesSub = nameUpper.includes(subValue.toUpperCase());
            } else if (activeCategoryKey === 'psu') {
                if (subValue === "500W") matchesSub = nameUpper.includes("500W") || nameUpper.includes("600W");
                if (subValue === "700W") matchesSub = nameUpper.includes("700W") || nameUpper.includes("750W") || nameUpper.includes("850W");
                if (subValue === "1000W") matchesSub = nameUpper.includes("1000W") || nameUpper.includes("1200W") || nameUpper.includes("1300W");
            }
        }

        return matchesSearch && matchesPrice && matchesSub;
    });

    if (filteredItems.length === 0) {
        productsList.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">Ничего не найдено...</p>';
        return;
    }

    filteredItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="card-info">
                <h4>${item.name}</h4>
                ${item.socket ? `<span class="socket-tag">${item.socket}</span>` : ''}
                <div class="live-price-box">Цена: <span id="realtime-price-${item.id}">Запрос...</span> ₽</div>
            </div>
            <div class="card-actions">
                <div class="shop-buttons">
                    <a href="${item.links.dns}" target="_blank" class="btn-dns">DNS</a>
                    <a href="${item.links.yandex}" target="_blank" class="btn-ya">Маркет</a>
                </div>
                <button class="select-part-btn" onclick="window.selectComponentFor3D('${activeCategoryKey}', '${item.id}', '${item.name}')">Выбрать</button>
            </div>
        `;
        productsList.appendChild(card);
        updateSinglePriceUI(item);
    });

    startPriceUpdater(filteredItems);
}

/**
 * Логика обновления цен (5 минут)
 */
async function fetchLivePrice(itemName) {
    const now = Date.now();
    if (priceCache[itemName] && (now - priceCache[itemName].timestamp < FIVE_MINUTES)) {
        return priceCache[itemName].price;
    }
    const generatedPrice = Math.floor(Math.random() * (45000 - 4500) + 4500);
    priceCache[itemName] = { price: generatedPrice, timestamp: now };
    return generatedPrice;
}

async function updateSinglePriceUI(item) {
    const priceSpan = document.getElementById(`realtime-price-${item.id}`);
    if (!priceSpan) return;
    const freshPrice = await fetchLivePrice(item.name);
    if (freshPrice) priceSpan.innerText = freshPrice.toLocaleString();
}

function startPriceUpdater(itemsList) {
    stopPriceUpdater();
    window.uiPriceInterval = setInterval(() => {
        itemsList.forEach(item => updateSinglePriceUI(item));
    }, FIVE_MINUTES);
}

function stopPriceUpdater() {
    if (window.uiPriceInterval) clearInterval(window.uiPriceInterval);
}

function updateSidebarUI() {
    const statusDiv = document.getElementById('ai-status');
    const totalPriceDiv = document.getElementById('total-price');

    if (!statusDiv || !totalPriceDiv) return;

    statusDiv.innerHTML = '';
    let totalPrice = 0;
    let hasItems = false;

    for (const cat in activeBuild) {
        const item = activeBuild[cat];

        if (item) {
            hasItems = true;
            totalPrice += item.price;

            const itemRow = document.createElement('div');
            itemRow.className = 'sidebar-build-item';
            itemRow.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; align-items: center;';

            itemRow.innerHTML = `
                <span>🛠️ <b>${cat.toUpperCase()}:</b> ${item.name} (${item.price.toLocaleString()} ₽)</span>
                <span class="remove-item-btn" onclick="window.removeComponentFromBuild('${cat}')" style="color: #ff3366; cursor: pointer; font-weight: bold; margin-left: 10px; font-size: 16px;">[×]</span>
            `;
            statusDiv.appendChild(itemRow);
        }
    }

    if (!hasItems) {
        statusDiv.innerHTML = '<div style="color: #666;">Ожидание сборки...</div>';
    }

    totalPriceDiv.innerHTML = `Итого: <span style="color: #00ff88; font-weight: bold;">${totalPrice.toLocaleString()}</span> руб.`;
}

window.selectComponentFor3D = async function (category, id, name) {
    const itemPrice = await fetchLivePrice(name);

    activeBuild[category] = { id, name, price: itemPrice };

    document.getElementById('modal').classList.add('hidden');
    stopPriceUpdater();

    updateSidebarUI();
};

window.removeComponentFromBuild = function (category) {
    activeBuild[category] = null;

    updateSidebarUI();

    console.log(`Компонент из категории ${category.toUpperCase()} успешно удален.`);
};