(function () {
    const API_KEY = "9cdde3c5";
    const cache = new Map();

    async function fetchMovieDetails(title) {
        if (cache.has(title)) return cache.get(title);

        try {
            let response = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${API_KEY}`);
            let data = await response.json();

            if (data.Response === "True" && data.Actors) {
                let actors = data.Actors.split(", ");
                cache.set(title, actors);
                return actors;
            }
        } catch (error) {
            console.error("Ошибка IMDb API:", error);
        }
        return [];
    }

    async function addActorLinksInMovieCard() {
        let titleElement = document.querySelector('.full-start__title');
        if (!titleElement) return;

        let title = titleElement.innerText.trim();
        if (!title) return;

        let detailsBlock = document.querySelector('.full-start__info'); // Где будут имена актёров
        if (!detailsBlock || detailsBlock.querySelector('.actor-links')) return;

        let actors = await fetchMovieDetails(title);
        if (actors.length === 0) return;

        let container = document.createElement('div');
        container.className = "actor-links";
        container.style.marginTop = "10px";
        container.style.fontSize = "16px";
        container.style.color = "lightblue";

        let label = document.createElement('div');
        label.innerText = "Актёры:";
        label.style.fontWeight = "bold";
        container.appendChild(label);

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

        detailsBlock.appendChild(container);
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

    function checkMovieCard() {
        if (document.querySelector('.full-start')) {
            addActorLinksInMovieCard();
        }
    }

    document.addEventListener("DOMContentLoaded", checkMovieCard);

    let observer = new MutationObserver(checkMovieCard);
    observer.observe(document.body, { childList: true, subtree: true });
})();
