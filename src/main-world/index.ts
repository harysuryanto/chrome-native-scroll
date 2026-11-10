// MAIN-world entry point. This only responds to an unprivileged diagnostic
// event. It intentionally does not patch any website APIs yet (see issue #4).
// Do not expose extension secrets or privileged operations to the page.
document.addEventListener('native-scroll:diagnostic-ping', () => {
  document.dispatchEvent(new Event('native-scroll:main-world-ready'));
});
