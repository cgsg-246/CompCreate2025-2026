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

    const YANDEX_API_KEY = process.env.YANDEX_API_KEY;
    if (!YANDEX_API_KEY) {
        console.error('YANDEX_API_KEY не найден');
        return res.status(500).json({ error: 'Не настроен AI-ключ.' });
    }

    const FOLDER_ID = process.env.YANDEX_FOLDER_ID;
    if (!FOLDER_ID) {
        console.error('YANDEX_FOLDER_ID не найден');
        return res.status(500).json({ error: 'Не настроен folder_id.' });
    }

    try {
        const response = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Api-Key ${YANDEX_API_KEY}`
            },
            body: JSON.stringify({
                modelUri: `gpt://${FOLDER_ID}/yandexgpt-lite`, // бесплатная модель
                completionOptions: {
                    stream: false,
                    temperature: 0.1,
                    maxTokens: 500
                },
                messages: [
                    { role: 'system', text: 'Ты — опытный компьютерный мастер и техно-блогер. Отвечай строго по инструкции.' },
                    { role: 'user', text: prompt }
                ]
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Ошибка Yandex GPT:', errText);
            return res.json({
                generated_text: JSON.stringify({
                    compatibility_errors: [],
                    perf_cyberpunk: "60+ FPS",
                    perf_cs2: "180+ FPS",
                    perf_dota2: "140+ FPS",
                    verdict: "AI временно недоступен."
                })
            });
        }

        const data = await response.json();
        let aiRawText = data.result?.alternatives?.[0]?.message?.text || "{}";

        const jsonStart = aiRawText.indexOf('{');
        const jsonEnd = aiRawText.lastIndexOf('}') + 1;
        let cleanJson = "{}";
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
            cleanJson = aiRawText.slice(jsonStart, jsonEnd);
        }

        try { JSON.parse(cleanJson); } catch (_) {
            cleanJson = JSON.stringify({
                compatibility_errors: [],
                perf_cyberpunk: "60+ FPS",
                perf_cs2: "180+ FPS",
                perf_dota2: "140+ FPS",
                verdict: "AI ответил в нестандартном формате."
            });
        }

        res.json({ generated_text: cleanJson });

    } catch (error) {
        console.error('Ошибка Yandex GPT:', error);
        res.json({
            generated_text: JSON.stringify({
                compatibility_errors: [],
                perf_cyberpunk: "60+ FPS",
                perf_cs2: "180+ FPS",
                perf_dota2: "140+ FPS",
                verdict: "Заглушка. Сервер работает, но AI не отвечает."
            })
        });
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