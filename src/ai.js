const SERVER_IP = window.location.hostname;
const API_BASE_URL = `http://${SERVER_IP}:5000`;

export async function analyzeBuildWithAI(currentBuild) {
    const prompt = `
    Проанализируй следующую конфигурацию компьютера:
    - Процессор: ${currentBuild.cpu ? currentBuild.cpu.name : "Не выбран"}
    - Видеокарта: ${currentBuild.video_card ? currentBuild.video_card.name : "Не выбрана"}
    - Материнская плата: ${currentBuild.motherboard ? currentBuild.motherboard.name : "Не выбрана"}
    - Блок питания: ${currentBuild.power_supply ? currentBuild.power_supply.name : "Не выбран"}

    Задачи: Выяви критические ошибки совместимости. Оцени приблизительный FPS в играх Cyberpunk 2077, CS2, DOTA2 (в разрешении 1080p).
    Ответь СТРОГО в формате JSON без какого-либо лишнего текста до или после объекта:
    {
      "compatibility_errors": ["список ошибок или строка 'Нет ошибок'"],
      "perf_cyberpunk": "значение FPS (например, 60+)",
      "perf_cs2": "значение FPS (например, 140+)",
      "perf_dota2": "значение FPS (например, 140+)",
      "verdict": "вывод на русском языке (1-2 предложения)"
    }
    `;

    try {
        const response = await fetch(`${API_BASE_URL}/api/analyze`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ prompt: prompt })
        });

        if (!response.ok) throw new Error('Ошибка ответа сервера бэкенда');

        const serverData = await response.json();
        const aiRawText = serverData.generated_text;

        if (!aiRawText) throw new Error('ИИ вернул пустой текст');

        const jsonStart = aiRawText.indexOf('{');
        const jsonEnd = aiRawText.lastIndexOf('}') + 1;

        if (jsonStart === -1 || jsonEnd === 0) {
            throw new Error('Ответ ИИ не содержит валидного JSON объекта');
        }

        const cleanJsonText = aiRawText.slice(jsonStart, jsonEnd);

        try {
            return JSON.parse(cleanJsonText);
        } catch (parseError) {
            console.error("Ошибка парсинга JSON из ответа ИИ:", cleanJsonText);
            throw new Error('Не удалось распарсить структуру JSON от ИИ');
        }

    } catch (error) {
        console.error("Ошибка при запросе к бэкенду:", error);
        return {
            compatibility_errors: ["Не удалось получить анализ от ИИ"],
            perf_cyberpunk: "—",
            perf_cs2: "—",
            verdict: "Произошла ошибка при обработке данных ИИ. Проверьте, запущен ли бэкенд на порту 5000."
        };
    }
}
