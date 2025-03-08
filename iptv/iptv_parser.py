import requests
from bs4 import BeautifulSoup
import re

# Список сайтов для поиска M3U плейлистов
sites = [
    "https://iptv.axenov.dev/ru",
    "https://github.com/smolnp/IPTVru",
    "https://iptv.org.ua/playlist-iptv/samoobnovlyaemye-pleylisty",
    "https://vip-tv.org/articles/iptv-playlist/",
    "https://smart-iptv.ru/playlisty-m3u",
    "https://sat.kharkiv.ua/plejlisty",
    "https://tva.org.ua/iptv/playlist",
    "https://ottfox.com/articles/samoobnovlyaemue-pleylistu-iptv.html",
]

# Функция для поиска M3U ссылок на сайте
def find_m3u_links(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        # Используем BeautifulSoup для парсинга HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Ищем ссылки на M3U плейлисты в тегах <a> и в тексте страницы
        m3u_links = set(re.findall(r'(https?://[^"\']+\.m3u[8]?)', str(soup)))
        
        if m3u_links:
            print(f"\nНайдено M3U ссылки на {url}:")
            for link in m3u_links:
                print(link)
            return m3u_links
        else:
            print(f"На сайте {url} не найдены M3U ссылки.")
            return set()
    
    except requests.exceptions.RequestException as e:
        print(f"Ошибка при обращении к {url}: {e}")
        return set()

# Основная функция
def main():
    all_links = set()
    
    for site in sites:
        links = find_m3u_links(site)
        all_links.update(links)
    
    if all_links:
        with open("m3u_links.txt", "w", encoding="utf-8") as f:
            f.write("\n".join(all_links))
        print("\nВсе найденные ссылки сохранены в файл m3u_links.txt")
    else:
        print("\nM3U ссылки не найдены.")

if __name__ == "__main__":
    main()
