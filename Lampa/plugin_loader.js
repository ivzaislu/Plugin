(function () {
    console.log("⏳ Проверяем загрузку Lampa...");

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
        } else {
            console.log("⏳ Lampa ещё не готова, ждём...");
            setTimeout(checkLampa, 1000);
        }
    }

    if (document.readyState === "complete") {
        checkLampa();
    } else {
        window.addEventListener("load", checkLampa);
    }
})();
