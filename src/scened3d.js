window.apiInstance = null;

export function init3DScene() {
    const iframe = document.getElementById('sketchfab-viewer');
    if (!iframe) return;

    if (!window.Sketchfab) {
        console.warn("Библиотека Sketchfab еще догружается, перезапуск инициализации через 200мс...");

        if (!window.sketchfabAttempts) window.sketchfabAttempts = 0;
        window.sketchfabAttempts++;

        if (window.sketchfabAttempts < 15) {
            setTimeout(init3DScene, 200);
        } else {
            console.log("ℹВнешнее API Sketchfab задерживается. Плеер запущен в автономном режиме.");
        }
        return;
    }

    console.log("📦 Внешняя библиотека Sketchfab успешно найдена! Связываем код с плеером...");

    const client = new window.Sketchfab(iframe);

    client.init({
        success: function onSuccess(api) {
            api.start();
            window.apiInstance = api;

            api.addEventListener('viewerready', function () {
                console.log('🛸 3D-плеер Sketchfab успешно подключен и готов к управлению!');
            });
        },
        error: function onError() {
            console.error('Критическая ошибка инициализации встроенного плеера Sketchfab. Проверьте сеть.');
        }
    });
}

export function addComponentTo3D(categoryKey, sketchfabId) {
    if (!window.apiInstance) {
        console.warn("API Sketchfab еще не готово к переключению. Подождите полной загрузки плеера.");
        return;
    }

    console.log(`🔄 Команда Sketchfab: Показать [${categoryKey}], ID модели: ${sketchfabId}`);

    window.apiInstance.load(sketchfabId, {
        autostart: 1,
        preload: 1,
        ui_controls: 0,
        ui_infos: 0,
        ui_watermark: 0,
        ui_settings: 0,
        ui_help: 0
    });
}
