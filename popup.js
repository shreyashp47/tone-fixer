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

  // --- State ---
  let selectedTone = 'polite';
  let selectedTarget = 'teams';

  // --- Tone dropdown ---
  toneSelect.addEventListener('change', () => {
    selectedTone = toneSelect.value;
  });

  // --- Target buttons (Teams/Chat vs Email) ---
  if (targetGroup) {
    targetGroup.querySelectorAll('.target-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        targetGroup.querySelectorAll('.target-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        selectedTarget = btn.dataset.target;
      });
    });
  }

  // --- Load stored provider ---
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
  function setLoading(loading) {
    generateBtn.disabled = loading;
    generateBtn.textContent = loading ? 'Generating…' : 'Generate';
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
