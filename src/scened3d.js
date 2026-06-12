/**
 * Инициализация сцены (Временно выводим текст-заглушку вместо iframe)
 */
export function init3DScene() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // Очищаем контейнер от тега iframe
    container.innerHTML = `
        <div id="fallback-3d-text" style="text-align: center; font-size: 1.1rem; color: var(--accent-blue); text-shadow: 0 0 10px rgba(0, 210, 255, 0.3); padding: 20px;">
            🖥️ Стенд виртуальной сборки ПК готов.<br>
            <span style="font-size: 0.85rem; color: var(--text-muted);">Выбирайте компоненты в меню слева</span>
        </div>
    `;
    console.log("ℹ️ Sketchfab временно отключен. Включен режим адаптивного 2D/3D плейсхолдера.");
}

/**
 * Динамическое обновление текста по центру при установке детали
 */
export function addComponentTo3D(categoryKey, sketchfabId) {
    const textEl = document.getElementById('fallback-3d-text');
    if (!textEl) return;

    const categoryNames = {
        cpu: "Процессор", motherboard: "Материнская плата", cooler: "Кулер",
        ram: "Оперативная память", gpu: "Видеокарта", storage: "Накопитель",
        psu: "Блок питания", case: "Корпус", case_fans: "Вентиляторы"
    };

    // Если деталь сбросили (удалили крестиком)
    if (sketchfabId === "bbb6fd2b16614f319a65af99a4338d77" || !sketchfabId) {
        textEl.innerHTML = `
            🖥️ Компонент извлечен из корпуса.<br>
            <span style="font-size: 0.85rem; color: var(--text-muted);">Сборка обновлена</span>
        `;
        return;
    }

    // Выводим неоновый статус по центру экрана
    textEl.innerHTML = `
        <div style="animation: pulse 1.5s infinite alternate;">
             Установлен компонент: <b style="color: var(--accent-pink);">${categoryNames[categoryKey]}</b><br>
            <span style="font-size: 0.85rem; color: var(--text-main); opacity: 0.8;">Загружен виртуальный ID: ${sketchfabId}</span>
        </div>
    `;
}
