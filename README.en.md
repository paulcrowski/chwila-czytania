# Chwila czytania · A Moment to Read

[Polski](README.md) · **[Download the Chrome extension (ZIP)](https://github.com/paulcrowski/chwila-czytania/releases/latest/download/chwila-czytania.zip)**

When you reach for a website out of habit, Chwila czytania opens a book where you left off. Read a little or, if the website has a time allowance, continue to it after a short pause.

## Install

The extension interface is currently in Polish. The labels below match what you see on screen.

1. Download the ZIP and extract it to a folder you want to keep.
2. In Chrome, open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and select the `chwila-czytania` folder that contains `manifest.json`.
4. Click the extension icon, choose **Ustawienia** (Settings), and add domains on separate lines or separated by commas.
5. Click **Zapisz strony** (Save sites) and grant Chrome access to those domains.

## How it works

- **Zawsze blokuj** (Always block) sends a domain and its subdomains straight to the reader.
- The **10-minute** and **15-minute** groups each get one daily session shared across their sites. After 30 seconds in the reader, click **Otwórz portal** (Open site). The timer keeps running in the background, and open sites in that group return to the book when the session ends.
- The toolbar badge shows minutes until the next session ends. Click the extension icon for the exact time elapsed and remaining in each active session.
- Start with the sample or import a UTF-8 TXT file. **Czytaj dalej** (Read on) saves your place. For example, you can prepare a TXT file from [E. M. Forster’s *The Machine Stops* (Stanford PDF)](https://hci.stanford.edu/courses/cs047n/readings/forster.pdf).

The extension runs locally. Your book, reading position, domains, and session times are stored in your Chrome profile. The project is available under the [MIT License](LICENSE).

Report bugs or suggest improvements in [Issues](https://github.com/paulcrowski/chwila-czytania/issues).
