/**
 * Tone Fixer — Popup UI Controller
 *
 * Handles all DOM interactions: tone selection, target selection,
 * generate button, copy button, error/success feedback, settings link.
 *
 * Depends on PROVIDERS and prompt() defined in providers.js (loaded first).
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM refs ---
  const inputText = document.getElementById('inputText');
  const outputText = document.getElementById('outputText');
  const outputStats = document.getElementById('outputStats');
  const generateBtn = document.getElementById('generateBtn');
  const copyBtn = document.getElementById('copyBtn');
  const toneSelect = document.getElementById('toneSelect');
  const targetGroup = document.getElementById('targetGroup');
  const errorMsg = document.getElementById('errorMsg');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const missingKeyNotice = document.getElementById('missingKeyNotice');
  const openOptionsLink = document.getElementById('openOptionsLink');
  const settingsLink = document.getElementById('settingsLink');
  const mainContent = document.getElementById('mainContent');
  const providerLabel = document.getElementById('providerLabel');
  const instructionInput = document.getElementById('instruction');
  const inputStats = document.getElementById('inputStats');

  // --- State ---
  let selectedTone = 'polite';
  let selectedTarget = 'teams';

  // --- Tone quick-pick pills ---
  const toneQuickPick = document.getElementById('toneQuickPick');
  if (toneQuickPick) {
    toneQuickPick.querySelectorAll('.tone-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        toneQuickPick.querySelectorAll('.tone-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        selectedTone = pill.dataset.tone;
        toneSelect.value = selectedTone;
        chrome.storage.local.set({ selectedTone });
      });
    });
  }

  // --- Tone dropdown ---
  toneSelect.addEventListener('change', () => {
    selectedTone = toneSelect.value;
    if (toneQuickPick) {
      toneQuickPick.querySelectorAll('.tone-pill').forEach((p) => {
        p.classList.toggle('active', p.dataset.tone === selectedTone);
      });
    }
    chrome.storage.local.set({ selectedTone });
  });

  // --- Target buttons (Teams/Chat vs Email) ---
  if (targetGroup) {
    targetGroup.querySelectorAll('.target-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        targetGroup.querySelectorAll('.target-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        selectedTarget = btn.dataset.target;
        chrome.storage.local.set({ selectedTarget });
      });
    });
  }

  // --- Load stored state ---
  chrome.storage.local.get(['selectedProvider', 'apiKeys', 'instructionText', 'selectedTone', 'selectedTarget'], (data) => {
    const id = data.selectedProvider || 'groq';
    const keys = data.apiKeys || {};
    const provider = PROVIDERS[id];
    provider.key = keys[id] || provider.defaultKey;

    if (providerLabel) providerLabel.textContent = provider.name;

    if (data.selectedTone && toneSelect) {
      toneSelect.value = data.selectedTone;
      selectedTone = data.selectedTone;
      if (toneQuickPick) {
        toneQuickPick.querySelectorAll('.tone-pill').forEach((p) => {
          p.classList.toggle('active', p.dataset.tone === selectedTone);
        });
      }
    }

    if (data.selectedTarget && targetGroup) {
      targetGroup.querySelectorAll('.target-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.target === data.selectedTarget);
      });
      selectedTarget = data.selectedTarget;
    }

    if (instructionInput && data.instructionText) {
      instructionInput.value = data.instructionText;
    }

    if (!provider.key) {
      missingKeyNotice.classList.remove('hidden');
      mainContent.classList.add('hidden');
    }
  });

  // --- Save instruction on every keystroke ---
  if (instructionInput) {
    instructionInput.addEventListener('input', () => {
      chrome.storage.local.set({ instructionText: instructionInput.value });
    });
  }

  // --- Live char counter + generate button state on input text ---
  if (inputText && inputStats) {
    const updateChars = () => {
      const len = inputText.value.length;
      inputStats.textContent = len + ' chars';
      generateBtn.classList.toggle('ready', len > 0);
    };
    inputText.addEventListener('input', updateChars);
    updateChars();
  }

  // --- Error helpers ---
  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
  }

  function hideError() {
    errorMsg.classList.add('hidden');
    errorMsg.textContent = '';
  }

  // --- Loading state ---
  const playIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
  const loadingIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>`;

  function setLoading(loading) {
    generateBtn.disabled = loading;
    generateBtn.innerHTML = loading ? loadingIcon : playIcon;
    loadingSpinner.classList.toggle('hidden', !loading);
  }

  // --- Generate handler ---
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
      showError('No API key found. Click the gear icon ⚙️ to add one.');
      return;
    }

    provider.key = apiKey;
    const instruction = instructionInput ? instructionInput.value.trim() : '';
    const req = provider.buildRequest(text, selectedTone, 1024, selectedTarget, instruction);

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
      const chars = outputText.value.length;
      const words = outputText.value.trim().split(/\s+/).filter(Boolean).length;
      outputStats.textContent = `${words} words · ${chars} chars`;
    } catch (err) {
      showError(`Network error: ${err.message}`);
    }

    setLoading(false);
  });

  // --- Copy button ---
  const copyIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  const checkIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

  copyBtn.addEventListener('click', async () => {
    const text = outputText.value;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.innerHTML = checkIcon;
      copyBtn.style.color = '#34d399';
      setTimeout(() => {
        copyBtn.innerHTML = copyIcon;
        copyBtn.style.color = '';
      }, 1500);
    } catch {
      showError('Failed to copy to clipboard.');
    }
  });

  // --- Settings (gear icon) ---
  settingsLink.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // --- Missing-key notice link ---
  if (openOptionsLink) {
    openOptionsLink.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });
  }
});
