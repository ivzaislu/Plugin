"use strict";

(function () {
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

    // Функция для запроса фильмов по пятилеткам через Lampa API (с источником TMDb)
    var loadMoviesByPeriod = function () {
        console.log("Запрос к Lampa API...");

        var currentDate = new Date();
        var currentYear = currentDate.getFullYear();
        
        // Пример запроса для фильмов 2020-2024 года
        var yearRanges = [
            { period: "2020-2024", minYear: 2020, maxYear: 2024 },
            { period: "2015-2019", minYear: 2015, maxYear: 2019 },
            { period: "2010-2014", minYear: 2010, maxYear: 2014 },
            { period: "2005-2009", minYear: 2005, maxYear: 2009 },
            { period: "2000-2004", minYear: 2000, maxYear: 2004 }
        ];

        // Мы будем запрашивать фильмы для каждого периода
        var groupedMovies = {};

        yearRanges.forEach(function (range) {
            var query = {
                source: 'tmdb', // Указываем источник TMDb
                param: {
                    primary_release_date_gte: `${range.minYear}-01-01`,
                    primary_release_date_lte: `${range.maxYear}-12-31`,
                    sort_by: 'popularity.desc',
                    language: 'ru,en'
                }
            };

            console.log(`Запрос к источнику TMDb для ${range.period}`);

            // Запрос к API Lampa для получения фильмов
            Lampa.Api.request({
                method: 'discover',
                source: query.source,
                param: query.param
            }, function (data) {
                if (data && data.results && data.results.length) {
                    console.log(`Получено ${data.results.length} фильмов для периода ${range.period}`);
                    groupedMovies[range.period] = data.results;
                } else {
                    console.log(`Нет фильмов для периода ${range.period}`);
                }

                // После всех запросов, откроем экран
                if (Object.keys(groupedMovies).length === yearRanges.length) {
                    openPyatiletkaScreen(groupedMovies);
                }
            }, function (error) {
                console.error("Ошибка при запросе к Lampa API:", error);
                Lampa.Noty.show("Ошибка загрузки данных.");
            });
        });
    };

    // Функция группировки фильмов по пятилеткам
    var openPyatiletkaScreen = function (groupedMovies) {
        var items = [];

        Object.keys(groupedMovies).forEach(function (period) {
            if (groupedMovies[period].length) {
                items.push({
                    title: period,
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
