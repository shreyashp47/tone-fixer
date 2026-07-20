const PROVIDERS = {
  anthropic: {
    name: 'Claude',
    buildRequest(text, tone, maxTokens, target) {
      return {
        url: 'https://api.anthropic.com/v1/messages',
        headers: {
          'x-api-key': this.key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt(text, tone, target) }],
        }),
      };
    },
    parseResponse(data) {
      return data.content[0].text;
    },
  },
  openai: {
    name: 'ChatGPT',
    buildRequest(text, tone, maxTokens, target) {
      return {
        url: 'https://api.openai.com/v1/chat/completions',
        headers: {
          'authorization': `Bearer ${this.key}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt(text, tone, target) }],
        }),
      };
    },
    parseResponse(data) {
      return data.choices[0].message.content;
    },
  },
  google: {
    name: 'Gemini',
    buildRequest(text, tone, maxTokens, target) {
      return {
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.key}`,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt(text, tone, target) }] }],
        }),
      };
    },
    parseResponse(data) {
      return data.candidates[0].content.parts[0].text;
    },
  },
  grok: {
    name: 'Grok',
    buildRequest(text, tone, maxTokens, target) {
      return {
        url: 'https://api.x.ai/v1/responses',
        headers: {
          'authorization': `Bearer ${this.key}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-4.5',
          max_output_tokens: maxTokens,
          input: prompt(text, tone, target),
        }),
      };
    },
    parseResponse(data) {
      return data.output[0].content[0].text;
    },
  },
  groq: {
    name: 'Groq',
    buildRequest(text, tone, maxTokens, target) {
      return {
        url: 'https://api.groq.com/openai/v1/chat/completions',
        headers: {
          'authorization': `Bearer ${this.key}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt(text, tone, target) }],
        }),
      };
    },
    parseResponse(data) {
      return data.choices[0].message.content;
    },
  },
};

function prompt(text, tone, target) {
  const targetHint = target === 'email'
    ? ' This will be sent as an email, so use proper email structure and formatting.'
    : ' This will be sent via a chat/messaging app (e.g. Teams), so keep it concise and conversational.';
  return `Rewrite the following text in a ${tone} tone. Fix any grammar or spelling mistakes.${targetHint} Return ONLY the rewritten text, nothing else, no preamble.\n\nText: ${text}`;
}

document.addEventListener('DOMContentLoaded', () => {
  const inputText = document.getElementById('inputText');
  const outputText = document.getElementById('outputText');
  const generateBtn = document.getElementById('generateBtn');
  const copyBtn = document.getElementById('copyBtn');
  const toneGroup = document.getElementById('toneGroup');
  const errorMsg = document.getElementById('errorMsg');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const missingKeyNotice = document.getElementById('missingKeyNotice');
  const openOptionsLink = document.getElementById('openOptionsLink');
  const settingsLink = document.getElementById('settingsLink');
  const mainContent = document.getElementById('mainContent');
  const providerLabel = document.getElementById('providerLabel');
  const targetGroup = document.getElementById('targetGroup');

  let selectedTone = 'polite';
  let selectedTarget = 'teams';

  toneGroup.querySelectorAll('.tone-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      toneGroup.querySelectorAll('.tone-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTone = btn.dataset.tone;
    });
  });
  toneGroup.querySelector('.tone-btn').classList.add('active');

  if (targetGroup) {
    targetGroup.querySelectorAll('.target-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        targetGroup.querySelectorAll('.target-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        selectedTarget = btn.dataset.target;
      });
    });
  }

  chrome.storage.local.get(['selectedProvider', 'apiKeys'], (data) => {
    const id = data.selectedProvider || 'groq';
    const keys = data.apiKeys || {};
    const provider = PROVIDERS[id];
    provider.key = keys[id] || provider.defaultKey;

    if (providerLabel) providerLabel.textContent = provider.name;

    if (!provider.key) {
      missingKeyNotice.classList.remove('hidden');
      mainContent.classList.add('hidden');
    }
  });

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
  }

  function hideError() {
    errorMsg.classList.add('hidden');
    errorMsg.textContent = '';
  }

  function setLoading(loading) {
    generateBtn.disabled = loading;
    generateBtn.textContent = loading ? 'Generating…' : 'Generate';
    loadingSpinner.classList.toggle('hidden', !loading);
  }

  generateBtn.addEventListener('click', async () => {
    hideError();

    const text = inputText.value.trim();
    if (!text) {
      showError('Please enter some text to rewrite.');
      return;
    }

    const data = await new Promise((r) => chrome.storage.local.get(['selectedProvider', 'apiKeys'], r));
    const id = data.selectedProvider || 'groq';
    const keys = data.apiKeys || {};
    const provider = PROVIDERS[id];
    const apiKey = keys[id] || provider.defaultKey;

    if (!apiKey) {
      showError('API key not set. Go to Settings to add one.');
      return;
    }

    provider.key = apiKey;
    const req = provider.buildRequest(text, selectedTone, 1024, selectedTarget);

    setLoading(true);

    try {
      const response = await fetch(req.url, {
        method: 'POST',
        headers: req.headers,
        body: req.body,
      });

      if (!response.ok) {
        let detail = `HTTP ${response.status}`;
        try {
          const errBody = await response.json();
          const msg = errBody.error?.message || errBody.error?.code || '';
          if (msg) detail = msg;
        } catch (_) {}
        showError(`API error: ${detail}`);
        setLoading(false);
        return;
      }

      const result = await response.json();
      outputText.value = provider.parseResponse(result);
    } catch (err) {
      showError(`Network error: ${err.message}`);
    }

    setLoading(false);
  });

  copyBtn.addEventListener('click', async () => {
    const text = outputText.value;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      const orig = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = orig; }, 1500);
    } catch {
      showError('Failed to copy to clipboard.');
    }
  });

  settingsLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  if (openOptionsLink) {
    openOptionsLink.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });
  }
});
