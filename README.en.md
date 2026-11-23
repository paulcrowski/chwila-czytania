# Chwila czytania · A Moment to Read

**[Download the Chrome extension (ZIP)](https://github.com/paulcrowski/chwila-czytania/releases/latest/download/chwila-czytania.zip)** · [Polski](README.md) · [Release history](https://github.com/paulcrowski/chwila-czytania/releases)

When you open a site out of habit, Chwila czytania takes you back to the last paragraph you read. Choose which sites to block completely and which to give a few minutes a day.

## Install

1. Download and extract the ZIP. Keep the extracted `chwila-czytania` folder.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the folder containing `manifest.json`.
4. Open **Settings** from the extension menu. Add your domains, choose their rules, and click **Save changes**. Chrome asks for access to those domains.

Rules cover subdomains. Enter several domains separated by commas, or use **Add this site** in the extension menu to set a rule for your current site. Use **PL** or **ENG** in Settings to change the interface language.

## Blocking rules

| Rule | What happens when you open a site |
| --- | --- |
| **Always block** | The reader opens immediately. |
| **Daily limit** | The reader opens first. After the configured wait, click **Open site** to start the timer. |

You can set two groups with custom limits. Sites in the same group share one session per day. The default limits are 10 and 15 minutes, with a 30-second wait. Set the wait to 0 seconds to make **Open site** available immediately.

The site timer keeps running in the background. Click the extension icon to see the remaining time. When the timer runs out, open sites in that group return to the reader.

## Your books and quotes

Import a **DRM-free EPUB** or a **UTF-8 TXT** file, or start with the included sample. Keep scrolling to load more text. The reader remembers the last paragraph in each book. For EPUB books, use the chapter picker to jump to a chapter. Open **Reading appearance** to adjust text size and choose Paper, Night, or System.

Select a passage and click **Save quote**. Find it with its book title under **Saved quotes** in the reader and the extension menu. Quotes stay in your collection when you switch books. Reimport the same file to use **Go to excerpt**.

For a reading suggestion, you can prepare a TXT file from [E. M. Forster’s *The Machine Stops* (Stanford PDF)](https://hci.stanford.edu/courses/cs047n/readings/forster.pdf).

## Reading after a block

Click the extension icon to see **Today**, **7 days**, and **All time**.

- **Blocks opened** counts redirects to the reader. Reloading the reader leaves the count unchanged.
- **Time in reader** counts time after a redirect while the reader is visible and in focus.
- **Sites opened** counts visits launched with **Open site** from the reader.

Your book, reading positions, quotes, rules, and stats are stored locally in your Chrome profile.

## Update

Extract the new ZIP and replace the files in the folder Chrome already uses. Then click **Reload** for the extension at `chrome://extensions`.

## Tests and license

Run `npm ci` and `npm test`. Tests cover blocking, timed access, EPUB import, reading positions, saved quotes, and stats. The extension bundles fflate for EPUB extraction. [MIT License](LICENSE) · [fflate license](vendor/fflate.LICENSE)
