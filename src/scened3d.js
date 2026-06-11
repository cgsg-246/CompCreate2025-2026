import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls;
const loader = new GLTFLoader();

const loadedComponents = {
    case: null,
    cpu: null,
    gpu: null,
    motherboard: null,
    power: null
};


export function init3DScene() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // Создаем 3D-сцену
    scene = new THREE.Scene();

    // Настраиваем перспективную камеру
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(3, 2, 4); // Позиция камеры: сбоку, спереди и сверху от корпуса

    // Настраиваем рендерер сглаживания WebGL
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Защита от пикселей на Retina-экранах
    renderer.shadowMap.enabled = true; // Включаем просчет теней
    container.appendChild(renderer.domElement);

    // Добавляем интерактивное управление сценой с помощью мыши
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Плавное скольжение при вращении
    controls.dampingFactor = 0.05;
    controls.maxDistance = 8;      // Ограничение отдаления камеры
    controls.minDistance = 1.8;    // Ограничение приближения камеры

    // НАСТРОЙКА НЕОНОВОГО ИГРОВОГО ОСВЕЩЕНИЯ
    const ambientLight = new THREE.AmbientLight(0x0f1126, 1.5); // Глубокий темно-синий заполняющий свет
    scene.add(ambientLight);

    const blueLight = new THREE.PointLight(0x00d2ff, 8, 15); // Голубой неон справа
    blueLight.position.set(3, 3, 2);
    scene.add(blueLight);

    const violetLight = new THREE.PointLight(0x9d4edd, 8, 15); // Фиолетовый неон слева
    violetLight.position.set(-3, 1, 2);
    scene.add(violetLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1); // Белый заполняющий свет сверху для проявления текстур
    dirLight.position.set(0, 5, 0);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // ЗАГРУЖАЕМ КОРПУС ПК ПО УМОЛЧАНИЮ
    // Если файла case.glb в папке нет, создается красивый стеклянный куб-заглушка
    loadPCComponent('case', 'assets/models/case.glb', new THREE.Vector3(0, 0, 0), () => {
        const caseGeo = new THREE.BoxGeometry(1.2, 1.6, 1.6);
        const caseMat = new THREE.MeshPhysicalMaterial({
            color: 0x121432, transparent: true, opacity: 0.2, roughness: 0.1, transmission: 0.9, thickness: 0.5
        });
        const fallbackCase = new THREE.Mesh(caseGeo, caseMat);
        scene.add(fallbackCase);
        loadedComponents.case = fallbackCase;
    });

    // ИГРОВОЙ ЦИКЛ ОБНОВЛЕНИЯ КАДРОВ (АНИМАЦИЯ)
    function animate() {
        requestAnimationFrame(animate);
        
        // Медленно и плавно вращаем корпус компьютера вокруг оси Y
        if (loadedComponents.case) loadedComponents.case.rotation.y += 0.002;
        
        // Вращаем все остальные детали синхронно с корпусом ПК
        Object.keys(loadedComponents).forEach(key => {
            if (key !== 'case' && loadedComponents[key]) {
                loadedComponents[key].rotation.y += 0.002;
            }
        });

        controls.update(); // Обновляем положение камеры на основе мыши
        renderer.render(scene, camera); // Перерисовываем 3D-кадр
    }
    animate();

    // СЛУШАТЕЛЬ РЕЗАЙЗА: Подстраиваем 3D под размеры экрана при изменении окна
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

/**
 * 2. ВНУТРЕННЯЯ ФУНКЦИЯ ДЛЯ УПРАВЛЕНИЯ ПАМЯТЬЮ И ЗАГРУЗКОЙ МОДЕЛЕЙ
 */
function loadPCComponent(category, modelPath, position, fallbackCreator) {
    
    // НАДЕЖНАЯ ОЧИСТКА ПАМЯТИ: Если деталь этой категории уже была на сцене — полностью уничтожаем её [INDEX]
    if (loadedComponents[category]) {
        scene.remove(loadedComponents[category]); // Стираем визуально со сцены [INDEX]

        // Выгружаем геометрию и материалы из видеопамяти (VRAM), чтобы сайт не лагал [INDEX]
        loadedComponents[category].traverse((child) => {
            if (child.isMesh) {
                child.geometry.dispose(); // Удаляем полигоны из памяти [INDEX]
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose(); // Удаляем текстуры и материалы [INDEX]
                }
            }
        });
        loadedComponents[category] = null; // Полностью забываем ссылку в JS [INDEX]
    }

    // Запускаем асинхронный загрузчик 3D-файлов [INDEX]
    loader.load(
        modelPath,
        (gltf) => {
            const model = gltf.scene;
            model.position.copy(position);
            
            // Заставляем все меши внутри модели отбрасывать и принимать тени [INDEX]
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            scene.add(model);
            loadedComponents[category] = model; // Сохраняем ссылку на новую модель
        },
        null,
        (error) => {
            // Если .glb файл по какой-то причине не скачался/не найден — включаем JS-заглушку [INDEX]
            console.warn(`3D файл ${modelPath} отсутствует. Включаем неоновую заглушку.`);
            fallbackCreator();
        }
    );
}


export function addComponentTo3D(category, modelName = 'default') {
    // Автоматически строим путь к файлу на основе имени детали
    const modelFile = `assets/models/${modelName}.glb`;
    
    let position = new THREE.Vector3(0, 0, 0);
    let fallbackSize = [0.1, 0.1, 0.1];
    let fallbackColor = 0x9d4edd;

    // Рассчитываем координаты размещения деталей внутри системного блока
    if (category === 'motherboard') {
        position.set(-0.3, 0.1, 0);
        fallbackSize = [0.05, 1.1, 1.1];
        fallbackColor = 0x181a3a; // Темно-текстолитовый цвет для платы
    }
    if (category === 'cpu') {
        position.set(-0.27, 0.3, 0.1);
        fallbackSize = [0.15, 0.15, 0.03];
        // Интел подсветим голубым, АМД — оранжевым [INDEX]
        fallbackColor = modelName.includes('amd') ? 0xff4500 : 0x00d2ff; 
    }
    if (category === 'gpu') {
        position.set(0, 0.1, 0.1);
        // Если видеокарта мощная (трехкулерная) — делаем блок длиннее [INDEX]
        fallbackSize = modelName === 'gpu_triple_fan' ? [1.1, 0.25, 0.25] : [0.8, 0.25, 0.25];
        fallbackColor = 0xff007f; // Розовый неон для видеокарты
    }
    if (category === 'power') {
        position.set(-0.1, -0.5, 0);
        fallbackSize = [0.45, 0.45, 0.45];
        fallbackColor = 0x222222; // Матово-черный блок питания
    }

    loadPCComponent(category, modelFile, position, () => {
        const geo = new THREE.BoxGeometry(...fallbackSize);
        const mat = new THREE.MeshStandardMaterial({
            color: fallbackColor,
            emissive: fallbackColor,
            emissiveIntensity: 0.4, 
            roughness: 0.2
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(position);
        
        scene.add(mesh);
        loadedComponents[category] = mesh; 
    });
}
