(function() {
    console.log("⏳ Проверяем загрузку Lampa...");

    function loadPlugin() {
        console.log("✅ Lampa загружена! Загружаем плагин...");
        const script = document.createElement('script');
        script.src = 'https://ivzaislu.github.io/Plugin/Lampa/main.js';
        script.onload = () => console.log('✅ Плагин загружен!');
        script.onerror = () => console.error('❌ Ошибка загрузки плагина!');
        document.head.appendChild(script);
    }

    function checkLampa() {
        if (window.Lampa && window.Lampa.API) {
            loadPlugin();
        } else {
            console.log("⏳ Lampa ещё не загружена, ждём...");
            setTimeout(checkLampa, 1000);
        }
    }

    document.addEventListener("DOMContentLoaded", checkLampa);
})();
