function iptvPlugin() {
    let plugin = {};

    plugin.id = "auto_iptv";
    plugin.name = "Авто-IPTV";
    plugin.version = "1.8.0";

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
        let iptvSettings = Lampa.Storage.get("iptv_list", []);

        // Проверяем, есть ли уже наш плейлист
        let updated = false;
        for (let i = 0; i < iptvSettings.length; i++) {
            if (iptvSettings[i].title === "Авто-IPTV") {
                iptvSettings[i].url = playlistUrl;
                updated = true;
                break;
            }
        }
        if (!updated) {
            iptvSettings.push({ title: "Авто-IPTV", url: playlistUrl });
        }

        Lampa.Storage.set("iptv_list", iptvSettings);
        console.log("IPTV-список обновлён:", playlistUrl);
        Lampa.Noty.show("IPTV-список обновлён!");

        // Обновляем встроенный IPTV в Lampa
        Lampa.Listener.send('iptv', { type: 'update' });
    }

    // Добавляем кнопку "Обновить IPTV" в настройки IPTV
    function addIPTVSettingsButton() {
        let settingsPage = Lampa.Settings.main().find('[data-component="iptv"]');
        if (!settingsPage.find("#update_iptv").length) {
            settingsPage.append(`
                <div class="settings-param selector" id="update_iptv">
                    <div class="settings-param__name">Обновить IPTV</div>
                    <div class="settings-param__descr">Загрузить новый список каналов</div>
                </div>
            `);

            $("#update_iptv").on("hover:enter", fetchAndUpdateIPTV);
            console.log("Кнопка 'Обновить IPTV' добавлена в настройки IPTV");
        }
    }

    plugin.run = function () {
        // Следим за открытием настроек IPTV и добавляем кнопку
        Lampa.Listener.follow('settings', function (event) {
            if (event.name === 'open' && event.component === 'iptv') {
                addIPTVSettingsButton();
            }
        });

        fetchAndUpdateIPTV(); // Автообновление при запуске плагина
    };

    return plugin;
}

// Добавляем плагин в Lampa, но НЕ отображаем его в списке плагинов
Lampa.Plugins.add(iptvPlugin());
