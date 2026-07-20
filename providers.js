/**
 * Tone Fixer — AI Provider Configurations
 *
 * Defines all supported AI providers and builds the prompt sent to each API.
 * Each provider implements:
 *   buildRequest(text, tone, maxTokens, target, instruction)
 *   parseResponse(data)
 */

/** Map of provider IDs to their display names, model info, and API details. */
const PROVIDERS = {
  anthropic: {
    name: 'Claude',
    buildRequest(text, tone, maxTokens, target, instruction) {
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
          messages: [{ role: 'user', content: prompt(text, tone, target, instruction) }],
        }),
      };
    },
    parseResponse(data) {
      return data.content[0].text;
    },
  },
  openai: {
    name: 'ChatGPT',
    buildRequest(text, tone, maxTokens, target, instruction) {
      return {
        url: 'https://api.openai.com/v1/chat/completions',
        headers: {
          'authorization': `Bearer ${this.key}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt(text, tone, target, instruction) }],
        }),
      };
    },
    parseResponse(data) {
      return data.choices[0].message.content;
    },
  },
  google: {
    name: 'Gemini',
    buildRequest(text, tone, maxTokens, target, instruction) {
      return {
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.key}`,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt(text, tone, target, instruction) }] }],
        }),
      };
    },
    parseResponse(data) {
      return data.candidates[0].content.parts[0].text;
    },
  },
  grok: {
    name: 'Grok',
    buildRequest(text, tone, maxTokens, target, instruction) {
      return {
        url: 'https://api.x.ai/v1/responses',
        headers: {
          'authorization': `Bearer ${this.key}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-4.5',
          max_output_tokens: maxTokens,
          input: prompt(text, tone, target, instruction),
        }),
      };
    },
    parseResponse(data) {
      return data.output[0].content[0].text;
    },
  },
  groq: {
    name: 'Groq',
    buildRequest(text, tone, maxTokens, target, instruction) {
      return {
        url: 'https://api.groq.com/openai/v1/chat/completions',
        headers: {
          'authorization': `Bearer ${this.key}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt(text, tone, target, instruction) }],
        }),
      };
    },
    parseResponse(data) {
      return data.choices[0].message.content;
    },
  },
};

/**
 * Build the prompt string sent to the AI.
 * @param {string} text - The user's input text to rewrite.
 * @param {string} tone - 'polite' | 'casual' | 'formal'
 * @param {string} target - 'teams' | 'email'  (determines format hint)
 * @param {string} instruction - Optional custom instruction from the user.
 * @returns {string} The full prompt.
 */
function prompt(text, tone, target, instruction) {
  const targetHint = target === 'email'
    ? ' This will be sent as an email, so use proper email structure and formatting.'
    : ' This will be sent via a chat/messaging app (e.g. Teams), so keep it concise and conversational.';
  const instr = instruction ? ` Additional instructions: ${instruction}` : '';
  return `Rewrite the following text in a ${tone} tone. Fix any grammar or spelling mistakes.${targetHint}${instr} Return ONLY the rewritten text, nothing else, no preamble.\n\nText: ${text}`;
}
