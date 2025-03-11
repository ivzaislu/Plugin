/* ==== Поддержка автора ==== */

// Буду благодарен за поддержку! Мечтаю собрать на ПАЗик, чтобы построить из него автодом, отдыхать с семьей у реки.  Но и сам процес постройки, честно говоря, видится мне не менее увлекательным занятием.

//Да ПАЗик, будет на японском моторе, погугли, очень интересный донор под автодом.

//Кто то лодку покупает, мне стрельнул в голову автобус. Такая взрослая жизнь.

//С женой уговор, заработаю на покупку на хобби, бухтеть не булет, поэтому прошу поддержать. 

//Дабы отработать свой хлеб, ниже будет описание процеса установки и настройки, для удобства вынес для тебя некоторые настройки.

// Любая сумма поможет, в комментарии укажи "это тебе на ПАЗик".  
// **СБЕР:** +7 923 668 0000  




/* ==== Информация о плагине ==== */

// Плагин создает уникальные подборки фильмов и сериалов на главной странице по жанрам, стримингам, популярности, просмотрам и кассовым сборам.  
// Обновление подборок происходит при каждом нажатии кнопки "Главная" (Home).

// ======= Установка =======
//  Если у тебя свой сервер, файл положить в wwwroot.  
// 1. Для индивидуального использования:  
//    - В Лампа открыть "Настройки" → "плагины".  
//    - В разделе плагинов прописать: ВашАдрес/surs.js.  

// 2. Для загрузки плагина всем пользователям:  
//    - Добавить в lampainit.js строку:  
//    - Lampa.Utils.putScriptAsync(["/surs.js"], function() {});



// ======= Настройки =========
//Для запрета пользователю менять название подборок, используй:
//Lampa.Storage.set('surs_disableCustomName', true); //это скроет пункт меню с вводом собственного названия 

//Для установки своего названия для всех используй:
//Lampa.Storage.set('surs_name', 'YOURS_TITLE');



/* ==== Дополнения ==== */

// Плагин работает как автономно (с ручным выбором источника через настройки), так и совместно с плагином для добавления профилей  на один аккаунт:  

// [Плагин профилей от Levende]
//https://levende.github.io/lampa-plugins/profiles.js.  

// - Детские и Русские профили получают отдельные подборки на главной странице, переключение происходит автоматически при смене профиля.  

// - Для автоматического переключения между детским, русским и основным источником, в профиле должен быть указан параметр:  
//   -  "surs": true — активирует автоматическое назначенте surs основным источником.
//   - "forKids": true — переключает источник автоматически на детский.
//  - "onlyRus": true — переключает источник автоматически на российский.


// ====Пример конфигурации профилей ====

// необходимо модифицировать init.conf для работы с profiles.js:  

// Добавляет 5 профилей на один аккаунт (пароль/почта/логин).  
// Иконки профилей нужно разместить в wwwroot/profileIcons  


