function iptvPlugin() {
    // Ссылка на M3U плейлист
    let playlistUrl = "https://cub.red/iptv_list.m3u"; // Пример URL (заменить на актуальный)

    // Функция для добавления плейлиста в IPTV
    function addPlaylistToIPTV() {
        // Проверяем, открыт ли плагин IPTV
        let iptvSection = Lampa.Menu.active();

        // Если мы не находимся в разделе IPTV, переходим туда
        if (iptvSection && iptvSection !== "iptv") {
            Lampa.Menu.toggle("iptv"); // Открываем IPTV плагин
            setTimeout(addPlaylistToIPTV, 1000); // Ждем, пока откроется меню, и повторяем попытку
            return;
        }

        // Ждем, пока откроется нужная панель в IPTV
        let addPlaylistButton = $(".settings-param__name").filter(function () {
            return $(this).text().includes("Добавить плейлист");
        });

        if (addPlaylistButton.length) {
            // Кликаем по кнопке "Добавить плейлист"
            addPlaylistButton[0].click();

            setTimeout(function () {
                // После открытия окна для добавления, находим поле для ввода ссылки
                let inputField = $(".iptv-link-input"); // Подсказка: возможно, изменится селектор
                if (inputField.length) {
                    // Вставляем URL плейлиста
                    inputField.val(playlistUrl);

                    // Нажимаем кнопку "Добавить"
                    let addButton = $(".iptv-add-button"); // Подсказка: возможно, изменится селектор
                    if (addButton.length) {
                        addButton[0].click();
                        Lampa.Noty.show("Плейлист с cub.red добавлен успешно!");
                    } else {
                        Lampa.Noty.show("Не удалось найти кнопку 'Добавить'!");
                    }
                } else {
                    Lampa.Noty.show("Не удалось найти поле для ввода ссылки!");
                }
            }, 1000); // Задержка для загрузки окна добавления
        } else {
            console.log("Кнопка 'Добавить плейлист' не найдена, повторяем попытку...");
            setTimeout(addPlaylistToIPTV, 1000); // Повторяем попытку через 1 секунду
        }
    }

    // Запуск функции
    addPlaylistToIPTV();
}

// Запуск плагина
iptvPlugin();
