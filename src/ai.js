const SERVER_IP = window.location.hostname;
const API_BASE_URL = `http://${SERVER_IP}:5000`;

export async function analyzeBuildWithAI(currentBuild) {
    const prompt = `
    Проанализируй следующую конфигурацию компьютера из 9 компонентов:
    - Процессор (CPU): ${currentBuild.cpu ? currentBuild.cpu.name : "Не выбран"}
    - Материнская плата (Motherboard): ${currentBuild.motherboard ? currentBuild.motherboard.name : "Не выбрана"}
    - Кулер процессора (Cooler): ${currentBuild.cooler ? currentBuild.cooler.name : "Не выбран"}
    - Видеокарта (GPU): ${currentBuild.gpu ? currentBuild.gpu.name : "Не выбрана"}
    - Оперативная память (RAM): ${currentBuild.ram ? currentBuild.ram.name : "Не выбрана"}
    - Накопитель (Storage): ${currentBuild.storage ? currentBuild.storage.name : "Не выбран"}
    - Блок питания (PSU): ${currentBuild.power ? currentBuild.power.name : "Не выбран"}
    - Корпус (Case): ${currentBuild.case ? currentBuild.case.name : "Не выбран"}
    - Корпусные вентиляторы (Fans): ${currentBuild.case_fans ? currentBuild.case_fans.name : "Не выбраны"}

    Задачи: 
    1. Проверить совместимость сокетов CPU и Motherboard (если выбраны).
    2. Проверить, хватает ли ватт БП (PSU) под выбранные CPU и GPU.
    3. Оцени приблизительный FPS в играх Cyberpunk 2077, CS2, DOTA2 (в разрешении 1080p).
    
    Ответь СТРОГО в формате JSON без какого-либо лишнего текста до или после объекта. Не пиши "Вот ваш JSON" или Markdown-разметку \`\`\`json. Только чистый объект:
    {
      "compatibility_errors": ["список ошибок через запятую или пустой массив если всё хорошо"],
      "perf_cyberpunk": "значение FPS (например, 60+ FPS)",
      "perf_cs2": "значение FPS (например, 240+ FPS)",
      "perf_dota2": "значение FPS (например, 180+ FPS)",
      "verdict": "короткий инженерный вывод на русском языке (1-2 предложения)"
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

        return JSON.parse(cleanJsonText);

    } catch (e) {
        console.error("Ошибка ИИ-анализатора на фронтенде:", e);
        return {
            compatibility_errors: ["Не удалось связаться с сервером ИИ"],
            perf_cyberpunk: "—",
            perf_cs2: "—",
            perf_dota2: "—",
            verdict: "Ошибка сети или неверный токен в файле .env бэкенда."
        };
    }
}
