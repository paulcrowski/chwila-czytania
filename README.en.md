# Chwila czytania · A Moment to Read

**[Download the Chrome extension (ZIP)](https://github.com/paulcrowski/chwila-czytania/releases/latest/download/chwila-czytania.zip)** · [Polski](README.md)

Chwila czytania opens a book when you visit a site you want to spend less time on. The reader picks up where you left off. You can block a site completely or give yourself a few minutes a day.

## How it works

Say you block Interia completely and put Onet and Pudelek in a group with a **5-minute** limit.

| Rule | What happens on the first visit |
| --- | --- |
| **Always block** | Interia takes you straight to the reader. |
| **Daily limit** | Onet opens the reader. After 30 seconds, click **Otwórz portal** (Open site) to start the timer shared by Onet and Pudelek. |

Sites in the same group share one session per day. The timer keeps running in the background. The extension icon shows the minutes remaining before the next session ends. Click the icon to see the exact time for each active session. When the timer runs out, open sites in that group return to the reader.

## Install and configure

The extension interface is in Polish. The labels below match what you'll see.

1. Download the ZIP and extract it to a folder you want to keep.
2. Open `chrome://extensions`, enable **Developer mode**, and click **Load unpacked**. Select the `chwila-czytania` folder containing `manifest.json`.
3. Choose **Ustawienia** (Settings) from the extension menu. Add domains one at a time or as a comma-separated list. Rules also cover subdomains.
4. Choose **Zawsze blokuj** (Always block) or one of the two timed groups. Their default limits are 10 and 15 minutes. A new limit applies to the next session.
5. Click **Zapisz zmiany** (Save changes) and grant the extension access to the domains you added.

## Bring your own book

Start with the included sample or **import any book or other text as a UTF-8 TXT file**. **Czytaj dalej** (Read on) saves your place. If you want a reading suggestion, try preparing a TXT file from [E. M. Forster’s *The Machine Stops* (Stanford PDF)](https://hci.stanford.edu/courses/cs047n/readings/forster.pdf).

## Update

Extract the new ZIP, replace the files in the folder Chrome already uses, then click **Reload** for the extension at `chrome://extensions`.

Your book, reading position, site rules, and session times are stored locally in your Chrome profile.

[MIT License](LICENSE) · [Report a bug or suggest an improvement](https://github.com/paulcrowski/chwila-czytania/issues)
