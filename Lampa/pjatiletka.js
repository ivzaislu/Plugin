function manualIPTVPlugin() {
    function addIPTVMenuOption() {
        let menu = Lampa.Menu.active();

        if (menu && menu === "iptv") {
            if ($("#manual_iptv_playlist").length === 0) {
                $("#iptv .settings").append(`
                    <div class="settings-param selector" id="manual_iptv_playlist">
                        <div class="settings-param__name">Добавить IPTV-плейлист вручную</div>
                        <div class="settings-param__descr">Введите ссылку на M3U</div>
                    </div>
                `);

                $("#manual_iptv_playlist").on("hover:enter", function() {
                    Lampa.Settings.show({
                        title: "Введите ссылку",
                        input: true,
                        nohide: false,
                        value: "",
                        onBack: () => {
                            Lampa.Settings.back();
                        },
                        onSelect: (value) => {
                            if (value.trim() !== "") {
                                localStorage.setItem('iptvPlaylistUrl', value.trim());
                                Lampa.Noty.show("Ссылка сохранена!");
                            } else {
                                Lampa.Noty.show("Ссылка не может быть пустой!");
                            }
                        }
                    });
                });
            }
        }
    }

    function addPlaylistToIPTV() {
        let storedUrl = localStorage.getItem('iptvPlaylistUrl');

        if (storedUrl) {
            Lampa.Noty.show("Загружаем плейлист: " + storedUrl);
            
            let inputField = $(".iptv-link-input");
            if (inputField.length) {
                inputField.val(storedUrl);

                let addButton = $(".iptv-add-button");
                if (addButton.length) {
                    addButton[0].click();
                    Lampa.Noty.show("Плейлист успешно добавлен!");
                } else {
                    Lampa.Noty.show("Не найдена кнопка 'Добавить'.");
                }
            } else {
                Lampa.Noty.show("Поле ввода ссылки не найдено.");
            }
        } else {
            Lampa.Noty.show("Плейлист не найден в localStorage. Добавьте его вручную.");
        }
    }

    Lampa.Listener.follow('settings', function(event) {
        if (event.name === 'open') {
            addIPTVMenuOption();
        }
    });

    addPlaylistToIPTV();
}

manualIPTVPlugin();
