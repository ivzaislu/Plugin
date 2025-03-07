(function() {
    const pluginUrl = 'https://raw.githubusercontent.com/ivzaislu/Plugin/main/Lampa/main.js';

    function loadPlugin(url) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        script.onload = function() {
            console.log('✅ Плагин успешно загружен:', url);
        };
        script.onerror = function() {
            console.error('❌ Ошибка при загрузке плагина:', url);
        };
        document.head.appendChild(script);
    }

    function waitForLampa() {
        if (typeof window.Lampa !== "undefined" && window.Lampa?.API) {
            console.log("✅ Lampa загружена, подключаем плагин...");
            window.Lampa.API.on('ready', function() {
                loadPlugin(pluginUrl);
            });
        } else {
            console.log("⏳ Ожидание загрузки Lampa...");
            setTimeout(waitForLampa, 1000); // Проверяем каждые 1000 мс (1 сек)
        }
    }

    waitForLampa(); // Запускаем проверку загрузки Lampa
})();
