// Ваш API ключ для OMDb API
const apiKey = 'YOUR_OMDB_API_KEY'; // Замените на ваш ключ API

// Функция для запроса данных о фильме из OMDb API
async function fetchMovieInfo(movieName) {
    const url = `http://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.Response === "True") {
            return data;
        } else {
            throw new Error(data.Error);
        }
    } catch (error) {
        alert('Ошибка: ' + error.message);
        return null;
    }
}

// Добавление кнопки в меню Lampa
lampa.addMenu('search_movie', 'Поиск фильма', () => {
    // Ожидаем ввода названия фильма
    const movieName = prompt('Введите название фильма:');

    if (!movieName) {
        alert('Название фильма не может быть пустым');
        return;
    }

    // Запрос данных о фильме через OMDb API
    fetchMovieInfo(movieName).then(movieData => {
        if (movieData) {
            // Выводим информацию о фильме
            const movieInfo = `
                <h2>${movieData.Title} (${movieData.Year})</h2>
                <p><strong>Режиссёр:</strong> ${movieData.Director}</p>
                <p><strong>Актёры:</strong> ${movieData.Actors}</p>
                <p><strong>Описание:</strong> ${movieData.Plot}</p>
                <img src="${movieData.Poster}" alt="Постер фильма">
            `;
            
            // Выводим результат в UI
            lampa.showAlert('Информация о фильме', movieInfo);
        }
    });
});
