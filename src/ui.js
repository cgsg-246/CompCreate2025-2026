import { filterAndSortProducts } from './filters.js';

let currentDB = null;
let activeCategoryKey = '';
let onProductSelectGlobal = null;
let onProductDeleteGlobal = null;
let onProductPreviewGlobal = null;

export function initUI(hardwareDatabase, onSelectCallback, onDeleteCallback, onPreviewCallback) {
    currentDB = hardwareDatabase;
    onProductSelectGlobal = onSelectCallback;
    onProductDeleteGlobal = onDeleteCallback;
    onProductPreviewGlobal = onPreviewCallback;

    const modal = document.getElementById('modal');
    const closeModal = document.getElementById('close-modal');
    const searchInput = document.getElementById('search-input');
    const priceSlider = document.getElementById('price-slider');
    const sortSelect = document.getElementById('sort-select');
    const menuButtons = document.querySelectorAll('.menu-btn');

    menuButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const categoryKey = btn.getAttribute('data-category');
            const categoryTitle = btn.innerText;
            openComponentsModal(categoryTitle, categoryKey);
        });
    });

    if (searchInput) searchInput.addEventListener('input', applyFiltersAndRender);
    if (priceSlider) {
        priceSlider.addEventListener('input', (e) => {
            const valEl = document.getElementById('price-slider-value');
            if (valEl) valEl.innerText = `${parseInt(e.target.value).toLocaleString()} ₽`;
            applyFiltersAndRender();
        });
    }
    if (sortSelect) sortSelect.addEventListener('change', applyFiltersAndRender);

    if (closeModal) closeModal.addEventListener('click', () => modal.classList.add('hidden'));
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        });
    }
}

function openComponentsModal(title, categoryKey) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const searchInput = document.getElementById('search-input');
    const priceSlider = document.getElementById('price-slider');
    const sortSelect = document.getElementById('sort-select');

    if (!modal) return;

    if (searchInput) searchInput.value = "";
    if (priceSlider) priceSlider.value = 300000;
    if (sortSelect) sortSelect.value = "default";

    const valEl = document.getElementById('price-slider-value');
    if (valEl) valEl.innerText = "300 000 ₽";

    if (modalTitle) modalTitle.innerText = title;
    modal.classList.remove('hidden');

    activeCategoryKey = categoryKey;
    applyFiltersAndRender();
}

function applyFiltersAndRender() {
    const productsList = document.getElementById('products-list');
    const searchInput = document.getElementById('search-input');
    const priceSlider = document.getElementById('price-slider');
    const sortSelect = document.getElementById('sort-select');

    if (!productsList) return;
    productsList.innerHTML = '';

    const itemsList = currentDB[activeCategoryKey] || [];
    const query = searchInput ? searchInput.value : "";
    const maxPrice = priceSlider ? parseInt(priceSlider.value) : 300000;
    const sortType = sortSelect ? sortSelect.value : "default";

    const filteredItems = filterAndSortProducts(itemsList, query, maxPrice, sortType);

    if (filteredItems.length === 0) {
        productsList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">Ничего не найдено...</p>';
        return;
    }

    filteredItems.forEach(item => {
        const itemPrice = item.price_approx || 0;
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="card-info">
                <h4>${item.name}</h4>
                <div style="margin-top: 6px; display: flex; gap: 8px;">
                    ${item.socket ? `<span class="socket-tag" style="background: var(--accent-violet); padding: 2px 6px; border-radius: 4px; font-size: 0.8rem;">${item.socket}</span>` : ''}
                </div>
            </div>
            <div class="product-actions" style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
                <span class="product-price" style="font-weight: bold; color: var(--accent-blue); font-size: 1.2rem;">${itemPrice.toLocaleString()} ₽</span>
                <button class="select-btn" style="padding: 6px 12px; background: var(--accent-violet); border: none; color: white; border-radius: 4px; cursor: pointer;">Установить</button>
            </div>
        `;

        card.querySelector('.select-btn').addEventListener('click', () => {
            if (typeof onProductSelectGlobal === 'function') {
                onProductSelectGlobal(activeCategoryKey, item);
            }
            document.getElementById('modal').classList.add('hidden');
        });

        productsList.appendChild(card);
    });
}

export function renderSelectedComponents(currentBuild) {
    const container = document.getElementById('selected-components-list');
    if (!container) return;

    container.innerHTML = '';

    const categoryNames = {
        cpu: "Процессор", motherboard: "Материнка", cooler: "Кулер",
        ram: "Оперативка", gpu: "Видеокарта", storage: "SSD/HDD",
        psu: "Блок питания", case: "Корпус", case_fans: "Вентиляторы"
    };

    let hasItems = false;

    Object.keys(currentBuild).forEach(categoryKey => {
        const item = currentBuild[categoryKey];
        if (!item) return;

        hasItems = true;
        const card = document.createElement('div');
        card.className = 'selected-component-card';
        card.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(157, 78, 221, 0.2); padding: 8px 12px; border-radius: 6px; font-size: 0.9rem; margin-bottom: 4px; cursor: pointer; transition: background 0.2s;';
        card.title = 'Кликните, чтобы показать 3D-модель';

        card.innerHTML = `
            <div style="flex: 1; min-width: 0; padding-right: 10px;">
                <span style="color: var(--accent-blue); font-weight: bold; font-size: 0.75rem; text-transform: uppercase; display: block;">${categoryNames[categoryKey]}</span>
                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; margin: 2px 0;" title="${item.name}">${item.name}</span>
                <div style="display: flex; gap: 10px; font-size: 0.75rem; margin-top: 4px;">
                    <a href="${item.links?.dns || '#'}" target="_blank" style="color: var(--text-muted); text-decoration: none; border-bottom: 1px dashed;">DNS ↗</a>
                    <a href="${item.links?.yandex || '#'}" target="_blank" style="color: var(--text-muted); text-decoration: none; border-bottom: 1px dashed;">Яндекс ↗</a>
                    <a href="${item.links?.megamarket || '#'}" target="_blank" style="color: var(--text-muted); text-decoration: none; border-bottom: 1px dashed;">Мегамаркет ↗</a>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: bold; color: var(--accent-blue); white-space: nowrap;">${(item.price_approx || 0).toLocaleString()} ₽</span>
                <span class="delete-selected-btn" style="color: var(--accent-pink); font-size: 1.4rem; cursor: pointer; font-weight: bold; padding: 0 4px; line-height: 1;">&times;</span>
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (e.target.closest('.delete-selected-btn') || e.target.closest('a')) return;
            if (typeof onProductPreviewGlobal === 'function') {
                onProductPreviewGlobal(categoryKey, item);
            }
            document.querySelectorAll('.selected-component-card').forEach(c => {
                c.style.borderColor = 'rgba(157, 78, 221, 0.2)';
                c.style.background = 'rgba(255,255,255,0.03)';
            });
            card.style.borderColor = '#00d2ff';
            card.style.background = 'rgba(0, 210, 255, 0.05)';
        });

        card.querySelector('.delete-selected-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof onProductDeleteGlobal === 'function') {
                onProductDeleteGlobal(categoryKey);
            }
        });

        container.appendChild(card);
    });

    if (!hasItems) {
        container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 10px;">Нет выбранных деталей</p>';
    }
}