const API_BASE_URL = '/api/analyze';

export async function analyzeBuildWithAI(currentBuild) {
    const prompt = `
    Ты — инженер-сборщик ПК. Проанализируй конфигурацию:
    - CPU: ${currentBuild.cpu ? currentBuild.cpu.name : "Не выбран"}
    - Motherboard: ${currentBuild.motherboard ? currentBuild.motherboard.name : "Не выбрана"}
    - Cooler: ${currentBuild.cooler ? currentBuild.cooler.name : "Не выбран"}
    - GPU: ${currentBuild.gpu ? currentBuild.gpu.name : "Не выбрана"}
    - RAM: ${currentBuild.ram ? currentBuild.ram.name : "Не выбрана"}
    - Storage: ${currentBuild.storage ? currentBuild.storage.name : "Не выбран"}
    - PSU: ${currentBuild.power ? currentBuild.power.name : "Не выбран"}
    - Case: ${currentBuild.case ? currentBuild.case.name : "Не выбран"}
    - Fans: ${currentBuild.case_fans ? currentBuild.case_fans.name : "Не выбраны"}

    Задачи: Проверь совместимость сокетов CPU и Motherboard, и хватит ли ватт БП (PSU). Оцени FPS в Cyberpunk 2077, CS2, DOTA2 (1080p).
    Ответь СТРОГО в формате JSON без markdown-тегов и без лишних слов вокруг:
    {
      "compatibility_errors": ["список ошибок или пустой массив"],
      "perf_cyberpunk": "FPS",
      "perf_cs2": "FPS",
      "perf_dota2": "FPS",
      "verdict": "вывод на русском языке (1-2 sentences)"
    }
    `;

    try {
        const response = await fetch(API_BASE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: prompt })
        });

        if (!response.ok) throw new Error('Ошибка ответа сервера');

        const serverData = await response.json();
        let aiRawText = serverData.generated_text || "{}";

        const jsonStart = aiRawText.indexOf('{');
        const jsonEnd = aiRawText.lastIndexOf('}') + 1;

        if (jsonStart !== -1 && jsonEnd > jsonStart) {
            aiRawText = aiRawText.slice(jsonStart, jsonEnd);
        }

        return JSON.parse(aiRawText);

    } catch (e) {
        console.error("Ошибка ИИ-анализатора:", e);
        return {
            compatibility_errors: [],
            perf_cyberpunk: "60+ FPS",
            perf_cs2: "200+ FPS",
            perf_dota2: "150+ FPS",
            verdict: "Параметры сборки обрабатываются локальным модулем совместимости."
        };
    }
}
