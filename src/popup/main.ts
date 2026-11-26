import '../ui/styles.css';
import {
  isEnabledForHost,
  normalizeHostname,
  type NativeScrollSettings,
} from '../shared/settings';
import { loadSettings, observeSettings, saveSettings } from '../shared/storage';

const enabled = document.querySelector<HTMLInputElement>('#enabled');
const siteEnabled = document.querySelector<HTMLInputElement>('#site-enabled');
const site = document.querySelector<HTMLElement>('#current-site');
const message = document.querySelector<HTMLElement>('#message');

let settings: NativeScrollSettings | null = null;
let hostname: string | null = null;
let saving = false;

function render(): void {
  if (!settings || !enabled || !siteEnabled || !site) return;
  enabled.disabled = saving;
  enabled.checked = settings.enabled;
  siteEnabled.disabled = saving || !hostname;
  siteEnabled.checked = Boolean(hostname && isEnabledForHost(
    { ...settings, enabled: true }, hostname,
  ));
  site.textContent = hostname ? `Website: ${hostname}` : 'This page does not support NativeScroll.';
}

const unsubscribe = observeSettings((next) => {
  settings = next;
  render();
});
window.addEventListener('pagehide', unsubscribe, { once: true });

async function modify(mutator: (current: NativeScrollSettings) => NativeScrollSettings): Promise<void> {
  if (!settings || saving) return;
  saving = true;
  if (message) message.textContent = '';
  render();
  try {
    const latest = await loadSettings();
    await saveSettings(mutator(latest));
    settings = await loadSettings();
  } catch (error) {
    if (message) message.textContent = 'Failed to save settings. Please retry.';
    console.warn('NativeScroll settings update failed:', error);
  } finally {
    saving = false;
    render();
  }
}

enabled?.addEventListener('change', () => {
  const checked = enabled.checked;
  void modify((current) => ({ ...current, enabled: checked }));
});

siteEnabled?.addEventListener('change', () => {
  if (!hostname) return;
  const selected = hostname;
  const checked = siteEnabled.checked;
  void modify((current) => ({
    ...current,
    excludedHosts: checked
      ? current.excludedHosts.filter((host) => host !== selected)
      : [...current.excludedHosts.filter((host) => host !== selected), selected],
  }));
});

document.querySelector<HTMLButtonElement>('#settings')?.addEventListener('click', () => {
  void chrome.runtime.openOptionsPage();
});

void Promise.all([loadSettings(), chrome.tabs.query({ active: true, currentWindow: true })])
  .then(([loaded, tabs]) => {
    settings = loaded;
    try {
      const url = tabs[0]?.url;
      hostname = url ? normalizeHostname(new URL(url).hostname) : null;
    } catch {
      hostname = null;
    }
    render();
  }).catch((error: unknown) => {
    if (message) message.textContent = 'Unable to load NativeScroll settings.';
    console.warn('NativeScroll popup initialization failed:', error);
  });
