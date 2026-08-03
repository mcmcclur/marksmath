export function setupNextTokenPredictor() {
  const endpoint = "https://faas-nyc1-2ef2e6cc.doserverless.co/api/v1/web/fn-1721edac-5db5-46c0-9e15-4bbf2cee7297/default/next-token";

  const promptInput = document.getElementById("prompt-text");
  const tokenateButton = document.getElementById("tokenate-button");
  const clearButton = document.getElementById("clear-button");
  const statusEl = document.getElementById("status");
  const tokenizedEl = document.getElementById("tokenized");
  const tableBody = document.querySelector("#tokens-table tbody");

  let activeController = null;
  let tokenizerEncodingPromise = null;
  let pendingActions = 0;

  function setStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.classList.toggle("ntv-error", isError);
  }

  function setGenericError() {
    setStatus("Error", true);
  }

  function beginAction() {
    pendingActions += 1;
    tokenateButton.disabled = true;
    clearButton.disabled = true;
  }

  function endAction() {
    pendingActions = Math.max(0, pendingActions - 1);
    if (pendingActions === 0) {
      tokenateButton.disabled = false;
      clearButton.disabled = false;
    }
  }

  function renderEmpty(message) {
    tableBody.innerHTML = "";
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 3;
    cell.className = "ntv-empty";
    cell.textContent = message;
    row.appendChild(cell);
    tableBody.appendChild(row);
  }

  function renderEmptyTokenization(message) {
    tokenizedEl.innerHTML = "";
    tokenizedEl.textContent = message;
    tokenizedEl.classList.add("ntv-tokenized-empty");
  }

  function formatToken(token) {
    if (token === undefined || token === null) return "";
    return String(token)
      .replaceAll("\n", "\\n")
      .replaceAll("\r", "\\r")
      .replaceAll("\t", "\\t");
  }

  function probabilityFromLogprob(logprob) {
    if (typeof logprob !== "number" || !Number.isFinite(logprob)) return null;
    return Math.exp(logprob);
  }

  function formatProbability(probability) {
    if (probability === null) return "n/a";
    if (probability >= 0.001) return `${(probability * 100).toFixed(3)}%`;
    return `${(probability * 100).toExponential(3)}%`;
  }

  function validateTokenRanges(tokens, prompt) {
    if (!tokens.length) return false;
    if (tokens[0].start !== 0) return false;
    if (tokens[tokens.length - 1].end !== prompt.length) return false;

    for (let index = 1; index < tokens.length; index += 1) {
      if (tokens[index].start !== tokens[index - 1].end) return false;
    }

    return true;
  }

  function renderTokenization(prompt, tokens) {
    tokenizedEl.innerHTML = "";
    tokenizedEl.classList.remove("ntv-tokenized-empty");

    tokens.forEach((token, index) => {
      const span = document.createElement("span");
      span.className = `ntv-token ntv-token-${index % 6}`;
      span.textContent = prompt.slice(token.start, token.end);
      span.title =
        token.id === undefined
          ? `Token ${index + 1}: characters ${token.start}-${token.end}`
          : `Token ${index + 1} · ID ${token.id}: characters ${token.start}-${token.end}`;
      tokenizedEl.appendChild(span);
    });
  }

  async function loadTokenizerEncoding() {
    if (!tokenizerEncodingPromise) {
      tokenizerEncodingPromise = import("https://esm.sh/js-tiktoken@1.0.21")
        .then(({ encodingForModel }) => encodingForModel("gpt-4o"));
    }

    return tokenizerEncodingPromise;
  }

  function tokenRangesFromEncoding(prompt, encoding) {
    const tokenIds = Array.from(encoding.encode(prompt));
    const pieces = tokenIds.map((id) => encoding.decode([id]));
    const reconstructed = pieces.join("");

    if (reconstructed !== prompt) {
      throw new Error("The tokenizer could not reconstruct this text cleanly.");
    }

    let start = 0;
    return pieces.map((piece, index) => {
      const end = start + piece.length;
      const token = {
        start,
        end,
        id: tokenIds[index]
      };
      start = end;
      return token;
    });
  }

  function containsControlCharacter(text) {
    return /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(text);
  }

  function looksLikeSpecialToken(text) {
    return /^<[^>\s]+>$/u.test(text) || text.includes("<turn|>") || text.includes("<|");
  }

  function shouldFilterToken(item) {
    const token = item.token;
    if (!token) return true;
    if (item.special) return true;
    if (token.includes("\ufffd")) return true;
    if (containsControlCharacter(token)) return true;
    if (looksLikeSpecialToken(token)) return true;

    // This visualizer is tuned for English prose. Remove clearly non-ASCII
    // tokens that usually come from multilingual tails in the distribution.
    if (/[^\x09\x0a\x0d\x20-\x7e]/u.test(token)) return true;

    return false;
  }

  function visibleContinuation(prompt, token) {
    if (/\s$/u.test(prompt)) {
      return token.replace(/^\s+/u, "");
    }
    return token;
  }

  function cleanAndMergeCandidates(prompt, items) {
    const merged = new Map();

    items.forEach((item) => {
      if (shouldFilterToken(item)) return;

      const continuation = visibleContinuation(prompt, item.token);
      if (!continuation || /^\s+$/u.test(continuation)) return;

      const probability = probabilityFromLogprob(item.logprob);
      if (probability === null) return;

      const key = continuation.replace(/\s+/gu, " ");
      const existing = merged.get(key);

      if (existing) {
        existing.probability += probability;
        existing.logprob = Math.log(existing.probability);
        existing.rawTokens.push(item.token);
      } else {
        merged.set(key, {
          continuation,
          probability,
          logprob: item.logprob,
          rawTokens: [item.token]
        });
      }
    });

    return Array.from(merged.values()).sort((a, b) => b.probability - a.probability);
  }

  function renderRows(items) {
    tableBody.innerHTML = "";

    items.slice(0, 10).forEach((item, index) => {
      const row = document.createElement("tr");

      const rankCell = document.createElement("td");
      rankCell.textContent = String(index + 1);

      const continuationCell = document.createElement("td");
      const continuationCode = document.createElement("code");
      continuationCode.textContent = formatToken(item.continuation);
      continuationCell.appendChild(continuationCode);

      const probabilityCell = document.createElement("td");
      probabilityCell.textContent = formatProbability(item.probability);

      row.append(rankCell, continuationCell, probabilityCell);
      tableBody.appendChild(row);
    });
  }

  function normalizeTopLogprobs(rawItems) {
    if (!Array.isArray(rawItems)) return [];

    return rawItems
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        return {
          token:
            item.token ??
            (Array.isArray(item.bytes)
              ? new TextDecoder().decode(new Uint8Array(item.bytes))
              : ""),
          logprob: item.logprob,
          special: item.special === true
        };
      })
      .filter((item) => item && typeof item.logprob === "number")
      .sort((a, b) => b.logprob - a.logprob);
  }

  function extractTopLogprobs(data) {
    const choice = data?.choices?.[0];
    const logprobs = choice?.logprobs;

    if (!logprobs) {
      throw new Error(
        "The response did not include logprobs. Try the paid fallback model or another provider route that supports logprobs."
      );
    }

    if (Array.isArray(logprobs.content) && logprobs.content.length > 0) {
      const firstPosition = logprobs.content.find((entry) => Array.isArray(entry?.top_logprobs));
      return normalizeTopLogprobs(firstPosition?.top_logprobs);
    }

    if (Array.isArray(logprobs.top_logprobs) && logprobs.top_logprobs.length > 0) {
      const firstPosition = logprobs.top_logprobs[0];
      if (Array.isArray(firstPosition)) {
        return normalizeTopLogprobs(firstPosition);
      }
      if (firstPosition && typeof firstPosition === "object") {
        return normalizeTopLogprobs(
          Object.entries(firstPosition).map(([token, logprob]) => ({ token, logprob }))
        );
      }
    }

    throw new Error(
      "The response used an unexpected logprobs shape. Open the browser console to inspect the raw response."
    );
  }

  async function logResponseDiagnostic(response) {
    const fallback = `${response.status} ${response.statusText}`.trim();

    try {
      const data = await response.json();
      if (data?.diagnostic) {
        console.debug("Token service diagnostic:", data.diagnostic);
      }
      console.debug(
        "Token service error:",
        data?.error?.message || data?.error || data?.message || fallback
      );
    } catch (_error) {
      try {
        console.debug("Token service error:", (await response.text()) || fallback);
      } catch (_textError) {
        console.debug("Token service error:", fallback);
      }
    }
  }

  async function fetchTokenization() {
    const prompt = promptInput.value;

    if (!prompt.trim()) {
      setGenericError();
      promptInput.focus();
      return;
    }

    beginAction();
    setStatus("Loading OpenAI tokenizer...");
    renderEmptyTokenization("Loading...");

    try {
      const encoding = await loadTokenizerEncoding();
      const tokens = tokenRangesFromEncoding(prompt, encoding);
      if (!validateTokenRanges(tokens, prompt)) {
        throw new Error("The tokenizer returned an invalid split. Try again.");
      }

      renderTokenization(prompt, tokens);
      setStatus(`Showing ${tokens.length} OpenAI-style token chunks.`);
    } catch (error) {
      console.error(error);
      renderEmptyTokenization("Error");
      setGenericError();
    } finally {
      endAction();
    }
  }

  async function fetchNextTokens() {
    const prompt = promptInput.value;

    if (!prompt.trim()) {
      setGenericError();
      promptInput.focus();
      return;
    }

    if (activeController) activeController.abort();
    activeController = new AbortController();

    beginAction();
    setStatus("Requesting next-token candidates...");
    renderEmpty("Loading...");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt }),
        signal: activeController.signal
      });

      if (!response.ok) {
        await logResponseDiagnostic(response);
        throw new Error("Token service request failed.");
      }

      const data = await response.json();
      console.debug("OpenRouter response:", data);

      const items = extractTopLogprobs(data);
      if (!items.length) {
        throw new Error(
          "The model returned logprobs, but no top token alternatives were present."
        );
      }

      const cleanedItems = cleanAndMergeCandidates(prompt, items);
      if (!cleanedItems.length) {
        throw new Error(
          "All returned token alternatives were filtered out. Try a different model or prompt."
        );
      }

      renderRows(cleanedItems);
      setStatus(
        `Showing ${Math.min(cleanedItems.length, 10)} likely next-token candidates.`
      );
    } catch (error) {
      if (error.name === "AbortError") {
        setGenericError();
      } else {
        console.error(error);
        renderEmpty("Error");
        setGenericError();
      }
    } finally {
      endAction();
      activeController = null;
    }
  }

  async function tokenate() {
    const prompt = promptInput.value;

    if (!prompt.trim()) {
      renderEmpty("Error");
      renderEmptyTokenization("Error");
      setGenericError();
      promptInput.focus();
      return;
    }

    await Promise.all([fetchTokenization(), fetchNextTokens()]);
  }

  tokenateButton.addEventListener("click", tokenate);

  clearButton.addEventListener("click", () => {
    promptInput.value = "";
    renderEmpty("");
    renderEmptyTokenization("");
    setStatus("Ready.");
    promptInput.focus();
  });

  promptInput.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      tokenate();
    }
  });
}
