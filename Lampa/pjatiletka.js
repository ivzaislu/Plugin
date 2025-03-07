(function () {
    const API_KEY = "9cdde3c5";
    const cache = new Map();

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
        document.querySelectorAll('.card').forEach(async (card) => {
            let titleElement = card.querySelector('.card__title');
            if (!titleElement) return;

            let title = titleElement.innerText.trim();
            if (!title) return;

            // Проверяем, нет ли уже блока с рейтингом внутри этой конкретной карточки
            if (card.querySelector('.imdb-rating')) return;

            let rating = await fetchIMDbRating(title);

            let ratingElement = document.createElement('div');
            ratingElement.className = "imdb-rating";
            ratingElement.style.color = 'yellow';
            ratingElement.style.fontSize = '14px';
            ratingElement.style.marginTop = '5px';
            ratingElement.innerText = `IMDb: ${rating}`;

            card.appendChild(ratingElement);
        });
    }

    document.addEventListener("DOMContentLoaded", addIMDbRatings);

    let observer = new MutationObserver(addIMDbRatings);
    observer.observe(document.body, { childList: true, subtree: true });
})();
