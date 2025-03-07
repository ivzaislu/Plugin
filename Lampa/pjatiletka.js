(function () {
    const API_KEY = "9cdde3c5";
    const cache = new Map(); // Локальный кэш для хранения рейтингов

    async function fetchIMDbRating(title) {
        if (cache.has(title)) return cache.get(title);

        try {
            let response = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${API_KEY}`);
            let data = await response.json();
            let rating = data.imdbRating && data.imdbRating !== "N/A" ? data.imdbRating : "N/A";
            cache.set(title, rating);
            return rating;
        } catch (error) {
            console.error("Ошибка IMDb API:", error);
            return "N/A";
        }
    }

    async function addIMDbRatings() {
        document.querySelectorAll('.card__title').forEach(async (card) => {
            let title = card.innerText.trim(); // Используем innerText для точности
            let parent = card.closest('.card'); // Ищем контейнер карточки

            if (!parent) return;

            // Удаляем старые дубли перед добавлением нового рейтинга
            parent.querySelectorAll('.imdb-rating').forEach(el => el.remove());

            let rating = await fetchIMDbRating(title);

            let ratingElement = document.createElement('div');
            ratingElement.className = "imdb-rating";
            ratingElement.style.color = 'yellow';
            ratingElement.style.fontSize = '14px';
            ratingElement.style.marginTop = '5px';
            ratingElement.innerText = `IMDb: ${rating}`;

            parent.appendChild(ratingElement);
        });
    }

    document.addEventListener("DOMContentLoaded", addIMDbRatings);

    // Отслеживание новых карточек (динамическая подгрузка)
    let observer = new MutationObserver(addIMDbRatings);
    observer.observe(document.body, { childList: true, subtree: true });
})();
