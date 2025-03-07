(function () {
    const API_KEY = "9cdde3c5";
    const cache = new Map();

    async function fetchMovieDetails(title) {
        if (cache.has(title)) return cache.get(title);

        try {
            let response = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${API_KEY}`);
            let data = await response.json();

            if (data.Response === "True" && data.Actors) {
                cache.set(title, data.Actors);
                return data.Actors.split(", ");
            }
        } catch (error) {
            console.error("Ошибка IMDb API:", error);
        }
        return [];
    }

    async function addActorLinks() {
        document.querySelectorAll('.card').forEach(async (card) => {
            let titleElement = card.querySelector('.card__title');
            if (!titleElement) return;

            let title = titleElement.innerText.trim();
            if (!title) return;

            // Убираем дубли
            if (card.querySelector('.actor-links')) return;

            let actors = await fetchMovieDetails(title);
            if (actors.length === 0) return;

            let container = document.createElement('div');
            container.className = "actor-links";
            container.style.marginTop = "5px";
            container.style.fontSize = "14px";
            container.style.color = "lightblue";

            actors.forEach(actor => {
                let link = document.createElement('span');
                link.innerText = actor;
                link.style.cursor = "pointer";
                link.style.marginRight = "10px";
                link.style.textDecoration = "underline";

                // Добавляем обработчик клика
                link.onclick = () => openActorCollection(actor);

                container.appendChild(link);
            });

            card.appendChild(container);
        });
    }

    function openActorCollection(actor) {
        Lampa.Activity.push({
            url: '',
            title: `Фильмы с ${actor}`,
            component: 'category',
            page: 1,
            genres: [],
            search: actor
        });
    }

    document.addEventListener("DOMContentLoaded", addActorLinks);

    let observer = new MutationObserver(addActorLinks);
    observer.observe(document.body, { childList: true, subtree: true });
})();
