(function () {
    console.log("⏳ Ждём загрузку Lampa...");

    function loadPlugin() {
        console.log("✅ Lampa загружена! Подключаем плагин...");
        const script = document.createElement("script");
        script.src = "https://ivzaislu.github.io/Plugin/Lampa/main.js";
        script.onload = () => console.log("✅ Плагин загружен!");
        script.onerror = () => console.error("❌ Ошибка загрузки плагина!");
        document.head.appendChild(script);
    }

    function checkLampa() {
        if (typeof window.Lampa !== "undefined" && window.Lampa?.API) {
            loadPlugin();
        }
    }

    const observer = new MutationObserver(() => {
        console.log("🔍 Изменение в `window`");
        checkLampa();
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    checkLampa();
})();

let checkInterval = setInterval(() => {
    console.log("🔍 Проверяем Lampa:", window.Lampa);
    if (typeof window.Lampa !== "undefined" && window.Lampa?.API) {
        clearInterval(checkInterval);
        console.log("✅ Lampa загружена!");
    }
}, 1000);
