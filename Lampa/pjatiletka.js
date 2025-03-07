function iptvPlugin() {
    let playlists = [
        "https://iptv.axenov.dev/ru.m3u",
        "https://github.com/smolnp/IPTVru/raw/main/iptv.m3u"
    ];

    function fetchAndUpdateIPTV() {
        console.log("Начинаем обновление IPTV...");
        let validPlaylist = null;

        let fetchPromises = playlists.map(url =>
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error("Ошибка загрузки: " + response.status);
                    }
                    return response.text();
                })
                .then(data => {
                    if (data.includes("#EXTM3U")) {
                        validPlaylist = url;
                    } else {
                        console.warn("Файл не похож на M3U:", url);
                    }
                })
                .catch(err => console.error("Ошибка загрузки плейлиста:", err))
        );

        Promise.all(fetchPromises).then(() => {
            if (validPlaylist) {
                console.log("Рабочий плейлист найден:", validPlaylist);
                updateIPTVSettings(validPlaylist);
            } else {
                console.error("Не удалось найти рабочий IPTV-плейлист!");
                Lampa.Noty.show("Ошибка обновления IPTV! Нет рабочих ссылок.");
            }
        });
    }

    function updateIPTVSettings(playlistUrl) {
        let iptvList = Lampa.Storage.get("iptv_list", []);

        let updated = false;
        for (let i = 0; i < iptvList.length; i++) {
            if (iptvList[i].title === "Авто-IPTV") {
                iptvList[i].url = playlistUrl;
                updated = true;
                break;
            }
        }
        if (!updated) {
            iptvList.push({ title: "Авто-IPTV", url: playlistUrl });
        }

        Lampa.Storage.set("iptv_list", iptvList);
        console.log("IPTV-список обновлён:", playlistUrl);
        Lampa.Noty.show("IPTV-список обновлён!");

        Lampa.Listener.send('iptv', { type: 'update' });
    }

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

    Lampa.Listener.follow('settings', function (event) {
        if (event.name === 'open' && event.component === 'iptv') {
            addIPTVSettingsButton();
        }
    });

    fetchAndUpdateIPTV();
}

iptvPlugin();
