(function() {
    // Подключаемся к объекту меню
    var Lampa = window.Lampa || {};
    
    // Проверяем, загружено ли приложение Lampa
    if (typeof Lampa === "undefined") {
        console.log("Lampa не найдено.");
        return;
    }

    // Функция для добавления пункта в меню
    function addMenuItem() {
        // Добавляем новый пункт в меню
        Lampa.Menu.add({
            title: "Мой новый пункт",  // Заголовок
            icon: "menu",              // Иконка (можно использовать встроенную или свою)
            onselect: function() {
                // Действия при выборе пункта
                Lampa.Menu.close();   // Закрыть меню
                showCustomMessage();   // Показать сообщение
            }
        });
    }

    // Функция для отображения сообщения
    function showCustomMessage() {
        Lampa.Menu.open({
            title: "Вы выбрали пункт!",
            content: "Вы успешно выбрали новый пункт в меню.",
            actions: [
                {
                    title: "Закрыть",
                    onselect: function() {
                        Lampa.Menu.close(); // Закрыть меню
                    }
                }
            ]
        });
    }

    // Инициализация плагина
    Lampa.API.on("init", function() {
        addMenuItem(); // Добавляем пункт в меню при инициализации Lampa
    });
})();
