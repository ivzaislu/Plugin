var Plugin = {
    id: 'iptv-plugin',  // Уникальный ID плагина
    name: 'IPTV Plugin', // Название плагина
    version: '1.0',      // Версия плагина

    // Инициализация плагина
    init: function() {
        console.log('IPTV Plugin запущен!');
        this.addMenuItem(); // Добавляем пункт в меню
    },

    // Метод для добавления пункта в меню
    addMenuItem: function() {
        var menuItem = {
            title: 'IPTV Каналы', // Название пункта
            action: function() {
                Plugin.showPlaylistMenu(); // Действие при выборе пункта
            }
        };

        // Добавление пункта в меню Lampa
        Menu.add(menuItem);
    },

    // Метод для отображения списка каналов
    showPlaylistMenu: function() {
        // Допустим, этот метод выводит список доступных плейлистов
        console.log('Загрузка списка IPTV плейлистов...');
        var playlists = [
            { name: 'Канал 1', url: 'http://example.com/channel1.m3u' },
            { name: 'Канал 2', url: 'http://example.com/channel2.m3u' }
        ];
        this.displayPlaylists(playlists);
    },

    // Метод для отображения плейлистов
    displayPlaylists: function(playlists) {
        var list = playlists.map(function(playlist) {
            return {
                title: playlist.name,
                action: function() {
                    Plugin.loadPlaylist(playlist.url); // Загрузка выбранного плейлиста
                }
            };
        });

        // Добавление опций для выбора плейлистов в интерфейсе Lampa
        Menu.add(list);
    },

    // Метод для загрузки плейлиста IPTV
    loadPlaylist: function(url) {
        fetch(url)
            .then(response => response.text())
            .then(data => {
                const channels = this.parseM3U(data);
                this.displayChannels(channels);
            })
            .catch(error => {
                console.error('Ошибка при загрузке плейлиста:', error);
            });
    },

    // Метод для парсинга M3U плейлиста
    parseM3U: function(data) {
        const lines = data.split('\n');
        const channels = [];
        let channel = {};

        lines.forEach(line => {
            if (line.startsWith('#EXTINF')) {
                channel.name = line.split(',')[1].trim();
            } else if (line.startsWith('http')) {
                channel.url = line.trim();
                channels.push(channel);
                channel = {}; // Очищаем для следующего канала
            }
        });

        return channels;
    },

    // Метод для отображения каналов на экране
    displayChannels: function(channels) {
        channels.forEach(channel => {
            console.log(`Канал: ${channel.name}, URL: ${channel.url}`);
        });
    }
};

// Инициализация плагина
Plugin.init();
