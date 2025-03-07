function iptvPlugin() {
    // Пример ссылки на M3U плейлист с GitHub или аксенными ссылками
    let playlistUrl = "https://raw.githubusercontent.com/username/repository/branch/iptv_list.m3u";  // Замените на актуальный URL

    // Функция для добавления пункта в меню IPTV
    function addIPTVMenuOption() {
        // Получаем меню IPTV
        let menu = Lampa.Menu.active();
        
        // Проверяем, что мы находимся в разделе IPTV
        if (menu && menu === "iptv") {
            // Проверяем, есть ли уже наш пункт в меню
            if ($("#add_iptv_playlist").length === 0) {
                // Добавляем новый пункт в меню IPTV
                $("#iptv .settings").append(`
                    <div class="settings-param selector" id="add_iptv_playlist">
                        <div class="settings-param__name">Добавить IPTV плейлист</div>
                        <div class="settings-param__descr">Добавьте плейлист с GitHub</div>
                    </div>
                `);

                // Добавляем обработчик нажатия на новый пункт меню
                $("#add_iptv_playlist").on("hover:enter", function() {
                    savePlaylistToLocalStorage(playlistUrl); // Сохраняем ссылку в localStorage
                    Lampa.Noty.show("Плейлист сохранен в localStorage.");
                });
            }
        }
    }

    // Функция для добавления ссылки из localStorage в IPTV
    function addPlaylistToIPTV() {
        // Получаем URL из localStorage
        let storedUrl = localStorage.getItem('iptvPlaylistUrl');
        
        if (storedUrl) {
            // Здесь мы будем взаимодействовать с полем ввода и добавлять URL плейлиста
            let inputField = $(".iptv-link-input"); // Подсказка: проверьте селектор для поля ввода
            if (inputField.length) {
                // Вставляем URL плейлиста в поле ввода
                inputField.val(storedUrl);

                // Нажимаем кнопку "Добавить" (подсказка: проверьте селектор кнопки)
                let addButton = $(".iptv-add-button");
                if (addButton.length) {
                    addButton[0].click();
                    Lampa.Noty.show("Плейлист с GitHub был добавлен!");
                } else {
                    Lampa.Noty.show("Не удалось найти кнопку 'Добавить'.");
                }
            } else {
                Lampa.Noty.show("Не удалось найти поле для ввода ссылки.");
            }
        } else {
            Lampa.Noty.show("Ссылка на плейлист не найдена в localStorage.");
        }
    }

    // Отслеживаем открытие меню IPTV и добавляем пункт
    Lampa.Listener.follow('settings', function(event) {
        if (event.name === 'open') {
            addIPTVMenuOption();
        }
    });

    // Запуск функции для добавления плейлиста (например, через кнопку в интерфейсе)
    addPlaylistToIPTV();
}

// Запуск плагина
iptvPlugin();
