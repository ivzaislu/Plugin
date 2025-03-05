(function(){
    function addHandsButton() {
        let menu = document.querySelector('.menu__list');
        if (menu) {
            let btn = document.createElement('li');
            btn.classList.add('menu__item');
            btn.innerHTML = '<a class="menu__link" href="#">🖐 Руки</a>';
            btn.addEventListener('click', function() {
                Lampa.Noty.show('Вы нажали кнопку "Руки"!');
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
