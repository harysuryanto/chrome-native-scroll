// Isolated-world entry point. Scrolling logic and extension messaging are
// implemented in follow-up issues; this harmless ping supports QA of the shell.
chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    message.type === 'native-scroll:ping'
  ) {
    sendResponse({ ready: true });
  }
});
