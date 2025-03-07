function iptvPlugin() {
    // Пример URL плейлиста с GitHub и Aksenov
    let playlistUrlGitHub = "https://raw.githubusercontent.com/username/repository/master/iptv.m3u";  // Замените на актуальную ссылку
    let playlistUrlAksenov = "https://aksenov.com/iptv.m3u"; // Замените на актуальную ссылку

    // Функция для добавления пункта в меню IPTV
    function addIPTVMenuOption() {
        let menu = Lampa.Menu.active();

        // Проверяем, что мы находимся в разделе IPTV
        if (menu && menu === "iptv") {
            // Проверяем, есть ли уже наш пункт в меню
            if ($("#add_iptv_playlist").length === 0) {
                // Добавляем новый пункт в меню IPTV
                $("#iptv .settings").append(`
                    <div class="settings-param selector" id="add_iptv_playlist">
                        <div class="settings-param__name">Добавить IPTV плейлист</div>
                        <div class="settings-param__descr">Добавьте плейлист с GitHub или Aksenov</div>
                    </div>
                `);

                // Добавляем обработчик нажатия на новый пункт меню
                $("#add_iptv_playlist").on("hover:enter", function() {
                    // Сохраняем ссылку на плейлист в localStorage (с GitHub или Aksenov)
                    let selectedUrl = playlistUrlGitHub; // По умолчанию выбираем GitHub
                    savePlaylistToLocalStorage(selectedUrl);
                    Lampa.Noty.show("Плейлист сохранен в localStorage.");
                });
            }
        }
    }

    // Функция для сохранения плейлиста в localStorage
    function savePlaylistToLocalStorage(url) {
        localStorage.setItem('iptvPlaylistUrl', url);
    }

    // Функция для добавления плейлиста из localStorage в IPTV
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
                    Lampa.Noty.show("Плейлист был добавлен!");
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
