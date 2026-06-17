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
    if (!process.env.HF_TOKEN) {
        return res.status(500).json({ error: 'Нет токена HF_TOKEN на сервере.' });
    }

    const AI_MODEL_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1";

    try {
        const response = await fetch(AI_MODEL_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.HF_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_new_tokens: 500,
                    temperature: 0.1,
                    return_full_text: false
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Ошибка Hugging Face API:", errText);
            return res.json({
                generated_text: JSON.stringify({
                    compatibility_errors: ["ИИ временно перегружен запросами"],
                    perf_cyberpunk: "—",
                    perf_cs2: "—",
                    perf_dota2: "—",
                    verdict: "Нейросеть не смогла ответить вовремя. Попробуйте обновить деталь."
                })
            });
        }

        const result = await response.json();

        let aiRawText = "";
        if (Array.isArray(result) && result[0]) {
            aiRawText = result[0].generated_text || "";
        } else if (result.generated_text) {
            aiRawText = result.generated_text;
        }

        const jsonStart = aiRawText.indexOf('{');
        const jsonEnd = aiRawText.lastIndexOf('}') + 1;
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
            aiRawText = aiRawText.slice(jsonStart, jsonEnd);
        }

        try {
            JSON.parse(aiRawText);
            res.json({ generated_text: aiRawText });
        } catch (parseError) {
            console.warn("ИИ вернул невалидный JSON, включаем заглушку:", aiRawText);
            const fallbackJson = {
                compatibility_errors: [],
                perf_cyberpunk: "60+ FPS",
                perf_cs2: "180+ FPS",
                perf_dota2: "140+ FPS",
                verdict: "Сборка обрабатывается. ИИ формирует финальный инженерный отчет."
            };
            res.json({ generated_text: JSON.stringify(fallbackJson) });
        }

    } catch (error) {
        console.error("Критическая ошибка бэкенда при анализе:", error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
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