(function() {
    function addHandsButton() {
        let menu = document.querySelector('.head__body'); // Основное меню
        if (menu && !document.querySelector('.menu-item-hands')) {
            let btn = document.createElement('div');
            btn.classList.add('head__body-item', 'menu-item-hands');
            btn.innerHTML = '<span>🖐 Руки</span>';
            btn.addEventListener('click', function() {
                Lampa.Noty.show('Вы нажали кнопку "Руки"!'); // Уведомление
            });

            menu.appendChild(btn);
        }
    }

    Lampa.Listener.follow('app', function(event) {
        if (event.type === 'ready') {
            addHandsButton();
        }
    });
})();
