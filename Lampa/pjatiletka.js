function iptvPlugin() {
    let plugin = {};

    plugin.id = "iptv_auto";
    plugin.name = "Авто-IPTV";
    plugin.version = "1.1.0";

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
                saveToLampa(channels);
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

    // Сохраняем каналы в локальное хранилище Lampa
    function saveToLampa(channels) {
        Lampa.Storage.set("iptv_channels", channels);
        console.log("Добавлено " + channels.length + " IPTV-каналов в Lampa");
    }

    // Добавляем раздел IPTV в меню Lampa
    function addMenu() {
        Lampa.Listener.follow("app", function (event) {
            if (event.type === "ready") {
                let channels = Lampa.Storage.get("iptv_channels", []);
                
                if (channels.length > 0) {
                    let menu_item = {
                        title: "IPTV Каналы",
                        icon: "tv",
                        callback: function () {
                            Lampa.Activity.push({
                                url: "",
                                title: "IPTV Каналы",
                                component: "iptv_component"
                            });
                        }
                    };

                    Lampa.Menu.append(menu_item);
                    console.log("Раздел 'IPTV Каналы' добавлен в меню Lampa");
                }
            }
        });
    }

    // Запускаем обновление IPTV
    plugin.run = function () {
        playlists.forEach(fetchPlaylist);
        addMenu();
    };

    return plugin;
}

// Регистрируем плагин в Lampa
Lampa.Plugins.add(iptvPlugin());
