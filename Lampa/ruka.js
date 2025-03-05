"use strict";

(function() {
  var apiKey = '9cdde3c5';  // Ваш API ключ для OMDb
  var genre = 'Action';  // Фильтруем фильмы по жанру 'Action'

  // Функция для выполнения запроса
  var fetchMoviesByGenre = function() {
    var url = `http://www.omdbapi.com/?apikey=${apiKey}&type=movie&plot=short&r=json`;

    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data.Response === "True") {
          // Фильтруем фильмы по жанру
          var filteredMovies = data.Search.filter(movie => movie.Genre && movie.Genre.includes(genre));
          
          if (filteredMovies.length > 0) {
            // Отображаем отфильтрованные фильмы
            displayMovies(filteredMovies);
          } else {
            console.log(`Нет фильмов жанра "${genre}".`);
          }
        } else {
          console.log("Ошибка при получении данных:", data.Error);
        }
      })
      .catch(error => {
        console.error("Ошибка при выполнении запроса:", error);
      });
  };

  // Функция для отображения фильмов в интерфейсе Lampa
  var displayMovies = function(movies) {
    var movieList = $('<div class="movie-list"></div>');

    movies.forEach(function(movie) {
      var movieItem = $(
        `<div class="movie-item">
           <h3>${movie.Title} (${movie.Year})</h3>
           <p>${movie.Genre}</p>
           <img src="${movie.Poster}" alt="${movie.Title}" />
         </div>`
      );
      movieList.append(movieItem);
    });

    // Вставляем список фильмов в интерфейс Lampa
    Lampa.Menu.render().find('[data-component="menu"]').append(movieList);
  };

  // Запускаем запрос
  window.appready ? fetchMoviesByGenre() : Lampa.Listener.follow("app", function(b) {
    if (b.type === "ready") fetchMoviesByGenre();
  });
})();
