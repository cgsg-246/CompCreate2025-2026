app.post('/api/analyze', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Промпт пуст.' });
    }

    const YANDEX_API_KEY = process.env.YANDEX_API_KEY;
    if (!YANDEX_API_KEY) {
        console.error('❌ YANDEX_API_KEY не найден');
        return res.status(500).json({ error: 'Не настроен AI-ключ.' });
    }

    const FOLDER_ID = process.env.YANDEX_FOLDER_ID;
    if (!FOLDER_ID) {
        console.error('❌ YANDEX_FOLDER_ID не найден');
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