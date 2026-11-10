import '../ui/styles.css';
import { type NativeScrollSettings } from '../shared/settings';
import { loadSettings, observeSettings, saveSettings } from '../shared/storage';

let settings: NativeScrollSettings | null = null;
let saving = false;
const selectors = {
  enabled: '#enabled',
  cssSmoothScrolling: '#css',
  smoothScrollApis: '#apis',
  wheelOptimization: '#wheel',
  libraryAdapters: '#libraries',
} as const;

function control(selector: string): HTMLInputElement | null {
  return document.querySelector<HTMLInputElement>(selector);
}

function render(): void {
  if (!settings) return;
  const global = control(selectors.enabled);
  if (global) {
    global.checked = settings.enabled;
    global.disabled = saving;
  }
  for (const feature of Object.keys(settings.features) as (keyof NativeScrollSettings['features'])[]) {
    const element = control(selectors[feature]);
    if (element) element.checked = settings.features[feature];
    // Feature toggles stay disabled until their implementations ship.
  }
}

const unsubscribe = observeSettings((next) => {
  settings = next;
  render();
});
window.addEventListener('pagehide', unsubscribe, { once: true });

control(selectors.enabled)?.addEventListener('change', () => {
  const element = control(selectors.enabled);
  if (!element || saving) return;
  saving = true;
  render();
  void (async () => {
    try {
      const current = await loadSettings();
      await saveSettings({ ...current, enabled: element.checked });
      settings = await loadSettings();
    } catch (error) {
      document.querySelector<HTMLElement>('#message')!.textContent = 'Unable to save settings.';
      console.warn('NativeScroll options save failed:', error);
    } finally {
      saving = false;
      render();
    }
  })();
});

void loadSettings().then((next) => {
  settings = next;
  render();
}).catch((error: unknown) => {
  document.querySelector<HTMLElement>('#message')!.textContent = 'Unable to load settings.';
  console.warn('NativeScroll options initialization failed:', error);
});
