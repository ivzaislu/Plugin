function iptvPlugin() {
    let plugin = {};

    plugin.id = "iptv_auto";
    plugin.name = "Авто-IPTV";
    plugin.version = "1.0.0";

    // URL-адреса с плейлистами
    let playlists = [
        "https://iptv.axenov.dev/ru.m3u",
        "https://github.com/smolnp/IPTVru/raw/main/iptv.m3u"
    ];

    // Функция загрузки и обработки плейлиста
    function fetchPlaylist(url) {
        return fetch(url)
            .then(response => response.text())
            .then(data => {
                let channels = parseM3U(data);
                addToLampa(channels);
            })
            .catch(err => console.error("Ошибка загрузки IPTV:", err));
    }

    // Разбираем плейлист M3U
    function parseM3U(data) {
        let lines = data.split("\n");
        let channels = [];

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith("#EXTINF")) {
                let name = lines[i].split(",")[1].trim();
                let url = lines[i + 1].trim();
                channels.push({ name, url });
            }
        }
        return channels;
    }

    // Добавляем каналы в Lampa
    function addToLampa(channels) {
        Lampa.Storage.set("iptv_channels", channels);
        console.log("Добавлено " + channels.length + " каналов в Lampa");
    }

    // Функция запуска обновления
    plugin.run = function () {
        playlists.forEach(fetchPlaylist);
    };

    return plugin;
}

// Регистрируем плагин в Lampa
Lampa.Plugins.add(iptvPlugin());
