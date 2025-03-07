function iptvPlugin() {
    let plugin = {};

    plugin.id = "auto_iptv";
    plugin.name = "Авто-IPTV";
    plugin.version = "1.5.0";

    // Список бесплатных плейлистов
    let playlists = [
        "https://iptv.axenov.dev/ru.m3u",
        "https://github.com/smolnp/IPTVru/raw/main/iptv.m3u"
    ];

    // Загружаем плейлист и обновляем настройки IPTV
    function fetchAndUpdateIPTV() {
        let validPlaylist = null;

        let fetchPromises = playlists.map(url =>
            fetch(url)
                .then(response => response.text())
                .then(data => {
                    if (data.includes("#EXTM3U")) {
                        validPlaylist = url;
                    }
                })
                .catch(err => console.error("Ошибка загрузки:", err))
        );

        Promise.all(fetchPromises).then(() => {
            if (validPlaylist) {
                updateIPTVSettings(validPlaylist);
            } else {
                console.warn("Нет рабочих IPTV-плейлистов");
                Lampa.Noty.show("Ошибка обновления IPTV!");
            }
        });
    }

    // Функция обновления настроек IPTV в Lampa
    function updateIPTVSettings(playlistUrl) {
        let userSettings = Lampa.Storage.get("iptv_settings", {});

        userSettings.playlist = playlistUrl; // Записываем новый плейлист
        Lampa.Storage.set("iptv_settings", userSettings); // Сохраняем изменения

        console.log("IPTV-список обновлён:", playlistUrl);
        Lampa.Noty.show("IPTV-список обновлён!");

        // Принудительно перезагружаем IPTV, чтобы он взял новый список
        Lampa.Listener.send('iptv', { type: 'update' });
    }

    // Добавляем кнопку "Обновить IPTV" в настройки Lampa
    function addIPTVSettingsButton() {
        Lampa.Settings.addParam({
            component: "iptv",
            param: {
                name: "Обновить IPTV",
                type: "button",
                onclick: fetchAndUpdateIPTV
            }
        });

        console.log("Кнопка 'Обновить IPTV' добавлена в настройки");
    }

    plugin.run = function () {
        addIPTVSettingsButton();
        fetchAndUpdateIPTV(); // Автообновление при запуске плагина
    };

    return plugin;
}

Lampa.Plugins.add(iptvPlugin());
