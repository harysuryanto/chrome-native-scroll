// Event-driven Manifest V3 service worker; no timers or persistent loops.
chrome.runtime.onInstalled.addListener(() => {
  console.info('NativeScroll installed. Scrolling behavior is unchanged in this scaffold.');
});
