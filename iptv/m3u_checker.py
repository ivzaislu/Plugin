import requests
import concurrent.futures
import re

MAX_THREADS = 20  # Количество потоков для проверки

def check_url(channel):
    """Проверяет доступность потока."""
    name, url = channel
    try:
        response = requests.get(url, timeout=5, stream=True)
        if response.status_code == 200:
            print(f"[✔] {name}: {url}")
            return f"{name},{url}"
    except requests.RequestException:
        pass
    print(f"[✖] {name}: {url}")
    return None

def extract_streams(m3u_url):
    """Извлекает потоки из M3U-файла."""
    streams = []
    try:
        response = requests.get(m3u_url, timeout=10)
        response.raise_for_status()
        
        lines = response.text.splitlines()
        name = None  # Название канала
        
        for line in lines:
            line = line.strip()
            if line.startswith("#EXTINF"):
                parts = line.split(",", 1)
                name = parts[1].strip() if len(parts) > 1 and parts[1].strip() else "Unknown"
            elif line and not line.startswith("#"):
                if name is None:
                    name = "Unknown"
                streams.append((name, line))
                name = None  # Сбрасываем название после записи
                
    except requests.RequestException:
        print(f"Ошибка загрузки M3U: {m3u_url}")
    return streams

def check_m3u_files(m3u_file="m3u_links.txt"):
    """Основная функция для загрузки и проверки M3U-плейлистов."""
    try:
        with open(m3u_file, "r", encoding="utf-8") as f:
            m3u_links = f.read().splitlines()
    except FileNotFoundError:
        print(f"Файл {m3u_file} не найден. Создайте его и добавьте ссылки на плейлисты.")
        return

    all_streams = []
    for m3u_url in m3u_links:
        print(f"\nИзвлекаем потоки из: {m3u_url}")
        streams = extract_streams(m3u_url)
        all_streams.extend(streams)
    
    print(f"\nНайдено {len(all_streams)} потоков. Проверяем их работоспособность...")

    working_streams = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
        results = executor.map(check_url, all_streams)
    
    for result in results:
        if result:
            working_streams.append(result)

    if working_streams:
        with open("working_streams.txt", "w", encoding="utf-8") as f:
            f.write("\n".join(working_streams))
        print("\n✅ Рабочие потоки сохранены в working_streams.txt")
    else:
        print("\n❌ Рабочие потоки не найдены.")

if __name__ == "__main__":
    check_m3u_files()
