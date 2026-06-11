import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls;
const loader = new GLTFLoader();

const loadedComponents = {
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

export function init3DScene() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(3, 2, 4); // Идеальный ракурс три четверти

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 8;
    controls.minDistance = 1.5;

    // НЕОНОВЫЙ КИБЕРПАНК СВЕТ
    const ambientLight = new THREE.AmbientLight(0x0f1126, 1.5);
    scene.add(ambientLight);

    const blueLight = new THREE.PointLight(0x00d2ff, 8, 15); // Бирюзовый
    blueLight.position.set(3, 3, 2);
    scene.add(blueLight);

    const violetLight = new THREE.PointLight(0x9d4edd, 8, 15); // Фиолетовый
    violetLight.position.set(-3, 1, 2);
    scene.add(violetLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(0, 5, 0);
    dirLight.castShadow = true;
    scene.add(dirLight);

    loadPCComponent('case', 'assets/models/case.glb', new THREE.Vector3(0, 0, 0), () => {
        const caseGeo = new THREE.BoxGeometry(1.4, 1.8, 1.8);
        const caseMat = new THREE.MeshPhysicalMaterial({
            color: 0x121432, transparent: true, opacity: 0.15, roughness: 0.1, transmission: 0.9, thickness: 0.5
        });
        const fallbackCase = new THREE.Mesh(caseGeo, caseMat);
        scene.add(fallbackCase);
        loadedComponents.case = fallbackCase;
    });

    function animate() {
        requestAnimationFrame(animate);

        if (loadedComponents.case) loadedComponents.case.rotation.y += 0.002;

        Object.keys(loadedComponents).forEach(key => {
            if (key !== 'case' && loadedComponents[key]) {
                loadedComponents[key].rotation.y += 0.002;
            }
        });

        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}


function loadPCComponent(category, modelPath, position, fallbackCreator) {
    if (loadedComponents[category]) {
        scene.remove(loadedComponents[category]);

        loadedComponents[category].traverse((child) => {
            if (child.isMesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        loadedComponents[category] = null;
    }

    loader.load(
        modelPath,
        (gltf) => {
            const model = gltf.scene;
            model.position.copy(position);
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            scene.add(model);
            loadedComponents[category] = model;
        },
        null,
        () => {
            // Если файла .glb нет — запускаем кастомную заглушку
            fallbackCreator();
        }
    );
}

/**
 * 2. ГЛАВНАЯ ВНЕШНЯЯ ФУНКЦИЯ ДЛЯ ВЫЗОВА ОТРИСОВКИ ВСЕХ 9 ДЕТАЛЕЙ
 */
export function addComponentTo3D(category, modelName = 'default') {
    const modelFile = `assets/models/${modelName}.glb`;

    let position = new THREE.Vector3(0, 0, 0);
    let fallbackSize = [0.1, 0.1, 0.1];
    let fallbackColor = 0x9d4edd;

    // ТОЧНАЯ РАССТАНОВКА И ГЕОМЕТРИЯ ДЛЯ ВСЕХ 9 ЧАСТЕЙ ПК
    if (category === 'motherboard') {
        position.set(-0.3, 0.1, 0);
        fallbackSize = [0.05, 1.2, 1.2]; // Тонкий большой текстолит
        fallbackColor = 0x0d1124;
    }
    else if (category === 'cpu') {
        position.set(-0.27, 0.3, 0.1);
        fallbackSize = [0.15, 0.15, 0.03]; // Маленький плоский квадрат
        fallbackColor = modelName.includes('amd') ? 0xff5500 : 0x00d2ff;
    }
    else if (category === 'cooler') {
        position.set(-0.1, 0.3, 0.2);
        fallbackSize = [0.35, 0.4, 0.4]; // Массивный процессорный кулер/башня
        fallbackColor = 0x4cc9f0;
    }
    else if (category === 'ram') {
        position.set(-0.1, 0.3, 0.4);
        fallbackSize = [0.03, 0.3, 0.4]; // Высокие узкие плашки оперативной памяти
        fallbackColor = 0x7209b7;
    }
    else if (category === 'gpu') {
        position.set(0, 0.0, 0.1);
        fallbackSize = modelName === 'gpu_triple_fan' ? [1.1, 0.25, 0.25] : [0.8, 0.25, 0.25]; // Длинная видеокарта
        fallbackColor = 0xf72585; // Насыщенный розовый неон
    }
    else if (category === 'storage') {
        position.set(-0.1, -0.1, 0.4);
        fallbackSize = [0.03, 0.1, 0.25]; // Компактный SSD формата M.2
        fallbackColor = 0x3a0ca3;
    }
    else if (category === 'psu') {
        position.set(-0.1, -0.6, 0);
        fallbackSize = [0.5, 0.5, 0.5]; // Кубический блок питания внизу корпуса
        fallbackColor = 0x222222;
    }
    else if (category === 'case_fans') {
        position.set(0.5, 0.2, 0);
        fallbackSize = [0.1, 0.4, 0.4]; // Вентиляторы на передней панели корпуса
        fallbackColor = 0x00f5d4; // Яркий бирюзовый неон
    }

    // Запускаем процесс создания/загрузки
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
