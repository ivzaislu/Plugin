"use strict";

(function () {
    var apiKey = '9cdde3c5';  // Ваш API ключ для OMDb

    var addPyatiletkaToMenu = function () {
        var menuItem = $("<li class='menu__item selector' data-action='mad_pyatiletka'>" +
            "<div class='menu__ico'>" +
            "<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>" +
            "<circle cx='12' cy='12' r='10' stroke='currentColor' stroke-width='2'></circle>" +
            "<text x='6' y='16' fill='currentColor' font-size='12' font-family='Arial' font-weight='bold'>5</text>" +
            "</svg>" +
            "</div>" +
            "<div class='menu__text'>Пятилетка</div>" +
            "</li>");

        Lampa.Menu.render().find("[data-action='catalog']").before(menuItem);

        menuItem.on("hover:enter", function () {
            loadMoviesByPeriod();
        });
    };

    // Функция для запроса фильмов по пятилеткам через OMDb API
    var loadMoviesByPeriod = function () {
        console.log("Запрос к OMDb API...");

        var currentDate = new Date();
        var currentYear = currentDate.getFullYear();
        
        // Пример запроса для фильмов 2020-2024 года
        var yearRanges = [
            { period: "2020", year: 2020 },
            { period: "2021", year: 2021 },
            { period: "2022", year: 2022 },
            { period: "2023", year: 2023 },
            { period: "2024", year: 2024 }
        ];

        // Мы будем запрашивать фильмы для каждого года
        var groupedMovies = {};

        yearRanges.forEach(function (range) {
            // Строим URL запроса к OMDb API для одного года
            var url = `http://www.omdbapi.com/?apikey=${apiKey}&type=movie&y=${range.year}&plot=short&r=json`;

            console.log(`Запрос к OMDb API для года ${range.year}: ${url}`);

            // Выполняем запрос
            $.get(url)
                .done(function (data) {
                    if (data.Response === "True") {
                        console.log(`Получено ${data.Search.length} фильмов для года ${range.year}`);
                        groupedMovies[range.period] = data.Search;
                    } else {
                        console.log(`Нет фильмов для года ${range.year}`);
                    }
                })
                .fail(function (error) {
                    console.error(`Ошибка при запросе для года ${range.year}:`, error);
                    Lampa.Noty.show("Ошибка загрузки данных.");
                })
                .always(function () {
                    // После всех запросов, откроем экран
                    if (Object.keys(groupedMovies).length === yearRanges.length) {
                        openPyatiletkaScreen(groupedMovies);
                    }
                });
        });
    };

    // Функция группировки фильмов по пятилеткам
    var openPyatiletkaScreen = function (groupedMovies) {
        var items = [];

        Object.keys(groupedMovies).forEach(function (period) {
            if (groupedMovies[period].length) {
                items.push({
                    title: `Фильмы ${period} года`,
                    results: groupedMovies[period]
                });
            }
        });

        if (items.length === 0) {
            Lampa.Noty.show("Нет фильмов для отображения.");
            return;
        }

        // Открытие экрана с фильмами по пятилеткам
        Lampa.Activity.push({
            url: "",
            title: "Фильмы по пятилеткам",
            component: "category",
            page: 1,
            items: items
        });
    };

    // Добавление кнопки в меню
    window.appready ? addPyatiletkaToMenu() : Lampa.Listener.follow("app", function (event) {
        if (event.type === "ready") addPyatiletkaToMenu();
    });
})();
