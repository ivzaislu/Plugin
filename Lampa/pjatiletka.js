(function () {
    const API_KEY = "9cdde3c5";
    const cache = new Map(); // Хранилище для кэша рейтингов

    async function fetchIMDbRating(title) {
        if (cache.has(title)) {
            return cache.get(title); // Возвращаем из кэша
        }

        try {
            let response = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${API_KEY}`);
            let data = await response.json();
            let rating = data.imdbRating || "N/A";
            cache.set(title, rating); // Сохраняем в кэше
            return rating;
        } catch (error) {
            console.error("Ошибка получения рейтинга IMDb:", error);
            return "N/A";
        }
    }

    async function addIMDbRatings() {
        document.querySelectorAll('.card__title').forEach(async (card) => {
            let title = card.textContent.trim();
            if (card.parentElement.querySelector('.imdb-rating')) return; // Избегаем дублирования

            let rating = await fetchIMDbRating(title);
            let ratingElement = document.createElement('div');
            ratingElement.className = "imdb-rating";
            ratingElement.style.color = 'yellow';
            ratingElement.style.fontSize = '14px';
            ratingElement.style.marginTop = '5px';
            ratingElement.textContent = `IMDb: ${rating}`;

            card.parentElement.appendChild(ratingElement);
        });
    }

    document.addEventListener("DOMContentLoaded", addIMDbRatings);

    // Следим за изменениями в DOM (например, при прокрутке и подгрузке новых карточек)
    let observer = new MutationObserver(addIMDbRatings);
    observer.observe(document.body, { childList: true, subtree: true });
})();
