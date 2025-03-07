function iptvPlugin() {
    let playlistUrl = "https://iptv.axenov.dev/ru.m3u"; // Ваша ссылка на плейлист

    function updateIPTVSettings() {
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
        console.log("Ссылка на IPTV добавлена:", playlistUrl);
        Lampa.Noty.show("Ссылка на IPTV обновлена!");

        Lampa.Listener.send('iptv', { type: 'update' });
    }

    function addIPTVSettingsButton() {
        let settingsMenu = Lampa.Settings.main();

        if (!settingsMenu.find("#update_iptv").length) {
            settingsMenu.append(`
                <div class="settings-param selector" id="update_iptv">
                    <div class="settings-param__name">Обновить IPTV</div>
                    <div class="settings-param__descr">Добавить новую ссылку на плейлист</div>
                </div>
            `);

            $("#update_iptv").on("hover:enter", updateIPTVSettings);
            console.log("Кнопка 'Обновить IPTV' добавлена в настройки");
        }
    }

    Lampa.Listener.follow('settings', function (event) {
        if (event.name === 'open') {
            addIPTVSettingsButton();
        }
    });

    updateIPTVSettings(); // Автоматически добавляем ссылку при запуске
}

iptvPlugin();
