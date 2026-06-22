import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    authenticate,
    generateToken,
    hashPassword,
    comparePassword,
    getUser,
    createUser,
    getUserBuilds,
    addUserBuild,
    updateUserBuild,
    deleteUserBuild
} from './auth.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const DATABASE_PATH = path.join(__dirname, 'data', 'database.json');

async function getLocalDatabase() {
    try {
        if (!fs.existsSync(DATABASE_PATH)) return null;
        const data = await fs.promises.readFile(DATABASE_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        console.error("Ошибка чтения БД:", e);
        return null;
    }
}

app.get('/api/products', async (req, res) => {
    const { category, query } = req.query;
    const db = await getLocalDatabase();
    if (!db) {
        return res.status(404).json({ error: 'База данных отсутствует' });
    }
    if (!category && !query) {
        return res.json(db);
    }
    let products = db[category] || [];
    if (query && query.trim() !== '') {
        const searchStr = query.toLowerCase().trim();
        products = products.filter(p => p.name.toLowerCase().includes(searchStr));
    } else {
        products = products.slice(0, 8);
    }
    res.json(products);
});

app.post('/api/analyze', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Промпт пуст.' });
    }

    console.log('Запуск супер-интеллектуального анализа сборки (заглушка)');

    function extractComponent(label, text) {
        const regex = new RegExp(`${label}:\\s*([^\\n]*)`);
        const match = text.match(regex);
        return match ? match[1].trim() : null;
    }

    const cpuName = extractComponent('Процессор', prompt) || 'Неизвестный процессор';
    const mbName = extractComponent('Материнская плата', prompt) || 'Неизвестная материнская плата';
    const coolerName = extractComponent('Кулер', prompt) || 'Неизвестный кулер';
    const gpuName = extractComponent('Видеокарта', prompt) || 'Неизвестная видеокарта';
    const ramName = extractComponent('Оперативная память', prompt) || 'Неизвестная ОЗУ';
    const storageName = extractComponent('Накопитель', prompt) || 'Неизвестный накопитель';
    const psuName = extractComponent('Блок питания', prompt) || 'Неизвестный БП';
    const caseName = extractComponent('Корпус', prompt) || 'Неизвестный корпус';
    const fansName = extractComponent('Вентиляторы', prompt) || 'Неизвестные вентиляторы';

    console.log(`CPU: ${cpuName}`);
    console.log(`GPU: ${gpuName}`);
    console.log(`MB: ${mbName}`);
    console.log(`RAM: ${ramName}`);
    console.log(`Storage: ${storageName}`);
    console.log(`PSU: ${psuName}`);
    console.log(`Cooler: ${coolerName}`);
    console.log(`Case: ${caseName}`);
    console.log(`Fans: ${fansName}`);

    const cpuDB = {
        'i9-14900K': { cores: 24, threads: 32, base: 3.2, boost: 6.0, tdp: 253, socket: 'LGA1700', gen: 14, score: 98, cache: 36, igpu: true },
        'i9-14900KF': { cores: 24, threads: 32, base: 3.2, boost: 6.0, tdp: 253, socket: 'LGA1700', gen: 14, score: 98, cache: 36, igpu: false },
        'i7-14700K': { cores: 20, threads: 28, base: 3.4, boost: 5.6, tdp: 253, socket: 'LGA1700', gen: 14, score: 88, cache: 33, igpu: true },
        'i7-14700KF': { cores: 20, threads: 28, base: 3.4, boost: 5.6, tdp: 253, socket: 'LGA1700', gen: 14, score: 88, cache: 33, igpu: false },
        'i5-14600K': { cores: 14, threads: 20, base: 3.5, boost: 5.3, tdp: 181, socket: 'LGA1700', gen: 14, score: 78, cache: 24, igpu: true },
        'i5-14600KF': { cores: 14, threads: 20, base: 3.5, boost: 5.3, tdp: 181, socket: 'LGA1700', gen: 14, score: 78, cache: 24, igpu: false },
        'i5-14400F': { cores: 10, threads: 16, base: 2.5, boost: 4.7, tdp: 148, socket: 'LGA1700', gen: 14, score: 64, cache: 20, igpu: false },
        'i9-13900K': { cores: 24, threads: 32, base: 3.0, boost: 5.8, tdp: 253, socket: 'LGA1700', gen: 13, score: 96, cache: 36, igpu: true },
        'i7-13700K': { cores: 16, threads: 24, base: 3.4, boost: 5.4, tdp: 253, socket: 'LGA1700', gen: 13, score: 84, cache: 30, igpu: true },
        'i5-13600K': { cores: 14, threads: 20, base: 3.5, boost: 5.1, tdp: 181, socket: 'LGA1700', gen: 13, score: 74, cache: 24, igpu: true },
        'i5-13400F': { cores: 10, threads: 16, base: 2.5, boost: 4.6, tdp: 148, socket: 'LGA1700', gen: 13, score: 60, cache: 20, igpu: false },
        'i7-12700K': { cores: 12, threads: 20, base: 3.6, boost: 5.0, tdp: 190, socket: 'LGA1700', gen: 12, score: 76, cache: 25, igpu: true },
        'i5-12600K': { cores: 10, threads: 16, base: 3.7, boost: 4.9, tdp: 150, socket: 'LGA1700', gen: 12, score: 66, cache: 20, igpu: true },
        'i5-12400F': { cores: 6, threads: 12, base: 2.5, boost: 4.4, tdp: 117, socket: 'LGA1700', gen: 12, score: 52, cache: 18, igpu: false },
        'i3-12100F': { cores: 4, threads: 8, base: 3.3, boost: 4.3, tdp: 89, socket: 'LGA1700', gen: 12, score: 40, cache: 12, igpu: false },
        'Ryzen 9 7950X': { cores: 16, threads: 32, base: 4.5, boost: 5.7, tdp: 170, socket: 'AM5', gen: 5, score: 95, cache: 80, igpu: true },
        'Ryzen 9 7900X': { cores: 12, threads: 24, base: 4.7, boost: 5.6, tdp: 170, socket: 'AM5', gen: 5, score: 85, cache: 76, igpu: true },
        'Ryzen 7 7800X3D': { cores: 8, threads: 16, base: 4.2, boost: 5.0, tdp: 120, socket: 'AM5', gen: 5, score: 90, cache: 104, igpu: true },
        'Ryzen 7 7700X': { cores: 8, threads: 16, base: 4.5, boost: 5.4, tdp: 105, socket: 'AM5', gen: 5, score: 80, cache: 40, igpu: true },
        'Ryzen 5 7600X': { cores: 6, threads: 12, base: 4.7, boost: 5.3, tdp: 105, socket: 'AM5', gen: 5, score: 70, cache: 38, igpu: true },
        'Ryzen 5 7500F': { cores: 6, threads: 12, base: 3.7, boost: 5.0, tdp: 65, socket: 'AM5', gen: 5, score: 64, cache: 38, igpu: false },
        'Ryzen 9 5950X': { cores: 16, threads: 32, base: 3.4, boost: 4.9, tdp: 105, socket: 'AM4', gen: 3, score: 92, cache: 72, igpu: false },
        'Ryzen 7 5800X3D': { cores: 8, threads: 16, base: 3.4, boost: 4.5, tdp: 105, socket: 'AM4', gen: 3, score: 82, cache: 96, igpu: false },
        'Ryzen 7 5700X': { cores: 8, threads: 16, base: 3.4, boost: 4.6, tdp: 65, socket: 'AM4', gen: 3, score: 72, cache: 36, igpu: false },
        'Ryzen 5 5600X': { cores: 6, threads: 12, base: 3.7, boost: 4.6, tdp: 65, socket: 'AM4', gen: 3, score: 58, cache: 35, igpu: false },
        'Ryzen 5 3600': { cores: 6, threads: 12, base: 3.6, boost: 4.2, tdp: 65, socket: 'AM4', gen: 2, score: 44, cache: 32, igpu: false },
    };
    const gpuDB = {
        'RTX 4090': { vram: 24, tdp: 450, score: 100, rtCores: 3, tensor: 4, bus: 'PCIe 4.0', generation: 'Ada' },
        'RTX 4080': { vram: 16, tdp: 320, score: 88, rtCores: 3, tensor: 4, bus: 'PCIe 4.0', generation: 'Ada' },
        'RTX 4070 Ti': { vram: 12, tdp: 285, score: 78, rtCores: 3, tensor: 4, bus: 'PCIe 4.0', generation: 'Ada' },
        'RTX 4070': { vram: 12, tdp: 200, score: 68, rtCores: 3, tensor: 4, bus: 'PCIe 4.0', generation: 'Ada' },
        'RTX 4060 Ti': { vram: 8, tdp: 160, score: 56, rtCores: 3, tensor: 4, bus: 'PCIe 4.0', generation: 'Ada' },
        'RTX 4060': { vram: 8, tdp: 115, score: 48, rtCores: 3, tensor: 4, bus: 'PCIe 4.0', generation: 'Ada' },
        'RTX 3090': { vram: 24, tdp: 350, score: 90, rtCores: 2, tensor: 3, bus: 'PCIe 4.0', generation: 'Ampere' },
        'RTX 3080': { vram: 10, tdp: 320, score: 82, rtCores: 2, tensor: 3, bus: 'PCIe 4.0', generation: 'Ampere' },
        'RTX 3070': { vram: 8, tdp: 220, score: 68, rtCores: 2, tensor: 3, bus: 'PCIe 4.0', generation: 'Ampere' },
        'RTX 3060 Ti': { vram: 8, tdp: 200, score: 58, rtCores: 2, tensor: 3, bus: 'PCIe 4.0', generation: 'Ampere' },
        'RTX 3060': { vram: 12, tdp: 170, score: 48, rtCores: 2, tensor: 3, bus: 'PCIe 4.0', generation: 'Ampere' },
        'RTX 3050': { vram: 8, tdp: 130, score: 34, rtCores: 1, tensor: 2, bus: 'PCIe 4.0', generation: 'Ampere' },
        'RX 7900 XTX': { vram: 24, tdp: 355, score: 92, rtCores: 0, tensor: 0, bus: 'PCIe 4.0', generation: 'RDNA 3' },
        'RX 7900 XT': { vram: 20, tdp: 315, score: 82, rtCores: 0, tensor: 0, bus: 'PCIe 4.0', generation: 'RDNA 3' },
        'RX 7800 XT': { vram: 16, tdp: 263, score: 72, rtCores: 0, tensor: 0, bus: 'PCIe 4.0', generation: 'RDNA 3' },
        'RX 7700 XT': { vram: 12, tdp: 245, score: 62, rtCores: 0, tensor: 0, bus: 'PCIe 4.0', generation: 'RDNA 3' },
        'RX 7600': { vram: 8, tdp: 165, score: 46, rtCores: 0, tensor: 0, bus: 'PCIe 4.0', generation: 'RDNA 3' },
        'RX 6900 XT': { vram: 16, tdp: 300, score: 84, rtCores: 0, tensor: 0, bus: 'PCIe 4.0', generation: 'RDNA 2' },
        'RX 6800 XT': { vram: 16, tdp: 300, score: 76, rtCores: 0, tensor: 0, bus: 'PCIe 4.0', generation: 'RDNA 2' },
        'RX 6700 XT': { vram: 12, tdp: 230, score: 60, rtCores: 0, tensor: 0, bus: 'PCIe 4.0', generation: 'RDNA 2' },
    };
    const mbDB = {
        'Z790': { socket: 'LGA1700', chipset: 'Z790', pcieGen: 5, ramSlots: 4, ramMax: 192, formFactor: 'ATX', raid: true },
        'B760': { socket: 'LGA1700', chipset: 'B760', pcieGen: 4, ramSlots: 4, ramMax: 128, formFactor: 'ATX', raid: false },
        'H610': { socket: 'LGA1700', chipset: 'H610', pcieGen: 3, ramSlots: 2, ramMax: 64, formFactor: 'Micro-ATX', raid: false },
        'Z690': { socket: 'LGA1700', chipset: 'Z690', pcieGen: 4, ramSlots: 4, ramMax: 192, formFactor: 'ATX', raid: true },
        'X670E': { socket: 'AM5', chipset: 'X670E', pcieGen: 5, ramSlots: 4, ramMax: 192, formFactor: 'ATX', raid: true },
        'B650': { socket: 'AM5', chipset: 'B650', pcieGen: 4, ramSlots: 4, ramMax: 128, formFactor: 'ATX', raid: false },
        'A620': { socket: 'AM5', chipset: 'A620', pcieGen: 3, ramSlots: 2, ramMax: 64, formFactor: 'Micro-ATX', raid: false },
        'X570': { socket: 'AM4', chipset: 'X570', pcieGen: 4, ramSlots: 4, ramMax: 128, formFactor: 'ATX', raid: true },
        'B550': { socket: 'AM4', chipset: 'B550', pcieGen: 4, ramSlots: 4, ramMax: 128, formFactor: 'ATX', raid: false },
        'A520': { socket: 'AM4', chipset: 'A520', pcieGen: 3, ramSlots: 2, ramMax: 64, formFactor: 'Micro-ATX', raid: false },
    };
    const ramDB = {
        'DDR5': { speed: 4800, voltage: 1.1, gen: 5 },
        'DDR4': { speed: 3200, voltage: 1.2, gen: 4 },
    };

    function extractPSUWatt(name) {
        const match = name.match(/(\d+)\s*W/);
        return match ? parseInt(match[1]) : null;
    }
    function extractPSUCert(name) {
        if (name.includes('Gold')) return 'Gold';
        if (name.includes('Platinum')) return 'Platinum';
        if (name.includes('Bronze')) return 'Bronze';
        return 'Unknown';
    }
    function isSSD(name) { return name.toLowerCase().includes('ssd') || name.toLowerCase().includes('nvme') || name.toLowerCase().includes('m.2'); }
    function isNVMe(name) { return name.toLowerCase().includes('nvme') || name.toLowerCase().includes('m.2'); }

    function findKeyInDB(name, db) {
        for (const key of Object.keys(db)) {
            if (name.toLowerCase().includes(key.toLowerCase())) return key;
        }
        return null;
    }
    const cpuKey = findKeyInDB(cpuName, cpuDB);
    const gpuKey = findKeyInDB(gpuName, gpuDB);
    const mbKey = findKeyInDB(mbName, mbDB);
    const ramKey = findKeyInDB(ramName, ramDB);

    const cpu = cpuKey ? cpuDB[cpuKey] : null;
    const gpu = gpuKey ? gpuDB[gpuKey] : null;
    const mb = mbKey ? mbDB[mbKey] : null;
    const ramType = ramKey || 'Неизвестная ОЗУ';
    const psuWatt = extractPSUWatt(psuName);
    const psuCert = extractPSUCert(psuName);
    const isStorageSSD = isSSD(storageName);
    const isStorageNVMe = isNVMe(storageName);

    let errors = [];
    let warnings = [];
    let suggestions = [];
    let highlights = [];

    if (cpu && mb) {
        if (cpu.socket !== mb.socket) {
            errors.push(`❌ Процессор (${cpu.socket}) и материнская плата (${mb.socket}) имеют разные сокеты! Сборка НЕСОВМЕСТИМА.`);
        } else {
            highlights.push(`✅ Процессор и материнская плата совместимы по сокету (${cpu.socket}).`);
        }
    }
    if (cpu && mb) {
        if (cpu.gen >= 14 && mb.chipset === 'H610') {
            warnings.push(`⚠️ Материнская плата H610 с процессором ${cpuKey} может не обеспечить стабильное питание.`);
        }
        if (cpu.gen >= 14 && mb.chipset === 'Z790' && cpuKey.includes('K')) {
            highlights.push(`⚡ Z790 позволяет разгонять ${cpuKey} — отличный выбор для оверклокинга.`);
        }
        if (cpu.gen >= 14 && mb.chipset === 'B760' && cpuKey.includes('K')) {
            warnings.push(`⚠️ B760 не поддерживает разгон процессора (K-серия).`);
        }
    }
    if (cpu && mb) {
        if (cpu.tdp > 200 && mb.chipset === 'H610') {
            warnings.push(`⚠️ H610 слабо подходит для процессоров с TDP > 200W.`);
        }
        if (cpu.tdp > 250 && coolerName && !coolerName.toLowerCase().includes('водян')) {
            warnings.push(`🌡️ Процессор ${cpuKey} с TDP ${cpu.tdp}W требует мощного кулера.`);
        }
    }
    if (cpu && gpu && psuWatt) {
        const totalTdp = (cpu.tdp || 0) + (gpu.tdp || 0) + 100;
        if (psuWatt < totalTdp) {
            errors.push(`❌ Блок питания ${psuWatt}W слишком слабый! Минимально требуется ${totalTdp}W.`);
        } else if (psuWatt < totalTdp * 1.2) {
            warnings.push(`⚠️ Блок питания ${psuWatt}W близок к пределу.`);
        } else {
            highlights.push(`⚡ Блок питания ${psuWatt}W имеет хороший запас.`);
        }
        if (psuCert === 'Bronze' && totalTdp > 500) {
            warnings.push(`⚠️ Для мощной сборки рекомендую БП с сертификатом Gold+.`);
        }
    }
    if (ramType === 'DDR5' && mb && mb.chipset === 'H610') {
        warnings.push(`⚠️ H610 часто не поддерживает DDR5.`);
    }
    if (ramType === 'DDR4' && mb && (mb.chipset === 'Z790' || mb.chipset === 'X670E')) {
        warnings.push(`⚠️ Современные платы (Z790/X670E) обычно работают с DDR5.`);
    }
    if (gpu && mb) {
        if (gpu.bus === 'PCIe 4.0' && mb.pcieGen < 4) {
            warnings.push(`⚠️ Видеокарта (PCIe 4.0) может работать на MB с PCIe 3.0 с потерей производительности.`);
        }
        if (gpu.tdp > 300 && psuWatt && psuWatt < 700) {
            warnings.push(`⚠️ Для RTX 4090/7900 XTX рекомендуется БП 850W+.`);
        }
    }
    if (isStorageNVMe && mb && mb.pcieGen < 4) {
        warnings.push(`⚠️ NVMe накопитель будет работать на пониженной скорости на MB с PCIe 3.0.`);
    }
    if (cpu && cpu.tdp > 150 && coolerName && !coolerName.toLowerCase().includes('водян') && !coolerName.toLowerCase().includes('noctua')) {
        warnings.push(`🌡️ Для процессора с TDP ${cpu.tdp}W рекомендуется мощный кулер.`);
    }
    if (caseName && mb) {
        if (caseName.toLowerCase().includes('mini') && mb.formFactor === 'ATX') {
            warnings.push(`📦 Корпус Mini-ITX не совместим с материнской платой ATX.`);
        }
        if (gpu && caseName && (gpu.vram >= 16) && !caseName.toLowerCase().includes('full tower')) {
            warnings.push(`📦 Для длинных видеокарт рекомендуется корпус Full Tower.`);
        }
    }

    const cpuScore = cpu ? cpu.score : 0;
    const gpuScore = gpu ? gpu.score : 0;
    const combinedScore = (cpuScore * 0.4 + gpuScore * 0.6);

    function estimateFPS(game, combinedScore, cpuScore, gpuScore) {
        const gameData = {
            'Cyberpunk 2077': { cpuWeight: 0.3, gpuWeight: 0.7, base: 0.8 },
            'CS2': { cpuWeight: 0.6, gpuWeight: 0.4, base: 1.2 },
            'DOTA 2': { cpuWeight: 0.6, gpuWeight: 0.4, base: 1.0 },
            'Valorant': { cpuWeight: 0.7, gpuWeight: 0.3, base: 1.5 },
            'Call of Duty MW3': { cpuWeight: 0.3, gpuWeight: 0.7, base: 0.7 },
            'Apex Legends': { cpuWeight: 0.5, gpuWeight: 0.5, base: 0.9 },
            'Fortnite': { cpuWeight: 0.4, gpuWeight: 0.6, base: 0.8 },
            'Red Dead Redemption 2': { cpuWeight: 0.4, gpuWeight: 0.6, base: 0.6 },
            'The Witcher 3': { cpuWeight: 0.3, gpuWeight: 0.7, base: 0.7 },
            'Minecraft (RTX)': { cpuWeight: 0.2, gpuWeight: 0.8, base: 0.5 },
            'Starfield': { cpuWeight: 0.5, gpuWeight: 0.5, base: 0.5 },
        };
        const info = gameData[game] || { cpuWeight: 0.5, gpuWeight: 0.5, base: 0.8 };
        const weightedScore = (cpuScore * info.cpuWeight + gpuScore * info.gpuWeight) * info.base;
        return Math.round(weightedScore);
    }

    const fpsData = {};
    const games = ['Cyberpunk 2077', 'CS2', 'DOTA 2', 'Valorant', 'Call of Duty MW3', 'Apex Legends', 'Fortnite', 'Red Dead Redemption 2', 'The Witcher 3', 'Minecraft (RTX)', 'Starfield'];
    games.forEach(game => {
        fpsData[game] = estimateFPS(game, combinedScore, cpuScore, gpuScore);
    });

    const introPhrases = ['🧠 Экспертный вердикт:', '🔍 Детальный анализ сборки:', '💡 Профессиональное заключение:'];
    const intro = introPhrases[Math.floor(Math.random() * introPhrases.length)];

    let verdict = '';

    if (errors.length > 0) {
        verdict = `${intro} 🛑 Сборка содержит критические ошибки! ${errors.join(' ')} `;
        if (warnings.length > 0) {
            verdict += `Также есть предупреждения: ${warnings.join(' ')} `;
        }
        verdict += `Без исправлений ПК не запустится или будет работать нестабильно.`;
    } else {
        if (combinedScore > 85) {
            verdict = `${intro} 🏆 Это топовая сборка! ${cpuKey} и ${gpuKey} — мощный тандем. `;
        } else if (combinedScore > 70) {
            verdict = `${intro} ✅ Отличная сбалансированная сборка. ${cpuKey} + ${gpuKey} — золотая середина. `;
        } else if (combinedScore > 50) {
            verdict = `${intro} 💪 Хорошая рабочая лошадка для 1080p игр. `;
        } else if (combinedScore > 30) {
            verdict = `${intro} 🖥️ Бюджетная сборка, подойдёт для офисных задач и киберспорта. `;
        } else {
            verdict = `${intro} ⚠️ Сборка слабовата для игр. Рекомендую пересмотреть выбор компонентов. `;
        }
        if (cpu && gpu) {
            const isIntel = cpuKey.includes('i');
            const brand = isIntel ? 'Intel' : 'AMD';
            verdict += `${brand} ${cpuKey} с ${gpuKey} — `;
            if (cpuScore > 80 && gpuScore > 80) {
                verdict += `идеальное сочетание для энтузиастов. `;
            } else if (cpuScore > 70 && gpuScore > 70) {
                verdict += `отличный баланс для долгосрочной работы. `;
            } else if (cpuScore < 50 && gpuScore > 80) {
                verdict += `⚠️ процессор слабоват для такой видеокарты, возможен боттлнек. `;
            } else if (cpuScore > 80 && gpuScore < 40) {
                verdict += `⚠️ видеокарта слишком слабая для такого процессора. `;
            } else {
                verdict += `сбалансировано для большинства задач. `;
            }
        }
        verdict += `\n🎮 Прогноз FPS (1080p, высокие настройки):\n`;
        const topGames = ['Cyberpunk 2077', 'CS2', 'DOTA 2', 'Valorant', 'Call of Duty MW3'];
        topGames.forEach(game => {
            const fps = fpsData[game] || 0;
            let emoji = fps > 200 ? '🚀' : fps > 144 ? '🔥' : fps > 90 ? '✅' : fps > 60 ? '👍' : '⚠️';
            verdict += `  ${emoji} ${game}: ${fps} FPS\n`;
        });
        verdict += `  ... остальные игры также будут комфортны при FPS > 60.`;
        if (warnings.length > 0) {
            verdict += `\n\n⚠️ Важные замечания: ${warnings.join(' ')}`;
        }
        if (suggestions.length > 0) {
            verdict += `\n\n💡 Рекомендации: ${suggestions.join(' ')}`;
        }
        const upgradeTips = [
            `\n\n💡 Если бюджет позволяет, рассмотрите замену ${gpuScore < 50 ? 'видеокарты' : 'процессора'}.`,
            `\n\n💡 Для снижения шума можно поставить более тихие вентиляторы или СВО.`,
            `\n\n💡 Убедитесь, что оперативная память работает в двухканальном режиме.`,
            `\n\n💡 Не забудьте обновить BIOS материнской платы.`,
        ];
        verdict += upgradeTips[Math.floor(Math.random() * upgradeTips.length)];
        const finalPhrases = [
            ' В целом, сборка имеет право на жизнь и принесёт много удовольствия! 🎉',
            ' Отличный выбор для геймера и профессионала! 💪',
            ' Эта система прослужит вам долгие годы. 🚀',
        ];
        verdict += finalPhrases[Math.floor(Math.random() * finalPhrases.length)];
    }

    const responseData = {
        compatibility_errors: errors,
        perf_cyberpunk: `${fpsData['Cyberpunk 2077'] || '—'} FPS`,
        perf_cs2: `${fpsData['CS2'] || '—'} FPS`,
        perf_dota2: `${fpsData['DOTA 2'] || '—'} FPS`,
        verdict: verdict,
    };

    console.log('Генерация супер-ответа завершена');
    res.json({ generated_text: JSON.stringify(responseData) });
});

