function iptvPlugin() {
    let plugin = {};

    plugin.id = "auto_iptv";
    plugin.name = "Авто-IPTV";
    plugin.version = "1.4.0";

    // Список плейлистов для загрузки
    let playlists = [
        "https://iptv.axenov.dev/ru.m3u",
        "https://github.com/smolnp/IPTVru/raw/main/iptv.m3u"
    ];

    function fetchAndUpdateIPTV() {
        let validPlaylists = [];

        let fetchPromises = playlists.map(url =>
            fetch(url)
                .then(response => response.text())
                .then(data => {
                    if (data.includes("#EXTM3U")) {
                        validPlaylists.push(url);
                    }
                })
                .catch(err => console.error("Ошибка загрузки:", err))
        );

        Promise.all(fetchPromises).then(() => {
            if (validPlaylists.length > 0) {
                Lampa.Storage.set("iptv_playlist", validPlaylists[0]);
                console.log("IPTV-список обновлён:", validPlaylists[0]);
                Lampa.Noty.show("IPTV-список обновлён!");
            } else {
                console.warn("Нет рабочих IPTV-плейлистов");
                Lampa.Noty.show("Ошибка обновления IPTV!");
            }
        });
    }

    // Добавляем кнопку обновления IPTV в меню Lampa
    function addIPTVSettings() {
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
        addIPTVSettings();
        fetchAndUpdateIPTV();
    };

    return plugin;
}

Lampa.Plugins.add(iptvPlugin());
