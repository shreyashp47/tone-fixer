/**
 * Tone Fixer — Options Page Controller
 *
 * Manages provider selection and API key storage.
 * Keys are saved to chrome.storage.local under the "apiKeys" key
 * as { [providerId]: "the-api-key" }.
 */

/** Per-provider metadata: label, placeholder, and link to get a key. */
const PROVIDER_META = {
  anthropic: {
    label: 'Anthropic API Key',
    placeholder: 'sk-ant-...',
    link: 'https://console.anthropic.com/settings/keys',
    linkText: 'Get an Anthropic API key',
  },
  openai: {
    label: 'OpenAI API Key',
    placeholder: 'sk-proj-...',
    link: 'https://platform.openai.com/api-keys',
    linkText: 'Get an OpenAI API key',
  },
  google: {
    label: 'Google Gemini API Key',
    placeholder: 'AIza...',
    link: 'https://aistudio.google.com/apikey',
    linkText: 'Get a Gemini API key',
  },
  grok: {
    label: 'xAI API Key',
    placeholder: 'xai-...',
    link: 'https://console.x.ai',
    linkText: 'Get an xAI API key',
  },
  groq: {
    label: 'Groq API Key',
    placeholder: 'gsk_...',
    link: 'https://console.groq.com/keys',
    linkText: 'Get a Groq API key',
  },
};

document.addEventListener('DOMContentLoaded', () => {
  const providerSelect = document.getElementById('provider');
  const keyInput = document.getElementById('apiKey');
  const keyLabel = document.getElementById('keyLabel');
  const keyHint = document.getElementById('keyHint');
  const saveBtn = document.getElementById('save');
  const status = document.getElementById('status');
  const closeTab = document.getElementById('closeTab');
  const openPopupLink = document.getElementById('openPopupLink');

  if (closeTab) {
    closeTab.addEventListener('click', () => window.close());
  }

  if (openPopupLink) {
    openPopupLink.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.windows.create({ url: 'popup.html', type: 'popup', width: 400, height: 520 });
    });
  }

  function showStatus(msg, type) {
    status.textContent = msg;
    status.className = type;
    status.classList.add('visible');
  }

  function updateUI() {
    const id = providerSelect.value;
    const meta = PROVIDER_META[id];
    keyLabel.textContent = meta.label;
    keyInput.placeholder = meta.placeholder;
    keyHint.innerHTML = `<a href="${meta.link}" target="_blank">${meta.linkText}</a>`;
  }

  function loadKeyFor(id) {
    chrome.storage.local.get('apiKeys', (data) => {
      const keys = data.apiKeys || {};
      keyInput.value = keys[id] || PROVIDER_META[id]?.defaultKey || '';
    });
  }

  providerSelect.addEventListener('change', () => {
    loadKeyFor(providerSelect.value);
    updateUI();
  });

  chrome.storage.local.get(['selectedProvider', 'apiKeys'], (data) => {
    const provider = data.selectedProvider || 'groq';
    providerSelect.value = provider;
    loadKeyFor(provider);
    updateUI();
  });

  saveBtn.addEventListener('click', () => {
    const id = providerSelect.value;
    const key = keyInput.value.trim();
    if (!key) {
      showStatus('Please enter an API key.', 'error');
      return;
    }
    chrome.storage.local.get('apiKeys', (data) => {
      const keys = data.apiKeys || {};
      keys[id] = key;
      chrome.storage.local.set({ apiKeys: keys, selectedProvider: id }, () => {
        showStatus('Saved.', 'success');
      });
    });
  });

  updateUI();
});