app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email и пароль обязательны' });
    }
    try {
        const hashed = await hashPassword(password);
        createUser(email, hashed);
        const token = generateToken(email);
        res.json({ token, email });
    } catch (err) {
        res.status(409).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email и пароль обязательны' });
    }
    const user = getUser(email);
    if (!user) {
        return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
        return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    const token = generateToken(email);
    res.json({ token, email });
});

app.get('/api/builds', authenticate, (req, res) => {
    const builds = getUserBuilds(req.userEmail);
    res.json({ builds: builds || [] });
});

app.post('/api/builds', authenticate, (req, res) => {
    const { name, components } = req.body;
    if (!name || !components) {
        return res.status(400).json({ error: 'Название и компоненты обязательны' });
    }
    try {
        const newBuild = addUserBuild(req.userEmail, { name, components });
        res.json({ success: true, build: newBuild });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/builds/:id', authenticate, (req, res) => {
    const { id } = req.params;
    const { name, components } = req.body;
    try {
        const updated = updateUserBuild(req.userEmail, id, { name, components });
        res.json({ success: true, build: updated });
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

app.delete('/api/builds/:id', authenticate, (req, res) => {
    const { id } = req.params;
    try {
        deleteUserBuild(req.userEmail, id);
        res.json({ success: true });
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n==================================================`);
    console.log(`Сервер бэкенда запущен на порту ${PORT}`);
    console.log(`База комплектующих: ${DATABASE_PATH}`);
    console.log(`Файл пользователей: ${path.join(__dirname, 'data', 'users.json')}`);
    console.log(`==================================================\n`);
});