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

app.get('/api/products', async (req, res) => {
    const { category, query } = req.query;
    const db = await getLocalDatabase();

    if (!db) {
        return res.status(404).json({
            error: 'База данных отсутствует в server/data/database.json. Запустите Python-скрипт для генерации.'
        });
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

    console.log('Запуск AI-анализа (заглушка)');

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
        'i9-14900K': { cores: 24, tdp: 253, socket: 'LGA1700', gen: 14, score: 95 },
        'i7-14700K': { cores: 20, tdp: 253, socket: 'LGA1700', gen: 14, score: 85 },
        'i5-14600K': { cores: 14, tdp: 181, socket: 'LGA1700', gen: 14, score: 75 },
        'i5-13600K': { cores: 14, tdp: 181, socket: 'LGA1700', gen: 13, score: 73 },
        'i5-13400F': { cores: 10, tdp: 148, socket: 'LGA1700', gen: 13, score: 65 },
        'i5-12400F': { cores: 6, tdp: 117, socket: 'LGA1700', gen: 12, score: 58 },
        'i3-12100F': { cores: 4, tdp: 89, socket: 'LGA1700', gen: 12, score: 45 },
        'Ryzen 9 7950X': { cores: 16, tdp: 170, socket: 'AM5', gen: 5, score: 92 },
        'Ryzen 7 7800X3D': { cores: 8, tdp: 120, socket: 'AM5', gen: 5, score: 88 },
        'Ryzen 7 7700X': { cores: 8, tdp: 105, socket: 'AM5', gen: 5, score: 80 },
        'Ryzen 5 7600X': { cores: 6, tdp: 105, socket: 'AM5', gen: 5, score: 70 },
        'Ryzen 5 5600X': { cores: 6, tdp: 65, socket: 'AM4', gen: 4, score: 55 },
        'Ryzen 5 3600': { cores: 6, tdp: 65, socket: 'AM4', gen: 3, score: 40 },
    };
    const gpuDB = {
        'RTX 4090': { vram: 24, tdp: 450, score: 100 },
        'RTX 4080': { vram: 16, tdp: 320, score: 85 },
        'RTX 4070 Ti': { vram: 12, tdp: 285, score: 75 },
        'RTX 4070': { vram: 12, tdp: 200, score: 68 },
        'RTX 4060 Ti': { vram: 8, tdp: 160, score: 55 },
        'RTX 4060': { vram: 8, tdp: 115, score: 48 },
        'RTX 3050': { vram: 8, tdp: 130, score: 30 },
        'RTX 3060': { vram: 12, tdp: 170, score: 40 },
        'RX 7900 XTX': { vram: 24, tdp: 355, score: 90 },
        'RX 7900 XT': { vram: 20, tdp: 315, score: 80 },
        'RX 7800 XT': { vram: 16, tdp: 263, score: 70 },
        'RX 7600': { vram: 8, tdp: 165, score: 45 },
    };
    const mbDB = {
        'Z790': { socket: 'LGA1700', chipset: 'Z790', pcieGen: 5, ramSlots: 4 },
        'B760': { socket: 'LGA1700', chipset: 'B760', pcieGen: 4, ramSlots: 4 },
        'H610': { socket: 'LGA1700', chipset: 'H610', pcieGen: 3, ramSlots: 2 },
        'X670E': { socket: 'AM5', chipset: 'X670E', pcieGen: 5, ramSlots: 4 },
        'B650': { socket: 'AM5', chipset: 'B650', pcieGen: 4, ramSlots: 4 },
        'A620': { socket: 'AM5', chipset: 'A620', pcieGen: 3, ramSlots: 2 },
        'Z690': { socket: 'LGA1700', chipset: 'Z690', pcieGen: 4, ramSlots: 4 },
        'B550': { socket: 'AM4', chipset: 'B550', pcieGen: 4, ramSlots: 4 },
        'X570': { socket: 'AM4', chipset: 'X570', pcieGen: 4, ramSlots: 4 },
        'A520': { socket: 'AM4', chipset: 'A520', pcieGen: 3, ramSlots: 2 },
    };

    function findCPUKey(name) {
        for (const key of Object.keys(cpuDB)) {
            if (name.toLowerCase().includes(key.toLowerCase())) return key;
        }
        return null;
    }
    function findGPUKey(name) {
        for (const key of Object.keys(gpuDB)) {
            if (name.toLowerCase().includes(key.toLowerCase())) return key;
        }
        return null;
    }
    function findMBKey(name) {
        for (const key of Object.keys(mbDB)) {
            if (name.toLowerCase().includes(key.toLowerCase())) return key;
        }
        return null;
    }

    const cpuKey = findCPUKey(cpuName);
    const gpuKey = findGPUKey(gpuName);
    const mbKey = findMBKey(mbName);

    const cpuData = cpuKey ? cpuDB[cpuKey] : null;
    const gpuData = gpuKey ? gpuDB[gpuKey] : null;
    const mbData = mbKey ? mbDB[mbKey] : null;

    let errors = [];
    let warnings = [];

    if (cpuData && mbData) {
        if (cpuData.socket !== mbData.socket) {
            errors.push(`Процессор (${cpuData.socket}) и материнская плата (${mbData.socket}) имеют разные сокеты! Сборка несовместима.`);
        }
        if (cpuData.tdp > 200 && mbData.chipset === 'H610') {
            warnings.push('Материнская плата H610 с мощным процессором может перегреваться. Рекомендуем Z790 или B760.');
        }
        if (mbData.ramSlots < 4 && cpuData.cores >= 12) {
            warnings.push('У материнской платы только 2 слота для ОЗУ. Для мощного процессора рекомендуем 4 слота.');
        }
    }

    if (gpuData && psuName) {
        const psuWattMatch = psuName.match(/(\d+)\s*W/);
        if (psuWattMatch) {
            const psuWatt = parseInt(psuWattMatch[1]);
            const totalTdp = (cpuData?.tdp || 0) + (gpuData?.tdp || 0) + 100;
            if (psuWatt < totalTdp) {
                errors.push(`Блок питания ${psuWatt}W слишком слабый! Минимально требуется ${totalTdp}W.`);
            } else if (psuWatt < totalTdp * 1.2) {
                warnings.push(`Блок питания ${psuWatt}W близок к пределу. Рекомендуем запас 20-30%.`);
            }
        }
    }

    if (gpuData && cpuData) {
        const gpuScore = gpuData.score || 0;
        const cpuScore = cpuData.score || 0;
        if (gpuScore > 80 && cpuScore < 50) {
            errors.push(`Видеокарта (${gpuKey}) слишком мощная для процессора (${cpuKey}). Будет сильный боттлнек. Рекомендуем процессор не ниже ${cpuData.cores > 10 ? 'i7' : 'i5'}-й серии.`);
        }
        if (cpuScore > 80 && gpuScore < 30) {
            warnings.push(`Процессор мощный, а видеокарта слабая. Для игр лучше сменить видеокарту на более производительную.`);
        }
    }

    let perfCyberpunk = '—';
    let perfCS2 = '—';
    let perfDota2 = '—';

    if (gpuData && cpuData) {
        const totalScore = (gpuData.score || 0) * 0.6 + (cpuData.score || 0) * 0.4;
        if (totalScore > 85) {
            perfCyberpunk = '80-100 FPS (High)';
            perfCS2 = '300+ FPS';
            perfDota2 = '200+ FPS';
        } else if (totalScore > 70) {
            perfCyberpunk = '60-80 FPS (High)';
            perfCS2 = '240-300 FPS';
            perfDota2 = '160-200 FPS';
        } else if (totalScore > 50) {
            perfCyberpunk = '40-60 FPS (Medium)';
            perfCS2 = '180-240 FPS';
            perfDota2 = '120-160 FPS';
        } else if (totalScore > 30) {
            perfCyberpunk = '20-40 FPS (Low)';
            perfCS2 = '120-180 FPS';
            perfDota2 = '80-120 FPS';
        } else {
            perfCyberpunk = 'ниже 20 FPS';
            perfCS2 = 'ниже 120 FPS';
            perfDota2 = 'ниже 80 FPS';
        }
    }

    let verdict = '';

    const phrases = [
        'Экспертный вердикт:',
        'Мой анализ:',
        'Что я думаю:',
        'Детальный разбор:',
        'Итоговое заключение:',
    ];
    const intro = phrases[Math.floor(Math.random() * phrases.length)];

    if (errors.length > 0) {
        verdict = `${intro} К сожалению, сборка содержит критические ошибки. ${errors.join(' ')} ${warnings.join(' ')}. Исправьте их, иначе ПК не запустится или будет работать нестабильно.`;
    } else if (warnings.length > 0) {
        verdict = `${intro} Сборка в целом рабочая, но есть нюансы. ${warnings.join(' ')}. В остальном — неплохой выбор для ${cpuData?.cores > 10 ? 'тяжёлых задач' : 'игр и работы'}.`;
    } else {
        const cpuBrand = cpuKey?.includes('Ryzen') ? 'AMD' : 'Intel';
        const gpuBrand = gpuKey?.includes('RTX') ? 'NVIDIA' : gpuKey?.includes('RX') ? 'AMD' : 'неизвестного бренда';
        const goodFor = (cpuData?.score || 0) + (gpuData?.score || 0) > 120 ? 'ультра-настроек в 1440p' :
            (cpuData?.score || 0) + (gpuData?.score || 0) > 80 ? 'высоких настроек в 1080p' :
                'средних настроек в 1080p';
        verdict = `${intro} Это сбалансированная сборка на базе ${cpuKey} и ${gpuKey}. ${cpuBrand} + ${gpuBrand} — отличный тандем для ${goodFor}. `;
        if (perfCyberpunk !== '—') {
            verdict += `В киберспортивных играх вы получите ${perfCS2}, в Dota 2 — ${perfDota2}. Для Cyberpunk 2077 готовьтесь к ${perfCyberpunk}. `;
        }
        if (cpuData && cpuData.cores >= 12) {
            verdict += `Мощный многопоточный процессор пригодится для стриминга и рендеринга. `;
        }
        if (gpuData && gpuData.vram >= 16) {
            verdict += `16+ ГБ видеопамяти — запас на будущее. `;
        }
        verdict += `В целом, сборка достойна уважения. Не забудьте про качественный кулер и достаточную вентиляцию корпуса.`;
    }

    const tips = [
        '💡 Совет: Для улучшения охлаждения добавьте дополнительный вентилятор на выдув.',
        '💡 Совет: Убедитесь, что блок питания имеет сертификат 80+ Gold для стабильности.',
        '💡 Совет: Если планируете разгон, выберите материнскую плату с мощной VRM-системой.',
        '💡 Совет: Для быстрой загрузки используйте NVMe SSD, а не SATA.',
        '💡 Совет: Проверьте, чтобы оперативная память работала в двухканальном режиме.',
        '💡 Совет: Если бюджет позволяет, возьмите кулер с большим радиатором для тишины.',
    ];
    verdict += `\n\n${tips[Math.floor(Math.random() * tips.length)]}`;

    const responseData = {
        compatibility_errors: errors,
        perf_cyberpunk: perfCyberpunk,
        perf_cs2: perfCS2,
        perf_dota2: perfDota2,
        verdict: verdict
    };

    console.log('Ответ сгенерирован (заглушка)');
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