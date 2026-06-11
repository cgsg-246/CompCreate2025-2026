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
    const db = await getLocalDatabase();

    if (!db) {
        return res.status(404).json({ error: 'База данных отсутствует в server/data/database.json. Запустите Python-скрипт.' });
    }

    let filtered = db[category] || [];

    if (query && query.trim() !== '') {
        const searchStr = query.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchStr));
    } else {
        filtered = filtered.slice(0, 8);
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
            console.error("HF Error Text:", errText);
            return res.status(response.status).json({ error: `Ошибка API Hugging Face: ${response.status}` });
        }

        const result = await response.json();

        let aiRawText = "";
        if (Array.isArray(result) && result[0]) {
            aiRawText = result[0].generated_text;
        } else if (result.generated_text) {
            aiRawText = result.generated_text;
        }

        res.json({ generated_text: aiRawText || "{}" });

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера при работе с нейросетью' });
    }
});


app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n==================================================`);
    console.log(`Сервер бэкенда успешно запущен!`);
    console.log(`Локальный адрес API: http://localhost:${PORT}`);
    console.log(`Ожидаемый файл БД: ${DATABASE_PATH}`);
    console.log(`==================================================\n`);
});
