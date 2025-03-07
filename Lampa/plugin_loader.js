(function() {
    // URL плагина на GitHub
    const pluginUrl = 'https://raw.githubusercontent.com/ivzaislu/Plugin/main/Lampa/main.js';

    // Функция для загрузки плагина
    function loadPlugin(url) {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Не удалось загрузить плагин');
                }
                return response.text();
            })
            .then(script => {
                // Создаем новый тег <script> для выполнения плагина
                const scriptElement = document.createElement('script');
                scriptElement.textContent = script;
                document.body.appendChild(scriptElement);
                console.log('Плагин успешно загружен и подключен');
            })
            .catch(error => {
                console.error('Ошибка при загрузке плагина:', error);
            });
    }

    // Инициализация плагина после того, как Lampa будет готова
    Lampa.API.on('init', function() {
        loadPlugin(pluginUrl);
    });
})();
