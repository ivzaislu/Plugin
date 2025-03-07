(function () {
    let playlists = JSON.parse(localStorage.getItem('my_iptv_playlists')) || [];

    function savePlaylists() {
        localStorage.setItem('my_iptv_playlists', JSON.stringify(playlists));
    }

    function openIPTVMenu() {
        let list = playlists.map((url, index) => ({
            title: "Плейлист " + (index + 1),
            subtitle: url,
            action: () => playIPTV(url)
        }));

        list.push({
            title: "➕ Добавить новый плейлист",
            action: addNewPlaylist
        });

        Lampa.Select.show({
            title: "Мой IPTV",
            items: list,
            onBack: () => {
                Lampa.Menu.show();
            }
        });
    }

    function addNewPlaylist() {
        Lampa.Settings.show({
            title: "Введите M3U-ссылку",
            input: true,
            nohide: false,
            value: "",
            onBack: openIPTVMenu,
            onSelect: (value) => {
                if (value.trim()) {
                    playlists.push(value.trim());
                    savePlaylists();
                    Lampa.Noty.show("Плейлист добавлен!");
                    openIPTVMenu();
                } else {
                    Lampa.Noty.show("Ошибка: ссылка пустая.");
                }
            }
        });
    }

    function playIPTV(url) {
        Lampa.Noty.show("Загружаем IPTV: " + url);
        // Здесь можно интегрировать плеер для воспроизведения плейлиста
    }

    Lampa.Listener.follow('app', (event) => {
        if (event.type === "ready") {
            Lampa.Menu.addItem({
                title: "Мой IPTV",
                icon: "icon iptv",
                action: openIPTVMenu
            });
        }
    });
})();