/*
  "accounts": {
    "test1": "2026-01-10T00:00:00",
      "pochta235@rambler.ru": "2024-06-15T00:00:00",
      "vasyapupkin@yandex.ru": "2024-06-15T00:00:00",
    },

"params": {
    "profiles": [
      {
        "id": "",
        "title": "Он",
        "icon": "/profileIcons/id1.png", // иконки для примера
        "params": {
        
          "surs": true — у этого профиля автоматически будет включен основной источник.

        }
      },
      {
        "id": "_id2",
        "title": "Она",
        "icon": "/profileIcons/id2.png",
        "params": {
         "surs": true //— у этого профиля автоматически будет включен основной источник. Этот флаг отвечает в целом, за автоматическое переключение источника.

        }
      },
      {
        "id": "_id3",
        "title": "Ребенок",
        "icon": "/profileIcons/id3.png",
        "params": {
         "surs": true //даем понять что нужно переключать источники.
        "forKids": true //даем понять что переключать необходимо на детский вариант.
        }
      },

 {
        "id": "_id4",
        "title": "Ребенок",
        "icon": "/profileIcons/id4.png",
        "params": {
         "surs": true 
        "forKids": true //даем понять что переключать необходимо на детский вариант
 
        }
      },

 {
        "id": "_id5",
        "title": "Родственники",
        "icon": "/profileIcons/id5.png",
        "params": {
        "surs": true 
        "onlyRus": true //даем понять что переключать необходимо на российские подборки 
 
        }
      }

    ]
  }
  //Почему код обуфицирован?
  //Сам осуждаю, но это защита от вырезания пункта меню из настроек... кстати.
  //Вдруг ты забыл.
  
 //напоминаю про ПАЗик.
*/
function _0x50ba(){var _0x34a393=['ABC','sources','Lego','8865oBKyiS','Губка\x20Боб','ИВИ','Disney+','Барбоскины','&air_date.lte=','undefined','trim','Топ\x20сериалы\x20(','Влияет\x20на\x20отображение\x20контента\x20на\x20главной\x20странице','Okko','toggle','Все\x20страны','src','\x20-\x20российские','russian','release_date','open','image','splice','8110ZAggwz','СТС','Только\x20сериалы','Выключен','assign','onload','Проект\x20ПАЗик\x20-\x20Автодом','Мадагаскар','plugin_tmdb_mod_ready','Топ\x20российские\x20фильмы\x20(','&with_original_language=ru','release_date.desc','filter','name','join','toUpperCase','SyFy','hover:hover','exception','<style>','13141','build','Я\x20мечтаю\x20собрать\x20сумму\x20на\x20автобус\x20ПАЗик,\x20чтобы\x20переделать\x20его\x20в\x20автодом\x20и\x20отдыхать\x20с\x20семьей\x20у\x20реки,\x20в\x20горах\x20и\x20еще\x20куче\x20мест\x20у\x20нас\x20в\x20Сибире.\x20Хотя,\x20честно\x20говоря,\x20и\x20сам\x20процесс\x20постройки\x20кажется\x20мне\x20будет\x20не\x20менее\x20занимательным\x20процессом!<br><br>','<div\x20style=\x22font-size:\x202.5em;\x20font-weight:\x20bold;\x20color:\x20#164922;\x20letter-spacing:\x202px;\x22>СБЕР</div>','Modal','get','Studio\x20Ghibli','onEnter','middle','full','discover/tv?with_companies=','w300','values','346488','promo','фантастика','Сказка\x20о\x20царе\x20Салтане','210024','release_year','poster_path','0000','changed','Первый\x20канал','getFullYear','trending/tv/week','translate','text','\x22\x20alt=\x22ПАЗик\x22\x20style=\x22max-width:\x20100%;\x20height:\x20auto;\x20margin-bottom:\x2015px;\x22>','end','toString','2830590hIcpHb','После\x20изменения\x20настроек\x20обновите\x20главную\x20страницу,\x20нажав\x20на\x20её\x20иконку\x20в\x20боковом\x20меню.','search/movie?query=','surs_setName','Подборки\x20от\x20','.modal-content\x20{\x20padding:\x2010px;\x20font-family:\x20sans-serif;\x20border-radius:\x208px;\x20color:\x20#333;\x20}','Исключение\x20японских,\x20корейских\x20и\x20китайских\x20жанров','onHover','substr','noname','Популярные\x20сериалы','семейные','&vote_count.gte=10','trace','Wink','defineProperty','onlyRus','first_air_date','surs_empty1','test','&vote_count.gte=','extend','Аватар:\x20Легенда\x20о\x20Корре','lately','&certification_country=RU&certification=','tmdb_mod','детективы','.full-episode__num','Для\x20детей\x20не\x20старше\x2012\x20лет','trending/movie/week','Netflix','Настройка\x20интерфейса','floor','querySelector','select','\x20Фильтрует\x20контент,\x20оставляя\x20только\x20те\x20материалы,\x20у\x20которых\x20есть\x20перевод\x20названия\x20или\x20описания\x20на\x20русском\x20языке.','.gte=','<span\x20style=\x22color:\x20#fff;\x20font-weight:\x20bold;\x22>Укажи\x20в\x20комментарии\x20к\x20переводу\x20\x22Это\x20тебе\x20на\x20ПАЗик\x22.</span>','мультфильмы','tmdb','Валидация\x20рейтинга\x20позволяет\x20исключить\x20контент\x20с\x20случайно\x20завышенной\x20оценкой.\x20Однако\x20он\x20может\x20также\x20исключить\x20новые\x20фильмы\x20или\x20те,\x20у\x20которых\x20ещё\x20нет\x20рейтинга\x20или\x20мало\x20голосов.','closest','map','add','приключения','onerror','Controller','{}.constructor(\x22return\x20this\x22)(\x20)','4XjnBYM','Для\x20детей\x20не\x20старше\x206\x20лет','log','render','Apple\x20TV+','parseTime','Аватар:\x20Легенда\x20об\x20Аанге','</style>','change','Введите\x20новое\x20название','surs_cirillic','surs_withoutKeywords','vote_average','forEach','&vote_count.gte=50','Все','CBS','Чип\x20и\x20Дейл','length','-12-31','classList','Кот\x20Леопольд','forKids','surs_getTVShowsByGenre','&with_genres=','type','Три\x20богатыря','&sort_by=vote_average.desc','hide','HBO\x20Max','Peacock','?with_genres=','settings','вестерны','appready','Топ\x20российские\x20сериалы\x20(','Том\x20и\x20Джерри','Топ\x20','Много\x20голосов','Топ\x20фильмы\x20(','Фиксики','<span>Твоя\x20поддержка\x20поможет\x20реализовать\x20мне\x20мечту!\x20Руки\x20в\x20масле,\x20лицо\x20сгоревшее\x20от\x20солнца,\x20костер,\x20горы\x20и\x20Енисей.</span>','Noty','&release_date.gte=','listener','Lang','<div\x20style=\x22margin-top:\x2010px;\x20text-align:\x20center;\x20color:\x20#666;\x22>','Джимми\x20Нейтрон','<img\x20src=\x22','button','Возрастное\x20ограничение',')\x20на\x20','data:image/jpg;base64,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
