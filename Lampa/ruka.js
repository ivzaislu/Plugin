(function () {
    function modifyMenu() {
        let menuItems = document.querySelectorAll('.menu__list li');

        menuItems.forEach((item) => {
            let text = item.textContent.trim().toLowerCase();

            if (text === 'релизы' || text === 'аниме') {
                item.style.display = 'none';  // Скрываем
            }

            if (text === 'каталог') {
                item.textContent = 'По жанрам';  // Переименовываем
            }
        });
    }

    // Запускаем после загрузки DOM
    document.addEventListener("DOMContentLoaded", modifyMenu);

    // Следим за изменениями в меню (на случай динамической подгрузки)
    let observer = new MutationObserver(modifyMenu);
    observer.observe(document.body, { childList: true, subtree: true });
})();
