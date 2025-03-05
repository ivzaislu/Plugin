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

    var loadMoviesByPeriod = function () {
        console.log("Запрос к API..."); // Логирование запроса для дебага

        // Проверяем корректность параметров запроса
        Lampa.Api.request({
            method: 'discover',
            source: 'tmdb',
            param: {
                sort_by: 'popularity.desc',
                primary_release_date_gte: '2000-01-01', // Отфильтруем фильмы, начиная с 2000 года
                primary_release_date_lte: '2024-12-31',
                with_original_language: 'ru,en'
            }
        }, function (data) {
            console.log("Получены данные:", data); // Логирование полученных данных
            if (data.results && data.results.length) {
                var groupedMovies = groupMoviesByPeriod(data.results);
                openPyatiletkaScreen(groupedMovies);
            } else {
                Lampa.Noty.show("Фильмы не найдены.");
            }
        }, function (error) {
            console.error("Ошибка при запросе:", error); // Логирование ошибки
            Lampa.Noty.show("Ошибка загрузки данных.");
        });
    };

    var groupMoviesByPeriod = function (movies) {
        var periods = {
            "2020-2024": [],
            "2015-2019": [],
            "2010-2014": [],
            "2005-2009": [],
            "2000-2004": []
        };

        movies.forEach(function (movie) {
            var year = parseInt(movie.release_date ? movie.release_date.substring(0, 4) : "2000");

            if (year >= 2020) periods["2020-2024"].push(movie);
            else if (year >= 2015) periods["2015-2019"].push(movie);
            else if (year >= 2010) periods["2010-2014"].push(movie);
            else if (year >= 2005) periods["2005-2009"].push(movie);
            else periods["2000-2004"].push(movie);
        });

        return periods;
    };

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

        Lampa.Activity.push({
            url: "",
            title: "Фильмы по пятилеткам",
            component: "category",
            page: 1,
            items: items
        });
    };

    window.appready ? addPyatiletkaToMenu() : Lampa.Listener.follow("app", function (event) {
        if (event.type === "ready") addPyatiletkaToMenu();
    });
})();
