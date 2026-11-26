import '../ui/styles.css';
import type { MainWorldDiagnostics } from '../shared/diagnostics';
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
const brandMark = document.querySelector<HTMLElement>('.brand-mark');
const siteEnabled = document.querySelector<HTMLInputElement>('#site-enabled');
const modeCards = Array.from(document.querySelectorAll<HTMLButtonElement>('.mode-card'));
const modeDefaultTitle = document.querySelector<HTMLElement>('#mode-default-title');
const strictWarning = document.querySelector<HTMLElement>('#strict-warning');
const diagnosticsPanel = document.querySelector<HTMLDetailsElement>('#diagnostics-panel');
const diagnosticsList = document.querySelector<HTMLUListElement>('#diagnostics-list');
const site = document.querySelector<HTMLElement>('#current-site');
const siteDetail = document.querySelector<HTMLElement>('#site-detail');
const physicsIndicator = document.querySelector<HTMLElement>('#physics-indicator');
const siteBadge = document.querySelector<HTMLElement>('#site-badge');
const message = document.querySelector<HTMLElement>('#message');
const versionEl = document.querySelector<HTMLElement>('#version');

let settings: NativeScrollSettings | null = null;
let activeTabId: number | null = null;
let tabSupport: TabSupportResult = {
  supported: false,
  hostname: null,
  reason: 'Checking current site…',
};
let tabState: {
  ready: boolean;
  active: boolean;
  cssOverrideActive?: boolean;
  diagnostics?: MainWorldDiagnostics | null;
} | null = null;
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

function renderDiagnostics(): void {
  if (!diagnosticsPanel || !diagnosticsList) return;
  if (!tabSupport.supported || !tabResponded || !tabState) {
    diagnosticsPanel.hidden = true;
    diagnosticsList.textContent = '';
    if (physicsIndicator) physicsIndicator.hidden = true;
    return;
  }

  diagnosticsPanel.hidden = false;
  diagnosticsList.textContent = '';

  const diag = tabState.diagnostics;
  if (physicsIndicator) {
    const detectedParts: string[] = [];
    if (diag) {
      for (const adapter of diag.adapters) {
        if (adapter.outcome !== 'not_detected') detectedParts.push(adapter.name);
      }
      if (diag.nonPassiveRootWheelListeners > 0) detectedParts.push('non-passive root wheel listener');
      if (diag.neutralizedApiCalls > 0) detectedParts.push('smooth scroll API');
    }
    if (detectedParts.length > 0) {
      physicsIndicator.textContent = `Custom scroll physics detected: ${detectedParts.join(', ')}`;
      physicsIndicator.hidden = false;
    } else {
      physicsIndicator.hidden = true;
    }
  }

  const addItem = (label: string, value: string) => {
    const li = document.createElement('li');
    li.textContent = `${label}: ${value}`;
    diagnosticsList.appendChild(li);
  };

  addItem('CSS override', tabState.cssOverrideActive ? 'successfully_neutralized' : 'not_tested');
  if (!diag) {
    addItem('MAIN-world diagnostics', 'not_tested');
    return;
  }

  addItem(
    'Smooth-scroll APIs',
    `${diag.apiPatchState} (${diag.neutralizedApiCalls} smooth calls neutralized)`,
  );
  addItem(
    'Root non-passive wheel listeners',
    `${diag.nonPassiveRootWheelListeners} (${diag.strictWheelActive ? 'strict guard active' : 'observing only'})`,
  );
  for (const adapter of diag.adapters) {
    addItem(adapter.name, `${adapter.outcome}${adapter.detail ? ` — ${adapter.detail}` : ''}`);
  }
}

function render(): void {
  if (!settings || !enabled || !siteEnabled || !site) return;

  enabled.disabled = saving;
  enabled.checked = settings.enabled;
  if (brandMark) {
    brandMark.dataset.disabled = String(!settings.enabled);
  }

  if (!tabSupport.supported) {
    site.textContent = 'Unsupported page';
    if (siteDetail) siteDetail.textContent = tabSupport.reason;
    siteEnabled.checked = false;
    siteEnabled.disabled = true;
    for (const card of modeCards) {
      card.disabled = true;
      card.setAttribute('aria-checked', 'false');
    }
    if (strictWarning) strictWarning.hidden = true;
    setBadge('Unsupported', 'muted');
    renderDiagnostics();
    return;
  }

  const host = tabSupport.hostname;
  const hostAllowed = isEnabledForHost({ ...settings, enabled: true }, host);
  const effectiveActive = isEnabledForHost(settings, host);
  const effectiveMode = getEffectiveMode(settings, host);
  const selectedMode = settings.siteModes[host] ?? 'default';

  site.textContent = host;
  siteEnabled.disabled = saving;
  siteEnabled.checked = hostAllowed;

  if (modeDefaultTitle) {
    const label = settings.defaultMode.charAt(0).toUpperCase() + settings.defaultMode.slice(1);
    modeDefaultTitle.textContent = `Use default (${label})`;
  }
  for (const card of modeCards) {
    card.disabled = saving || !hostAllowed;
    card.setAttribute('aria-checked', String(card.dataset.mode === selectedMode));
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
  renderDiagnostics();
}

const unsubscribe = observeSettings((next) => {
  settings = next;
  if (activeTabId !== null && tabSupport.supported) {
    void queryTabState(activeTabId).then(() => render());
  } else {
    render();
  }
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

for (const card of modeCards) {
  card.addEventListener('click', () => {
    if (!tabSupport.supported) return;
    const selected = tabSupport.hostname;
    const value = card.dataset.mode as SiteMode | 'default' | undefined;
    if (!value) return;
    void modify((current) => setSiteMode(current, selected, value));
  });
}

document.querySelector<HTMLButtonElement>('#settings')?.addEventListener('click', () => {
  void chrome.runtime.openOptionsPage();
});

async function queryTabState(tabId: number): Promise<void> {
  try {
    const response = (await chrome.tabs.sendMessage(tabId, { type: STATE_MESSAGE })) as {
      ready?: boolean;
      active?: boolean;
      cssOverrideActive?: boolean;
      diagnostics?: MainWorldDiagnostics | null;
    } | null;
    if (response && typeof response === 'object') {
      tabResponded = true;
      tabState = {
        ready: Boolean(response.ready),
        active: Boolean(response.active),
        cssOverrideActive: Boolean(response.cssOverrideActive),
        diagnostics: response.diagnostics ?? null,
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
      activeTabId = activeTab.id;
      await queryTabState(activeTab.id);
    }
    render();
  })
  .catch((error: unknown) => {
    if (message) message.textContent = 'Unable to load NativeScroll settings.';
    console.warn('NativeScroll popup initialization failed:', error);
  });
