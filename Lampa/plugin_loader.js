(function() {
    const pluginUrl = 'https://raw.githubusercontent.com/ivzaislu/Plugin/main/Lampa/main.js';

    function loadPlugin(url) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        script.onload = function() {
            console.log('Плагин успешно загружен и подключен:', url);
        };
        script.onerror = function() {
            console.error('Ошибка при загрузке плагина:', url);
        };
        document.head.appendChild(script);
    }

    function waitForLampa() {
        if (typeof Lampa !== "undefined" && Lampa.API && typeof Lampa.API.on === "function") {
            console.log("Lampa загружена, подключаем плагин...");
            Lampa.API.on('init', function() {
                loadPlugin(pluginUrl);
            });
        } else {
            console.log("Ожидание загрузки Lampa...");
            setTimeout(waitForLampa, 500); // Повторяем каждые 500 мс, пока Lampa не загрузится
        }
    }

    waitForLampa(); // Запускаем проверку загрузки Lampa
})();
