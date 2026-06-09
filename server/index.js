import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();
const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const DATABASE_PATH = path.join(process.cwd(), 'server', 'data', 'database.json');

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
    const products = await getLocalDatabase();

    if (!products) {
        return res.status(404).json({ error: 'База данных отсутствует в server/data/database.json' });
    }

    let filtered = products;
    if (category) filtered = filtered.filter(p => p.type === category);

    if (query && query.trim() !== '') {
        const searchStr = query.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchStr));
    } else {
        filtered = filtered.filter(p => p.popular);
    }
    res.json(filtered);
});

app.post('/api/analyze', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Промпт пуст.' });
    if (!process.env.HF_TOKEN) return res.status(500).json({ error: 'Нет токена HF_TOKEN на сервере.' });

    const AI_MODEL_URL = "https://huggingface.co";

    try {
        const response = await fetch(AI_MODEL_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.HF_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "tgi",
                messages: [
                    { role: "system", content: "Ты — эксперт по сборке компьютеров. Проанализируй конфигурацию комплектующих и ответь строго в формате JSON." },
                    { role: "user", content: prompt }
                ],
                parameters: { max_new_tokens: 500, temperature: 0.3 }
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            return res.status(response.status).json({ error: errData.error || 'Ошибка ИИ' });
        }

        const result = await response.json();
        let aiRawText = result.choices?.[0]?.message?.content || result.generated_text;

        res.json({ generated_text: aiRawText || "Ошибка генерации текста." });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.listen(PORT, '0.0.0.0', () => console.log(`🔥 Сервер бэкенда запущен на порту ${PORT}`));
