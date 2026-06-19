import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate, generateToken, hashPassword, comparePassword, getUser, createUser, updateUserBuild } from './auth.js';

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

// ========================================================================
//  ГИГАНТСКАЯ ЗАГЛУШКА AI — ПОЛНЫЙ АНАЛИЗ СБОРКИ КАК ПРОФЕССИОНАЛЬНЫЙ ЭКСПЕРТ
// ========================================================================
app.post('/api/analyze', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Промпт пуст.' });
    }

    console.log('Запуск супер-интеллектуального анализа сборки (заглушка)');

    // 1. ИЗВЛЕЧЕНИЕ ДАННЫХ ИЗ ПРОМПТА
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

    // 2. ОГРОМНАЯ БАЗА ЗНАНИЙ
    const cpuDB = {
        'i9-14900K': { cores: 24, threads: 32, base: 3.2, boost: 6.0, tdp: 253, socket: 'LGA1700', gen: 14, score: 98, cache: 36, igpu: true },
        'i9-14900KF': { cores: 24, threads: 32, base: 3.2, boost: 6.0, tdp: 253, socket: 'LGA1700', gen: 14, score: 98, cache: 36, igpu: false },
        'i7-14700K': { cores: 20, threads: 28, base: 3.4, boost: 5.6, tdp: 253, socket: 'LGA1700', gen: 14, score: 88, cache: 33, igpu: true },
        'i7-14700KF': { cores: 20, threads: 28, base: 3.4, boost: 5.6, tdp: 253, socket: 'LGA1700', gen: 14, score: 88, cache: 33, igpu: false },
        'i5-14600K': { cores: 14, threads: 20, base: 3.5, boost: 5.3, tdp: 181, socket: 'LGA1700', gen: 14, score: 78, cache: 24, igpu: true },
        'i5-14600KF': { cores: 14, threads: 20, base: 3.5, boost: 5.3, tdp: 181, socket: 'LGA1700', gen: 14, score: 78, cache: 24, igpu: false },
        'i5-14400F': { cores: 10, threads: 16, base: 2.5, boost: 4.7, tdp: 148, socket: 'LGA1700', gen: 14, score: 64, cache: 20, igpu: false },
        // Intel 13-го поколения
        'i9-13900K': { cores: 24, threads: 32, base: 3.0, boost: 5.8, tdp: 253, socket: 'LGA1700', gen: 13, score: 96, cache: 36, igpu: true },
        'i7-13700K': { cores: 16, threads: 24, base: 3.4, boost: 5.4, tdp: 253, socket: 'LGA1700', gen: 13, score: 84, cache: 30, igpu: true },
        'i5-13600K': { cores: 14, threads: 20, base: 3.5, boost: 5.1, tdp: 181, socket: 'LGA1700', gen: 13, score: 74, cache: 24, igpu: true },
        'i5-13400F': { cores: 10, threads: 16, base: 2.5, boost: 4.6, tdp: 148, socket: 'LGA1700', gen: 13, score: 60, cache: 20, igpu: false },
        // Intel 12-го поколения
        'i7-12700K': { cores: 12, threads: 20, base: 3.6, boost: 5.0, tdp: 190, socket: 'LGA1700', gen: 12, score: 76, cache: 25, igpu: true },
        'i5-12600K': { cores: 10, threads: 16, base: 3.7, boost: 4.9, tdp: 150, socket: 'LGA1700', gen: 12, score: 66, cache: 20, igpu: true },
        'i5-12400F': { cores: 6, threads: 12, base: 2.5, boost: 4.4, tdp: 117, socket: 'LGA1700', gen: 12, score: 52, cache: 18, igpu: false },
        'i3-12100F': { cores: 4, threads: 8, base: 3.3, boost: 4.3, tdp: 89, socket: 'LGA1700', gen: 12, score: 40, cache: 12, igpu: false },
        // AMD AM5
        'Ryzen 9 7950X': { cores: 16, threads: 32, base: 4.5, boost: 5.7, tdp: 170, socket: 'AM5', gen: 5, score: 95, cache: 80, igpu: true },
        'Ryzen 9 7900X': { cores: 12, threads: 24, base: 4.7, boost: 5.6, tdp: 170, socket: 'AM5', gen: 5, score: 85, cache: 76, igpu: true },
        'Ryzen 7 7800X3D': { cores: 8, threads: 16, base: 4.2, boost: 5.0, tdp: 120, socket: 'AM5', gen: 5, score: 90, cache: 104, igpu: true },
        'Ryzen 7 7700X': { cores: 8, threads: 16, base: 4.5, boost: 5.4, tdp: 105, socket: 'AM5', gen: 5, score: 80, cache: 40, igpu: true },
        'Ryzen 5 7600X': { cores: 6, threads: 12, base: 4.7, boost: 5.3, tdp: 105, socket: 'AM5', gen: 5, score: 70, cache: 38, igpu: true },
        'Ryzen 5 7500F': { cores: 6, threads: 12, base: 3.7, boost: 5.0, tdp: 65, socket: 'AM5', gen: 5, score: 64, cache: 38, igpu: false },
        // AMD AM4
        'Ryzen 9 5950X': { cores: 16, threads: 32, base: 3.4, boost: 4.9, tdp: 105, socket: 'AM4', gen: 3, score: 92, cache: 72, igpu: false },
        'Ryzen 7 5800X3D': { cores: 8, threads: 16, base: 3.4, boost: 4.5, tdp: 105, socket: 'AM4', gen: 3, score: 82, cache: 96, igpu: false },
        'Ryzen 7 5700X': { cores: 8, threads: 16, base: 3.4, boost: 4.6, tdp: 65, socket: 'AM4', gen: 3, score: 72, cache: 36, igpu: false },
        'Ryzen 5 5600X': { cores: 6, threads: 12, base: 3.7, boost: 4.6, tdp: 65, socket: 'AM4', gen: 3, score: 58, cache: 35, igpu: false },
        'Ryzen 5 3600': { cores: 6, threads: 12, base: 3.6, boost: 4.2, tdp: 65, socket: 'AM4', gen: 2, score: 44, cache: 32, igpu: false },
    };
    // ================== GPU ==================
    const gpuDB = {
        // NVIDIA RTX 40
        'RTX 4090': { vram: 24, tdp: 450, score: 100, rtCores: 3, tensor: 4, bus: 'PCIe 4.0', generation: 'Ada' },
        'RTX 4080': { vram: 16, tdp: 320, score: 88, rtCores: 3, tensor: 4, bus: 'PCIe 4.0', generation: 'Ada' },
        'RTX 4070 Ti': { vram: 12, tdp: 285, score: 78, rtCores: 3, tensor: 4, bus: 'PCIe 4.0', generation: 'Ada' },
        'RTX 4070': { vram: 12, tdp: 200, score: 68, rtCores: 3, tensor: 4, bus: 'PCIe 4.0', generation: 'Ada' },
        'RTX 4060 Ti': { vram: 8, tdp: 160, score: 56, rtCores: 3, tensor: 4, bus: 'PCIe 4.0', generation: 'Ada' },
        'RTX 4060': { vram: 8, tdp: 115, score: 48, rtCores: 3, tensor: 4, bus: 'PCIe 4.0', generation: 'Ada' },
        // NVIDIA RTX 30
        'RTX 3090': { vram: 24, tdp: 350, score: 90, rtCores: 2, tensor: 3, bus: 'PCIe 4.0', generation: 'Ampere' },
        'RTX 3080': { vram: 10, tdp: 320, score: 82, rtCores: 2, tensor: 3, bus: 'PCIe 4.0', generation: 'Ampere' },
        'RTX 3070': { vram: 8, tdp: 220, score: 68, rtCores: 2, tensor: 3, bus: 'PCIe 4.0', generation: 'Ampere' },
        'RTX 3060 Ti': { vram: 8, tdp: 200, score: 58, rtCores: 2, tensor: 3, bus: 'PCIe 4.0', generation: 'Ampere' },
        'RTX 3060': { vram: 12, tdp: 170, score: 48, rtCores: 2, tensor: 3, bus: 'PCIe 4.0', generation: 'Ampere' },
        'RTX 3050': { vram: 8, tdp: 130, score: 34, rtCores: 1, tensor: 2, bus: 'PCIe 4.0', generation: 'Ampere' },
        // AMD Radeon RX 7000
        'RX 7900 XTX': { vram: 24, tdp: 355, score: 92, rtCores: 0, tensor: 0, bus: 'PCIe 4.0', generation: 'RDNA 3' },
        'RX 7900 XT': { vram: 20, tdp: 315, score: 82, rtCores: 0, tensor: 0, bus: 'PCIe 4.0', generation: 'RDNA 3' },
        'RX 7800 XT': { vram: 16, tdp: 263, score: 72, rtCores: 0, tensor: 0, bus: 'PCIe 4.0', generation: 'RDNA 3' },
        'RX 7700 XT': { vram: 12, tdp: 245, score: 62, rtCores: 0, tensor: 0, bus: 'PCIe 4.0', generation: 'RDNA 3' },
        'RX 7600': { vram: 8, tdp: 165, score: 46, rtCores: 0, tensor: 0, bus: 'PCIe 4.0', generation: 'RDNA 3' },
        // AMD Radeon RX 6000
        'RX 6900 XT': { vram: 16, tdp: 300, score: 84, rtCores: 0, tensor: 0, bus: 'PCIe 4.0', generation: 'RDNA 2' },
        'RX 6800 XT': { vram: 16, tdp: 300, score: 76, rtCores: 0, tensor: 0, bus: 'PCIe 4.0', generation: 'RDNA 2' },
        'RX 6700 XT': { vram: 12, tdp: 230, score: 60, rtCores: 0, tensor: 0, bus: 'PCIe 4.0', generation: 'RDNA 2' },
    };
    // ================== MB ==================
    const mbDB = {
        // Intel LGA1700
        'Z790': { socket: 'LGA1700', chipset: 'Z790', pcieGen: 5, ramSlots: 4, ramMax: 192, formFactor: 'ATX', raid: true },
        'B760': { socket: 'LGA1700', chipset: 'B760', pcieGen: 4, ramSlots: 4, ramMax: 128, formFactor: 'ATX', raid: false },
        'H610': { socket: 'LGA1700', chipset: 'H610', pcieGen: 3, ramSlots: 2, ramMax: 64, formFactor: 'Micro-ATX', raid: false },
        'Z690': { socket: 'LGA1700', chipset: 'Z690', pcieGen: 4, ramSlots: 4, ramMax: 192, formFactor: 'ATX', raid: true },
        // AMD AM5
        'X670E': { socket: 'AM5', chipset: 'X670E', pcieGen: 5, ramSlots: 4, ramMax: 192, formFactor: 'ATX', raid: true },
        'B650': { socket: 'AM5', chipset: 'B650', pcieGen: 4, ramSlots: 4, ramMax: 128, formFactor: 'ATX', raid: false },
        'A620': { socket: 'AM5', chipset: 'A620', pcieGen: 3, ramSlots: 2, ramMax: 64, formFactor: 'Micro-ATX', raid: false },
        // AMD AM4
        'X570': { socket: 'AM4', chipset: 'X570', pcieGen: 4, ramSlots: 4, ramMax: 128, formFactor: 'ATX', raid: true },
        'B550': { socket: 'AM4', chipset: 'B550', pcieGen: 4, ramSlots: 4, ramMax: 128, formFactor: 'ATX', raid: false },
        'A520': { socket: 'AM4', chipset: 'A520', pcieGen: 3, ramSlots: 2, ramMax: 64, formFactor: 'Micro-ATX', raid: false },
    };
    // ================== RAM (упрощённо) ==================
    const ramDB = {
        'DDR5': { speed: 4800, voltage: 1.1, gen: 5 },
        'DDR4': { speed: 3200, voltage: 1.2, gen: 4 },
    };
    // ================== PSU (упрощённо) ==================
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

    // ================== Storage (упрощённо) ==================
    function isSSD(name) { return name.toLowerCase().includes('ssd') || name.toLowerCase().includes('nvme') || name.toLowerCase().includes('m.2'); }
    function isNVMe(name) { return name.toLowerCase().includes('nvme') || name.toLowerCase().includes('m.2'); }

    // 3. ПОИСК КЛЮЧЕЙ В БАЗАХ
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

    // 4. ПОЛУЧАЕМ ХАРАКТЕРИСТИКИ
    const cpu = cpuKey ? cpuDB[cpuKey] : null;
    const gpu = gpuKey ? gpuDB[gpuKey] : null;
    const mb = mbKey ? mbDB[mbKey] : null;
    const ramType = ramKey || 'Неизвестная ОЗУ';
    const psuWatt = extractPSUWatt(psuName);
    const psuCert = extractPSUCert(psuName);
    const isStorageSSD = isSSD(storageName);
    const isStorageNVMe = isNVMe(storageName);

    // 5. АНАЛИЗ СОВМЕСТИМОСТИ
    let errors = [];
    let warnings = [];
    let suggestions = [];
    let highlights = [];

    // 5.1. Сокеты
    if (cpu && mb) {
        if (cpu.socket != mb.socket) {
            errors.push(`Процессор (${cpu.socket}) и материнская плата (${mb.socket}) имеют разные сокеты! Сборка НЕСОВМЕСТИМА. Невозможно установить CPU в MB.`);
        } else {
            highlights.push(`Процессор и материнская плата совместимы по сокету (${cpu.socket}).`);
        }
    }
    // 5.2. Чипсет и разгон
    if (cpu && mb) {
        if (cpu.gen >= 14 && mb.chipset === 'H610') {
            warnings.push(`Материнская плата H610 с процессором ${cpuKey} может не обеспечить стабильное питание при высоких нагрузках. Рекомендуем B760 или Z790.`);
        }
        if (cpu.gen >= 14 && mb.chipset === 'Z790' && cpuKey.includes('K')) {
            highlights.push(`Z790 позволяет разгонять ${cpuKey} — отличный выбор для оверклокинга.`);
        }
        if (cpu.gen >= 14 && mb.chipset === 'B760' && cpuKey.includes('K')) {
            warnings.push(`B760 не поддерживает разгон процессора (K-серия), но работает на штатных частотах.`);
        }
    }
    // 5.3. TDP и VRM
    if (cpu && mb) {
        if (cpu.tdp > 200 && mb.chipset === 'H610') {
            warnings.push(`H610 слабо подходит для процессоров с TDP > 200W. Рекомендуем Z690/Z790 с хорошей VRM-системой.`);
        }
        if (cpu.tdp > 250 && coolerName && !coolerName.toLowerCase().includes('водян')) {
            warnings.push(`Процессор ${cpuKey} с TDP ${cpu.tdp}W требует мощного кулера — рекомендуется 240/360 мм водянка или топовый воздушный (Noctua NH-D15).`);
        }
    }
    // 5.4. Блок питания
    if (cpu && gpu && psuWatt) {
        const totalTdp = (cpu.tdp || 0) + (gpu.tdp || 0) + 100; // +100W для остальных компонентов
        if (psuWatt < totalTdp) {
            errors.push(`Блок питания ${psuWatt}W слишком слабый! Минимально требуется ${totalTdp}W. При пиковых нагрузках возможны отключения.`);
        } else if (psuWatt < totalTdp * 1.2) {
            warnings.push(`Блок питания ${psuWatt}W близок к пределу. Рекомендуем запас 20-30% (т.е. ~${Math.round(totalTdp * 1.3)}W).`);
        } else {
            highlights.push(`Блок питания ${psuWatt}W имеет хороший запас для данной сборки.`);
        }
        if (psuCert === 'Bronze' && totalTdp > 500) {
            warnings.push(`Для мощной сборки (TDP > 500W) рекомендую блок питания с сертификатом Gold или выше для эффективности и стабильности.`);
        }
    }
    // 5.5. ОЗУ
    if (ramType === 'DDR5' && mb && mb.chipset === 'H610') {
        warnings.push(`H610 часто не поддерживает DDR5, проверьте спецификации MB.`);
    }
    if (ramType === 'DDR4' && mb && (mb.chipset === 'Z790' || mb.chipset === 'X670E')) {
        warnings.push(`Современные платы (Z790/X670E) обычно работают с DDR5, а не DDR4. Проверьте совместимость.`);
    }
    // 5.6. Видеокарта и PCIe
    if (gpu && mb) {
        if (gpu.bus === 'PCIe 4.0' && mb.pcieGen < 4) {
            warnings.push(`Видеокарта (PCIe 4.0) может работать на MB с PCIe 3.0, но потеряет часть производительности (до 5-10%).`);
        }
        if (gpu.tdp > 300 && psuWatt && psuWatt < 700) {
            warnings.push(`Для RTX 4090/7900 XTX рекомендуется БП 850W+ для избежания проблем с пиковыми нагрузками.`);
        }
    }
    // 5.7. Накопитель
    if (isStorageNVMe && mb && mb.pcieGen < 4) {
        warnings.push(`NVMe накопитель будет работать на пониженной скорости на MB с PCIe 3.0.`);
    }
    // 5.8. Кулер
    if (cpu && cpu.tdp > 150 && coolerName && !coolerName.toLowerCase().includes('водян') && !coolerName.toLowerCase().includes('noctua')) {
        warnings.push(`Для процессора с TDP ${cpu.tdp}W рекомендуется мощный воздушный кулер (Noctua, be quiet!) или СВО.`);
    }
    // 5.9. Корпус
    if (caseName && mb) {
        if (caseName.toLowerCase().includes('mini') && mb.formFactor === 'ATX') {
            warnings.push(`Корпус формата Mini-ITX не совместим с материнской платой ATX.`);
        }
        if (gpu && caseName && (gpu.vram >= 16) && !caseName.toLowerCase().includes('full tower')) {
            warnings.push(`Для длинных видеокарт (RTX 40/7900) рекомендуется корпус Full Tower с хорошим местом.`);
        }
    }

    // 6. ОЦЕНКА ПРОИЗВОДИТЕЛЬНОСТИ В ИГРАХ
    // 6.1. Вычисляем общий балл
    const cpuScore = cpu ? cpu.score : 0;
    const gpuScore = gpu ? gpu.score : 0;
    const combinedScore = (cpuScore * 0.4 + gpuScore * 0.6);

    // 6.2. Функция для расчёта FPS в игре
    function estimateFPS(game, combinedScore, cpuScore, gpuScore) {
        // Базовые множители для разных игр
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
        // С учётом разрешения: для 1080p множитель 1, для 1440p 0.7, для 4K 0.4
        // Пока только 1080p
        return Math.round(weightedScore);
    }

    const fpsData = {};
    const games = ['Cyberpunk 2077', 'CS2', 'DOTA 2', 'Valorant', 'Call of Duty MW3', 'Apex Legends', 'Fortnite', 'Red Dead Redemption 2', 'The Witcher 3', 'Minecraft (RTX)', 'Starfield'];
    games.forEach(game => {
        fpsData[game] = estimateFPS(game, combinedScore, cpuScore, gpuScore);
    });

    // 7. ГЕНЕРАЦИЯ ЖИВОГО ВЕРДИКТА
    // 7.1. Сборка фраз
    const introPhrases = [
        'Экспертный вердикт:',
        'Детальный анализ сборки:',
        'Профессиональное заключение:',
        'Оценка эксперта:',
        'Технический разбор:',
    ];
    const intro = introPhrases[Math.floor(Math.random() * introPhrases.length)];

    let verdict = '';


    // 7.2. Начинаем вердикт
    // 7.2. Начинаем вердикт
    if (errors.length > 0) {
        if (errors.length > 0) {
            verdict = `${intro} Сборка содержит критические ошибки! ${errors.join(' ')} `;
            verdict = `${intro} Сборка содержит критические ошибки! ${errors.join(' ')} `;
            if (warnings.length > 0) {
                if (warnings.length > 0) {
                    verdict += `Также есть предупреждения: ${warnings.join(' ')} `;
                }
                verdict += `Без исправлений ПК не запустится или будет работать нестабильно. Рекомендую: ${suggestions.length > 0 ? suggestions.join(' ') : 'проверить совместимость сокетов и мощность БП.'}`;
            } else {
                // 7.3. Похвала или критика
                if (combinedScore > 85) {
                    verdict = `${intro} Это топовая сборка! ${cpuKey} и ${gpuKey} — мощный тандем, который обеспечит ультра-настройки в 4K и высокий FPS. `;
                } else if (combinedScore > 70) {
                    verdict = `${intro} Отличная сбалансированная сборка. ${cpuKey} + ${gpuKey} — золотая середина для 1440p игр и стриминга. `;
                } else if (combinedScore > 50) {
                    verdict = `${intro} Хорошая рабочая лошадка для 1080p игр. ${cpuKey} и ${gpuKey} обеспечат комфортный геймплей в большинстве игр. `;
                } else if (combinedScore > 30) {
                    verdict = `${intro} 🖥️ Бюджетная сборка, подойдёт для офисных задач и киберспорта. Возможно, стоит улучшить ${gpuScore < 40 ? 'видеокарту' : 'процессор'} для современных игр. `;
                } else {
                    verdict = `${intro} Сборка слабовата для игр. Рекомендую пересмотреть выбор компонентов в пользу более производительных. `;
                }

                // 7.4. Добавляем подробности
                if (cpu && gpu) {
                    const isIntel = cpuKey.includes('i');
                    const brand = isIntel ? 'Intel' : 'AMD';
                    verdict += `${brand} ${cpuKey} с ${gpuKey} — `;
                    if (cpuScore > 80 && gpuScore > 80) {
                        verdict += `идеальное сочетание для энтузиастов. `;
                    } else if (cpuScore > 70 && gpuScore > 70) {
                        verdict += `отличный баланс для долгосрочной работы. `;
                    } else if (cpuScore < 50 && gpuScore > 80) {
                        verdict += `процессор слабоват для такой видеокарты, возможен боттлнек. `;
                    } else if (cpuScore > 80 && gpuScore < 40) {
                        verdict += `видеокарта слишком слабая для такого процессора, в играх будет упор в GPU. `;
                    } else {
                        verdict += `сбалансировано для большинства задач. `;
                    }
                }

                // 7.5. FPS в играх
                verdict += `\n🎮 Прогноз FPS (1080p, высокие настройки):\n`;
                const topGames = ['Cyberpunk 2077', 'CS2', 'DOTA 2', 'Valorant', 'Call of Duty MW3'];
                topGames.forEach(game => {
                    const fps = fpsData[game] || 0;
                    let emoji = '';
                    if (fps > 200) emoji = '🚀';
                    else if (fps > 144) emoji = '🔥';
                    else if (fps > 90) emoji = '✅';
                    else if (fps > 60) emoji = '👍';
                    else emoji = '⚠️';
                    verdict += `  ${emoji} ${game}: ${fps} FPS\n`;
                });
                verdict += `  ... остальные игры также будут комфортны при FPS > 60.`;

                // 7.6. Предупреждения и советы
                if (warnings.length > 0) {
                    verdict += `\n\n⚠️ Важные замечания: ${warnings.join(' ')}`;
                }
                if (suggestions.length > 0) {
                    verdict += `\n\n💡 Рекомендации: ${suggestions.join(' ')}`;
                }

                // 7.7. Советы по улучшению
                const upgradeTips = [
                    `\n\n💡 Если бюджет позволяет, рассмотрите замену ${gpuScore < 50 ? 'видеокарты' : 'процессора'} на модель поновее.`,
                    `\n\n💡 Для снижения шума можно поставить более тихие вентиляторы или СВО.`,
                    `\n\n💡 Убедитесь, что оперативная память работает в двухканальном режиме для лучшей производительности.`,
                    `\n\n💡 Не забудьте обновить BIOS материнской платы для стабильности.`,
                    `\n\n💡 В будущем можно добавить ещё один SSD для хранения игр.`,
                    `\n\n💡 Проверьте, что кулер правильно установлен и термопаста нанесена качественно.`,
                ];
                verdict += upgradeTips[Math.floor(Math.random() * upgradeTips.length)];

                // 7.8. Финальная фраза
                const finalPhrases = [
                    ' В целом, сборка имеет право на жизнь и принесёт много удовольствия! 🎉',
                    ' Отличный выбор для геймера и профессионала! 💪',
                    ' Эта система прослужит вам долгие годы с достойной производительностью. 🚀',
                    ' Можно смело брать — соотношение цена/качество на высоте. 👍',
                    ' Советую добавить RGB-подсветку для эстетики (опционально). 😉',
                ];
                verdict += finalPhrases[Math.floor(Math.random() * finalPhrases.length)];
            }

            // 8. ФОРМИРОВАНИЕ ОТВЕТА
            const responseData = {
                compatibility_errors: errors,
                perf_cyberpunk: `${fpsData['Cyberpunk 2077'] || '—'} FPS`,
                perf_cs2: `${fpsData['CS2'] || '—'} FPS`,
                perf_dota2: `${fpsData['DOTA 2'] || '—'} FPS`,
                verdict: verdict,
                // Дополнительно можно передать подробную статистику для будущих расширений
                debug: {
                    combinedScore: combinedScore,
                    cpuScore: cpuScore,
                    gpuScore: gpuScore,
                    fps: fpsData,
                }
            };

            console.log('✅ Генерация супер-ответа завершена');
            res.json({ generated_text: JSON.stringify(responseData) });
        }
    }
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

app.get('/api/build', authenticate, (req, res) => {
    const user = getUser(req.userEmail);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json({ build: user.build || null });
});

app.post('/api/build', authenticate, (req, res) => {
    const { build } = req.body;
    if (!build) {
        return res.status(400).json({ error: 'Нет данных сборки' });
    }
    try {
        updateUserBuild(req.userEmail, build);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/build', authenticate, (req, res) => {
    try {
        updateUserBuild(req.userEmail, null);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n==================================================`);
    console.log(`Сервер бэкенда запущен на порту ${PORT}`);
    console.log(`База комплектующих: ${DATABASE_PATH}`);
    console.log(`Файл пользователей: ${path.join(__dirname, 'data', 'users.json')}`);
    console.log(`==================================================\n`);
});