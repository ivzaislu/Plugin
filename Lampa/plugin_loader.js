(function() {
    // URL плагина на GitHub
    const pluginUrl = 'https://raw.githubusercontent.com/ivzaislu/Plugin/main/Lampa/main.js';

    // Функция для загрузки плагина через тег <script>
    function loadPlugin(url) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;

        // После загрузки скрипта, мы можем выполнить действия
        script.onload = function() {
            console.log('Плагин успешно загружен и подключен');
        };

        // В случае ошибки загрузки
        script.onerror = function() {
            console.error('Ошибка при загрузке плагина');
        };

        // Добавляем скрипт в <head> документа
        document.head.appendChild(script);
    }

    // Инициализация плагина после того, как Lampa будет готова
    Lampa.API.on('init', function() {
        loadPlugin(pluginUrl);
    });
})();
