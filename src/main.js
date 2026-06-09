import * as THREE from 'three';
import { initUI } from './ui.js';

console.log("Rollup работает! Three.js успешно подключен:", THREE.REVISION);

const container = document.getElementById('canvas-container');
if (container) {
    container.innerText = "Здесь будет крутиться твой 3D-ПК!";
}

async function startApp() {
    try {
        const response = await fetch('./assets/database.json');
        const hardwareDatabase = await response.json();

        initUI(hardwareDatabase);

        console.log("Конструктор успешно запущен!");
    } catch (e) {
        console.error("Ошибка старта приложения:", e);
    }
}

startApp();
