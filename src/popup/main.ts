import '../ui/styles.css';

const button = document.querySelector<HTMLButtonElement>('#settings');
button?.addEventListener('click', () => {
  void chrome.runtime.openOptionsPage();
});
