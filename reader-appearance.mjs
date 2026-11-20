const DEFAULT_APPEARANCE = { theme: 'system', scale: 100 };
const THEME_LABELS = { system: 'systemTheme', paper: 'paperTheme', night: 'nightTheme' };
const MIN_SCALE = 80;
const MAX_SCALE = 180;
const SCALE_STEP = 10;

export function normalizeAppearance(value) {
  const theme = value?.theme;
  const scale = value?.scale;
  return {
    theme: Object.hasOwn(THEME_LABELS, theme) ? theme : DEFAULT_APPEARANCE.theme,
    scale: Number.isInteger(scale) && scale >= MIN_SCALE && scale <= MAX_SCALE ? scale : DEFAULT_APPEARANCE.scale,
  };
}

export function mountReaderAppearance(storage, initial, translate) {
  const themeControl = document.querySelector('#reader-theme');
  const decrease = document.querySelector('#reader-smaller');
  const increase = document.querySelector('#reader-larger');
  const size = document.querySelector('#reader-size');
  const status = document.querySelector('#reader-appearance-status');

  let preferences = normalizeAppearance(initial);
  let t = translate;
  let saving = false;
  let failed = false;

  function render() {
    document.body.dataset.readerTheme = preferences.theme;
    document.body.style.setProperty('--reader-scale', String(preferences.scale / 100));
    themeControl.value = preferences.theme;
    for (const option of themeControl.options) {
      option.textContent = t(THEME_LABELS[option.value]);
    }
    size.textContent = preferences.scale + '%';
    decrease.disabled = preferences.scale <= MIN_SCALE;
    increase.disabled = preferences.scale >= MAX_SCALE;
    status.textContent = failed ? t('appearanceSaveError') : '';
    status.hidden = !failed;
  }

  async function save(next) {
    if (saving) {
      render();
      return;
    }
    const previous = preferences;
    preferences = normalizeAppearance(next);
    saving = true;
    failed = false;
    render();
    try {
      await storage.set({ readerAppearance: preferences });
    } catch {
      preferences = previous;
      failed = true;
    } finally {
      saving = false;
      render();
    }
  }

  function changeScale(delta) {
    return save({
      ...preferences,
      scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, preferences.scale + delta)),
    });
  }

  themeControl.addEventListener('change', () => save({ ...preferences, theme: themeControl.value }));
  decrease.addEventListener('click', () => changeScale(-SCALE_STEP));
  increase.addEventListener('click', () => changeScale(SCALE_STEP));
  render();

  return {
    setLanguage(nextTranslate) {
      t = nextTranslate;
      render();
    },
    apply(next) {
      if (!saving) {
        preferences = normalizeAppearance(next);
        render();
      }
    },
  };
}
