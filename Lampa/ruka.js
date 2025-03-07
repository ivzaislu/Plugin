(function () {
    function hideMenuItems() {
        let menuItems = document.querySelectorAll('.menu__list li');

        menuItems.forEach((item) => {
            let text = item.textContent.trim().toLowerCase();
            if (text === 'релизы' || text === 'аниме') {
                item.style.display = 'none';
            }
        });
    }

    // Запускаем после загрузки DOM
    document.addEventListener("DOMContentLoaded", hideMenuItems);

    // Также следим за изменениями в меню (на случай динамической подгрузки)
    let observer = new MutationObserver(hideMenuItems);
    observer.observe(document.body, { childList: true, subtree: true });
})();
