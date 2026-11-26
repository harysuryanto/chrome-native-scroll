import '../ui/styles.css';
import {
  addExcludedHost,
  clearExcludedHosts,
  removeExcludedHost,
  resetSettingsToDefaults,
  type NativeScrollSettings,
  type SiteMode,
} from '../shared/settings';
import { loadSettings, observeSettings, saveSettings } from '../shared/storage';

let settings: NativeScrollSettings | null = null;
let saving = false;

const enabledEl = document.querySelector<HTMLInputElement>('#enabled');
const defaultModeEl = document.querySelector<HTMLSelectElement>('#default-mode');
const strictWarningEl = document.querySelector<HTMLElement>('#strict-warning');
const restoreDefaultsBtn = document.querySelector<HTMLButtonElement>('#restore-defaults');
const cssEl = document.querySelector<HTMLInputElement>('#css');
const apisEl = document.querySelector<HTMLInputElement>('#apis');
const excludeForm = document.querySelector<HTMLFormElement>('#exclude-form');
const excludeInput = document.querySelector<HTMLInputElement>('#exclude-input');
const excludeAddBtn = document.querySelector<HTMLButtonElement>('#exclude-add');
const excludeClearBtn = document.querySelector<HTMLButtonElement>('#exclude-clear');
const excludeList = document.querySelector<HTMLUListElement>('#exclude-list');
const excludeEmpty = document.querySelector<HTMLElement>('#exclude-empty');
const messageEl = document.querySelector<HTMLElement>('#message');

function setStatus(text: string): void {
  if (messageEl) messageEl.textContent = text;
}

function renderExclusions(hosts: readonly string[]): void {
  if (!excludeList || !excludeEmpty || !excludeClearBtn) return;
  excludeList.textContent = '';
  excludeEmpty.hidden = hosts.length > 0;
  excludeClearBtn.disabled = saving || hosts.length === 0;

  for (const host of hosts) {
    const li = document.createElement('li');
    li.className = 'exclude-item';

    const span = document.createElement('span');
    span.className = 'exclude-host';
    span.textContent = host;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    removeBtn.disabled = saving;
    removeBtn.setAttribute('aria-label', `Remove ${host} from exclusions`);
    removeBtn.addEventListener('click', () => {
      updateSettings((current) => removeExcludedHost(current, host), `Removed ${host}.`);
    });

    li.append(span, removeBtn);
    excludeList.appendChild(li);
  }
}

function render(): void {
  if (!settings) return;
  if (enabledEl) {
    enabledEl.checked = settings.enabled;
    enabledEl.disabled = saving;
  }
  if (defaultModeEl) {
    defaultModeEl.value = settings.defaultMode;
    defaultModeEl.disabled = saving;
  }
  if (strictWarningEl) {
    strictWarningEl.hidden = settings.defaultMode !== 'strict';
  }
  if (restoreDefaultsBtn) restoreDefaultsBtn.disabled = saving;
  if (cssEl) {
    cssEl.checked = settings.features.cssSmoothScrolling;
    cssEl.disabled = saving;
  }
  if (apisEl) {
    apisEl.checked = settings.features.smoothScrollApis;
    apisEl.disabled = saving;
  }
  if (excludeAddBtn) excludeAddBtn.disabled = saving;
  if (excludeInput) excludeInput.disabled = saving;
  renderExclusions(settings.excludedHosts);
}

const unsubscribe = observeSettings((next) => {
  settings = next;
  render();
});
window.addEventListener('pagehide', unsubscribe, { once: true });

function updateSettings(
  mutator: (current: NativeScrollSettings) => NativeScrollSettings,
  successText = '',
): void {
  if (saving) return;
  saving = true;
  setStatus('');
  render();
  void (async () => {
    try {
      const current = await loadSettings();
      await saveSettings(mutator(current));
      settings = await loadSettings();
      if (successText) setStatus(successText);
    } catch (error) {
      setStatus('Unable to save settings.');
      console.warn('NativeScroll options save failed:', error);
    } finally {
      saving = false;
      render();
    }
  })();
}

enabledEl?.addEventListener('change', () => {
  const checked = enabledEl.checked;
  updateSettings((current) => ({ ...current, enabled: checked }));
});

cssEl?.addEventListener('change', () => {
  const checked = cssEl.checked;
  updateSettings((current) => ({
    ...current,
    features: { ...current.features, cssSmoothScrolling: checked },
  }));
});

apisEl?.addEventListener('change', () => {
  const checked = apisEl.checked;
  updateSettings((current) => ({
    ...current,
    features: { ...current.features, smoothScrollApis: checked },
  }));
});

excludeForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!excludeInput || !settings || saving) return;
  const raw = excludeInput.value;
  const preview = addExcludedHost(settings, raw);
  if (!preview.host) {
    setStatus('Enter a valid hostname such as example.com (no protocol, path, or wildcards).');
    excludeInput.focus();
    return;
  }
  const addedHost = preview.host;
  excludeInput.value = '';
  updateSettings((current) => addExcludedHost(current, addedHost).settings, `Excluded ${addedHost}.`);
});

defaultModeEl?.addEventListener('change', () => {
  const mode = defaultModeEl.value as SiteMode;
  updateSettings((current) => ({ ...current, defaultMode: mode }), `Default mode set to ${mode}.`);
});

restoreDefaultsBtn?.addEventListener('click', () => {
  updateSettings(() => resetSettingsToDefaults(), 'Restored default settings.');
});

excludeClearBtn?.addEventListener('click', () => {
  updateSettings((current) => clearExcludedHosts(current), 'Cleared all excluded websites.');
});

void loadSettings()
  .then((next) => {
    settings = next;
    render();
  })
  .catch((error: unknown) => {
    setStatus('Unable to load settings.');
    console.warn('NativeScroll options initialization failed:', error);
  });
