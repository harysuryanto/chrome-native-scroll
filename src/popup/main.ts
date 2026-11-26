import '../ui/styles.css';
import { STATE_MESSAGE } from '../shared/messages';
import {
  getEffectiveMode,
  isEnabledForHost,
  setSiteMode,
  type NativeScrollSettings,
  type SiteMode,
} from '../shared/settings';
import { loadSettings, observeSettings, saveSettings } from '../shared/storage';
import { classifyTabUrl, type TabSupportResult } from '../shared/url';

const enabled = document.querySelector<HTMLInputElement>('#enabled');
const siteEnabled = document.querySelector<HTMLInputElement>('#site-enabled');
const siteModeSelect = document.querySelector<HTMLSelectElement>('#site-mode');
const strictWarning = document.querySelector<HTMLElement>('#strict-warning');
const site = document.querySelector<HTMLElement>('#current-site');
const siteDetail = document.querySelector<HTMLElement>('#site-detail');
const siteBadge = document.querySelector<HTMLElement>('#site-badge');
const message = document.querySelector<HTMLElement>('#message');
const versionEl = document.querySelector<HTMLElement>('#version');

let settings: NativeScrollSettings | null = null;
let tabSupport: TabSupportResult = {
  supported: false,
  hostname: null,
  reason: 'Checking current site…',
};
let tabState: { ready: boolean; active: boolean; cssOverrideActive?: boolean } | null = null;
let tabResponded = false;
let saving = false;

if (versionEl) {
  const version = chrome.runtime.getManifest?.().version ?? '0.1.0';
  versionEl.textContent = `v${version}`;
}

function setBadge(label: string, state: 'active' | 'muted' | 'warn' | 'neutral'): void {
  if (!siteBadge) return;
  siteBadge.textContent = label;
  siteBadge.dataset.state = state;
}

function render(): void {
  if (!settings || !enabled || !siteEnabled || !site) return;

  enabled.disabled = saving;
  enabled.checked = settings.enabled;

  if (!tabSupport.supported) {
    site.textContent = 'Unsupported page';
    if (siteDetail) siteDetail.textContent = tabSupport.reason;
    siteEnabled.checked = false;
    siteEnabled.disabled = true;
    if (siteModeSelect) {
      siteModeSelect.value = 'default';
      siteModeSelect.disabled = true;
    }
    if (strictWarning) strictWarning.hidden = true;
    setBadge('Unsupported', 'muted');
    return;
  }

  const host = tabSupport.hostname;
  const hostAllowed = isEnabledForHost({ ...settings, enabled: true }, host);
  const effectiveActive = isEnabledForHost(settings, host);
  const effectiveMode = getEffectiveMode(settings, host);

  site.textContent = host;
  siteEnabled.disabled = saving;
  siteEnabled.checked = hostAllowed;

  if (siteModeSelect) {
    siteModeSelect.disabled = saving || !hostAllowed;
    siteModeSelect.value = settings.siteModes[host] ?? 'default';
  }
  if (strictWarning) {
    strictWarning.hidden = !(effectiveActive && effectiveMode === 'strict');
  }

  if (!settings.enabled) {
    setBadge('Disabled', 'muted');
    if (siteDetail) siteDetail.textContent = 'NativeScroll is turned off globally.';
  } else if (!hostAllowed) {
    setBadge('Excluded', 'warn');
    if (siteDetail) siteDetail.textContent = 'Original website scrolling is preserved on this host.';
  } else if (!tabResponded) {
    setBadge('Reload needed', 'warn');
    if (siteDetail) {
      siteDetail.textContent = 'Reload this tab to activate NativeScroll on already-open pages.';
    }
  } else if (effectiveActive && tabState?.ready) {
    setBadge('Active', 'active');
    if (siteDetail) {
      siteDetail.textContent = 'CSS and smooth-scroll APIs normalized on this host.';
    }
  } else {
    setBadge('Active', 'active');
    if (siteDetail) siteDetail.textContent = 'Enabled for this host.';
  }
}

const unsubscribe = observeSettings((next) => {
  settings = next;
  render();
});
window.addEventListener('pagehide', unsubscribe, { once: true });

async function modify(
  mutator: (current: NativeScrollSettings) => NativeScrollSettings,
): Promise<void> {
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
  if (!tabSupport.supported) return;
  const selected = tabSupport.hostname;
  const checked = siteEnabled.checked;
  void modify((current) => ({
    ...current,
    excludedHosts: checked
      ? current.excludedHosts.filter((host) => host !== selected)
      : [...current.excludedHosts.filter((host) => host !== selected), selected],
  }));
});

siteModeSelect?.addEventListener('change', () => {
  if (!tabSupport.supported) return;
  const selected = tabSupport.hostname;
  const value = siteModeSelect.value as SiteMode | 'default';
  void modify((current) => setSiteMode(current, selected, value));
});

document.querySelector<HTMLButtonElement>('#settings')?.addEventListener('click', () => {
  void chrome.runtime.openOptionsPage();
});

async function queryTabState(tabId: number): Promise<void> {
  try {
    const response = (await chrome.tabs.sendMessage(tabId, { type: STATE_MESSAGE })) as {
      ready?: boolean;
      active?: boolean;
      cssOverrideActive?: boolean;
    } | null;
    if (response && typeof response === 'object') {
      tabResponded = true;
      tabState = {
        ready: Boolean(response.ready),
        active: Boolean(response.active),
        cssOverrideActive: Boolean(response.cssOverrideActive),
      };
    }
  } catch {
    tabResponded = false;
    tabState = null;
  }
}

void Promise.all([loadSettings(), chrome.tabs.query({ active: true, currentWindow: true })])
  .then(async ([loaded, tabs]) => {
    settings = loaded;
    const activeTab = tabs[0];
    tabSupport = classifyTabUrl(activeTab?.url);
    if (tabSupport.supported && typeof activeTab?.id === 'number') {
      await queryTabState(activeTab.id);
    }
    render();
  })
  .catch((error: unknown) => {
    if (message) message.textContent = 'Unable to load NativeScroll settings.';
    console.warn('NativeScroll popup initialization failed:', error);
  });
