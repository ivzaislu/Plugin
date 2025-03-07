function iptvPlugin() {
    let plugin = {};

    plugin.id = "iptv_auto";
    plugin.name = "Авто-IPTV";
    plugin.version = "1.2.0";

    // URL-адреса с бесплатными плейлистами
    let playlists = [
        "https://iptv.axenov.dev/ru.m3u",
        "https://github.com/smolnp/IPTVru/raw/main/iptv.m3u"
    ];

    // Функция загрузки и обработки плейлистов
    function fetchPlaylist(url) {
        return fetch(url)
            .then(response => response.text())
            .then(data => {
                let channels = parseM3U(data);
                saveToLampa(channels);
            })
            .catch(err => console.error("Ошибка загрузки IPTV:", err));
    }

    // Разбираем M3U плейлист
    function parseM3U(data) {
        let lines = data.split("\n");
        let channels = [];

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith("#EXTINF")) {
                let name = lines[i].split(",")[1].trim();
                let url = lines[i + 1].trim();
                channels.push({ title: name, url: url });
            }
        }
        return channels;
    }

    // Сохраняем каналы в локальное хранилище Lampa
    function saveToLampa(channels) {
        Lampa.Storage.set("iptv_channels", channels);
        console.log("Добавлено " + channels.length + " IPTV-каналов в Lampa");
    }

    // Добавляем IPTV в главное меню Lampa
    function addMenu() {
        Lampa.Listener.follow("app", function (event) {
            if (event.type === "ready") {
                let menu_item = {
                    title: "IPTV Каналы",
                    icon: "tv",
                    callback: function () {
                        openIPTVScreen();
                    }
                };

                Lampa.Menu.append(menu_item);
                console.log("Раздел 'IPTV Каналы' добавлен в меню Lampa");
            }
        });
    }

    // Функция для отображения списка IPTV-каналов
    function openIPTVScreen() {
        let channels = Lampa.Storage.get("iptv_channels", []);

        if (channels.length === 0) {
            Lampa.Noty.show("Нет доступных IPTV-каналов. Попробуйте обновить плейлист.");
            return;
        }

        let component = {
            name: "iptv_list",
            render: function () {
                let html = $('<div class="iptv-list"></div>');

                channels.forEach(channel => {
                    let item = $(`<div class="iptv-item">${channel.title}</div>`);
                    item.on("click", function () {
                        Lampa.Player.play({
                            title: channel.title,
                            url: channel.url
                        });
                    });
                    html.append(item);
                });

                return html;
            }
        };

        Lampa.Activity.push({
            title: "IPTV Каналы",
            component: component
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
