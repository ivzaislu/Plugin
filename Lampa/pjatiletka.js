function iptvPlugin() {
    // Ссылка на новый M3U плейлист
    let playlistUrl = "https://cub.red/iptv_list.m3u"; // Пример URL (заменить на актуальный)

    // Функция для добавления плейлиста в IPTV
    function addPlaylistToIPTV() {
        // Проверяем, открыт ли уже плагин IPTV
        let iptvSection = Lampa.Menu.active();

        // Если мы не находимся в разделе IPTV, переходим туда
        if (iptvSection && iptvSection !== "iptv") {
            Lampa.Menu.toggle("iptv"); // Открываем IPTV плагин
            setTimeout(addPlaylistToIPTV, 500); // Ждем, пока откроется меню, и повторяем попытку
            return;
        }

        // Ждем, пока откроется нужная панель в IPTV
        let addPlaylistButton = $("#iptv .settings-param__name:contains('Добавить плейлист')");

        if (addPlaylistButton.length) {
            // Кликаем по кнопке "Добавить плейлист"
            addPlaylistButton[0].click();

            setTimeout(function() {
                // После открытия окна для добавления, находим поле для ввода ссылки
                let inputField = $("#iptv .iptv-link-input");
                if (inputField.length) {
                    // Вставляем URL плейлиста
                    inputField.val(playlistUrl);

                    // Нажимаем кнопку "Добавить"
                    let addButton = $("#iptv .iptv-add-button");
                    if (addButton.length) {
                        addButton[0].click();
                        Lampa.Noty.show("Плейлист с cub.red добавлен успешно!");
                    }
                }
            }, 500);
        } else {
            console.log("Кнопка 'Добавить плейлист' не найдена, повторяем попытку...");
            setTimeout(addPlaylistToIPTV, 500); // Повторяем попытку через 500 мс
        }
    }

    // Запуск функции
    addPlaylistToIPTV();
}

// Запускаем плагин
iptvPlugin();
