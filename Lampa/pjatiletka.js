(function () {
    function log(message) {
        console.log("[IPTV Plugin] " + message);
    }

    let playlists = JSON.parse(localStorage.getItem('my_iptv_playlists') || "[]");

    function savePlaylists() {
        localStorage.setItem('my_iptv_playlists', JSON.stringify(playlists));
        log("Плейлисты сохранены.");
    }

    function openIPTVMenu() {
        let list = playlists.map((url, index) => ({
            title: "📺 Плейлист " + (index + 1),
            subtitle: url,
            action: () => playIPTV(url),
            remove: () => removePlaylist(index)
        }));

        list.push({
            title: "➕ Добавить новый плейлист",
            action: addNewPlaylist
        });

        Lampa.Select.show({
            title: "Мой IPTV",
            items: list,
            onBack: () => Lampa.Menu.show()
        });
    }

    function addNewPlaylist() {
        Lampa.Settings.show({
            title: "Введите M3U-ссылку",
            input: true,
            value: "",
            onBack: openIPTVMenu,
            onSelect: (value) => {
                if (value.trim()) {
                    playlists.push(value.trim());
                    savePlaylists();
                    Lampa.Noty.show("✅ Плейлист добавлен!");
                    openIPTVMenu();
                } else {
                    Lampa.Noty.show("⚠️ Ошибка: ссылка пустая.");
                }
            }
        });
    }

    function removePlaylist(index) {
        playlists.splice(index, 1);
        savePlaylists();
        Lampa.Noty.show("🗑️ Плейлист удалён.");
        openIPTVMenu();
    }

    function playIPTV(url) {
        Lampa.Noty.show("🎬 Открываем через VLC: " + url);

        let vlcIntent = {
            action: "android.intent.action.VIEW",
            data: url,
            type: "video/x-mpegurl",
            package: "org.videolan.vlc"
        };

        if (Lampa.Utils && Lampa.Utils.openIntent) {
            try {
                Lampa.Utils.openIntent(vlcIntent);
                log("✅ Поток отправлен в VLC.");
            } catch (e) {
                Lampa.Noty.show("❌ Ошибка: VLC не найден!");
                log("Ошибка VLC: " + e.message);
            }
        } else {
            Lampa.Noty.show("⚠️ Ошибка: Lampa.Utils не поддерживает openIntent.");
        }
    }

    Lampa.Listener.follow('app', (event) => {
        if (event.type === "ready") {
            log("Lampa загружена, добавляем меню.");
            Lampa.Menu.addItem({
                title: "📺 Мой IPTV",
                icon: "icon iptv",
                action: openIPTVMenu
            });
        }
    });

    log("IPTV-плагин загружен.");
})();
