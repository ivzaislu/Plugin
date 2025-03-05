(function() {
  var apiKey = '9cdde3c5'; // Ваш API ключ для OMDb
  var genre = 'Action';   // Вы можете изменить на любой другой жанр

  // Функция для выполнения запроса
  var fetchMoviesByGenre = function() {
    var url = `http://www.omdbapi.com/?apikey=${apiKey}&type=movie&plot=short&r=json`;

    fetch(url)
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        if (data.Response === "True") {
          var filteredMovies = data.Search.filter(function(movie) {
            return movie.Genre && movie.Genre.includes(genre);
          });

          if (filteredMovies.length > 0) {
            displayMovies(filteredMovies);  // Отображаем фильмы
          } else {
            alert("Нет фильмов для жанра: " + genre);
          }
        } else {
          alert("Ошибка при получении данных.");
        }
      })
      .catch(function(error) {
        alert("Ошибка при выполнении запроса.");
      });
  };

  // Функция для отображения фильмов
  var displayMovies = function(movies) {
    var movieList = $('<div class="movie-list"></div>');

    movies.forEach(function(movie) {
      var movieItem = $(
        '<div class="movie-item">' +
          '<h3>' + movie.Title + ' (' + movie.Year + ')</h3>' +
          '<p>' + movie.Genre + '</p>' +
          '<img src="' + movie.Poster + '" alt="' + movie.Title + '" />' +
        '</div>'
      );
      movieList.append(movieItem);
    });

    // Вставляем список фильмов в интерфейс
    $('body').append(movieList);  // Выводим фильмы на странице
  };

  // Функция для добавления кнопки в меню
  var addButtonToMenu = function() {
    var button = $('<li class="menu__item selector" data-action="show_movies_genre">' +
      '<div class="menu__ico">' +
        '<svg width="24" height="23" viewBox="0 0 24 23" fill="none" xmlns="http://www.w3.org/2000/svg">' +
          '<path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.03 20 4 16.97 4 12C4 7.03 7.03 4 12 4C16.97 4 20 7.03 20 12C20 16.97 16.97 20 12 20Z" stroke="currentColor" stroke-width="2.5"></path>' +
        '</svg>' +
      '</div>' +
      '<div class="menu__text">Фильмы по жанрам</div>' +
    '</li>');

    button.on("hover:enter", function() {
      fetchMoviesByGenre();  // При нажатии выполняется запрос
    });

    // Добавляем кнопку в меню
    Lampa.Menu.render().find('[data-component="menu"]').append(button);
  };

  // Запускаем добавление кнопки в меню после загрузки Lampa
  if (window.appready) {
    addButtonToMenu();
  } else {
    Lampa.Listener.follow("app", function(b) {
      if (b.type === "ready") {
        addButtonToMenu();
      }
    });
  }
})();
