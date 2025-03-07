function iptvPlugin() {
    // Ссылка на M3U плейлист
    let playlistUrl = "https://cub.red/iptv_list.m3u"; // Замените на актуальную ссылку

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
                        <div class="settings-param__descr">Добавьте плейлист с cub.red</div>
                    </div>
                `);

                // Добавляем обработчик нажатия на новый пункт меню
                $("#add_iptv_playlist").on("hover:enter", function() {
                    addPlaylistToIPTV();
                });
            }
        }
    }

    // Функция для добавления ссылки в IPTV
    function addPlaylistToIPTV() {
        // Здесь мы будем взаимодействовать с полем ввода и добавлять URL плейлиста
        let inputField = $(".iptv-link-input"); // Поиск поля для ввода ссылки (проверьте селектор)
        
        if (inputField.length) {
            // Вставляем URL плейлиста в поле ввода
            inputField.val(playlistUrl);

            // Нажимаем кнопку "Добавить" (проверьте селектор кнопки)
            let addButton = $(".iptv-add-button"); 
            if (addButton.length) {
                addButton[0].click();
                Lampa.Noty.show("Плейлист с cub.red был добавлен!");
            } else {
                Lampa.Noty.show("Не удалось найти кнопку 'Добавить'.");
            }
        } else {
            Lampa.Noty.show("Не удалось найти поле для ввода ссылки.");
        }
    }

    // Отслеживаем открытие меню IPTV и добавляем пункт
    Lampa.Listener.follow('settings', function(event) {
        if (event.name === 'open') {
            addIPTVMenuOption();
        }
    });
}

// Запуск плагина
iptvPlugin();
