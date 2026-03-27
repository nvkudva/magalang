/**
 * MagaLang Playground — Core Application Logic
 * Supports real-time Kannada transliteration with Google Input Tools API.
 */
document.addEventListener("DOMContentLoaded", () => {
  const editor = document.getElementById("editor");
  const lineNumbers = document.getElementById("lineNumbers");
  const runBtn = document.getElementById("runBtn");
  const clearBtn = document.getElementById("clearBtn");
  const output = document.getElementById("output");
  const langEnBtn = document.getElementById("langEnBtn");
  const langKnBtn = document.getElementById("langKnBtn");
  const exampleCards = document.querySelectorAll(".example-card");

  const interpreter = new MagaInterpreter();
  let isKannadaMode = true; // Default to Kannada mode as requested
  let initialCode = `shuru maga
    // ಇಲ್ಲಿ ನಿಮ್ಮ MagaLang ಬರೆಯಿರಿ
    i = 1;
    repeat madu maga i <= 5 {
        helu maga "Count: " + i;
        i = i + 1;
    }
mugisu maga`;

  // --- Suggestions Dropdown State ---
  let suggestions = [];
  let selectedIndex = 0;
  let suggestionBox = null;
  let activeWord = "";
  let lastFetchTimestamp = 0;

  // --- Initialize UI ---
  function createSuggestionBox() {
    if (suggestionBox) return suggestionBox;
    suggestionBox = document.createElement("div");
    suggestionBox.className = "suggestions-dropdown";
    suggestionBox.style.display = "none";
    document.body.appendChild(suggestionBox);
    return suggestionBox;
  }

  // --- Suggestions Logic ---
  async function fetchSuggestions(text) {
    if (!text || text.trim().length === 0) return [];
    
    const timestamp = Date.now();
    lastFetchTimestamp = timestamp;

    try {
      // Use Google Input Tools API
      const url = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=kn-t-i0-und&num=8&cp=0&cs=1&ie=utf-8&oe=utf-8&app=magalang`;
      const response = await fetch(url);
      const data = await response.json();
      
      // Check if this is still the most recent request
      if (timestamp !== lastFetchTimestamp) return null;

      if (data && data[0] === "SUCCESS") {
        return data[1][0][1]; // The list of suggestions
      }
    } catch (e) {
      console.error("Transliteration fetch failed:", e);
      // Fallback to local transliteration if API fails
      if (typeof KannadaTranslit !== "undefined") {
        return [KannadaTranslit.transliterateWord(text)];
      }
    }
    return [];
  }

  function showSuggestions(word, rect) {
    if (!isKannadaMode || !word) {
      hideSuggestions();
      return;
    }

    fetchSuggestions(word).then((results) => {
      if (!results || results.length === 0) {
        hideSuggestions();
        return;
      }

      suggestions = results;
      selectedIndex = 0;
      activeWord = word;
      renderSuggestions(rect);
    });
  }

  function renderSuggestions(rect) {
    const box = createSuggestionBox();
    box.innerHTML = "";
    
    suggestions.forEach((s, i) => {
      const item = document.createElement("div");
      item.className = "suggestion-item" + (i === selectedIndex ? " selected" : "");
      item.innerHTML = `<span>${s}</span><span class="suggestion-index">${i + 1}</span>`;
      
      item.onclick = () => {
        selectSuggestion(i);
      };
      
      box.appendChild(item);
    });

    // Position near the cursor
    box.style.left = `${rect.left}px`;
    box.style.top = `${rect.bottom + 5}px`;
    box.style.display = "block";

    // Ensure it's on screen
    const boxRect = box.getBoundingClientRect();
    if (boxRect.right > window.innerWidth) {
      box.style.left = `${window.innerWidth - boxRect.width - 20}px`;
    }
    if (boxRect.bottom > window.innerHeight) {
      box.style.top = `${rect.top - boxRect.height - 5}px`;
    }
  }

  function hideSuggestions() {
    if (suggestionBox) {
      suggestionBox.style.display = "none";
    }
    suggestions = [];
    activeWord = "";
  }

  function selectSuggestion(index) {
    const word = suggestions[index];
    if (word) {
      replaceWordAtCursor(activeWord, word);
    }
    hideSuggestions();
  }

  // --- Editor Helpers ---
  function getCaretCoordinates() {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      return range.getBoundingClientRect();
    }
    return null;
  }

  function getCurrentWord() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return "";
    
    const range = sel.getRangeAt(0);
    const text = range.startContainer.textContent || "";
    const offset = range.startOffset;
    
    // Look backwards for word boundary
    let start = offset - 1;
    while (start >= 0 && /[a-zA-Z0-9']/.test(text[start])) {
      start--;
    }
    start++;
    
    return text.substring(start, offset);
  }

  function replaceWordAtCursor(oldWord, newWord) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    const offset = range.startOffset;
    
    // Find exact start of the word
    let start = offset - oldWord.length;
    
    // Update text node content
    const originalText = node.textContent;
    node.textContent = originalText.substring(0, start) + newWord + originalText.substring(offset);
    
    // Adjust cursor
    const newRange = document.createRange();
    newRange.setStart(node, start + newWord.length);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
    
    updateLineNumbers();
  }

  // --- Line Numbers ---
  function updateLineNumbers() {
    // Get text including line breaks
    const text = editor.innerText || editor.textContent;
    const lines = text.split(/\r\n|\r|\n/).length;
    lineNumbers.innerHTML = "";
    for (let i = 1; i <= lines; i++) {
      const span = document.createElement("span");
      span.textContent = i;
      lineNumbers.appendChild(span);
    }
  }

  // --- Event Listeners ---
  editor.addEventListener("input", (e) => {
    updateLineNumbers();
    
    if (!isKannadaMode) return;

    // Don't show if we just inserted a space or newline
    if (e.data === " " || e.data === "\n" || !e.data) {
      hideSuggestions();
      return;
    }

    const word = getCurrentWord();
    if (word && word.length > 0) {
      const rect = getCaretCoordinates();
      if (rect) {
        showSuggestions(word, rect);
      }
    } else {
      hideSuggestions();
    }
  });

  editor.addEventListener("keydown", (e) => {
    // Tab handling
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertText", false, "    ");
      return;
    }

    // Suggestions navigation
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % suggestions.length;
        renderSuggestions(getCaretCoordinates());
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + suggestions.length) % suggestions.length;
        renderSuggestions(getCaretCoordinates());
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        selectSuggestion(selectedIndex);
      } else if (e.key === " ") {
        // Space selects the first suggestion if box is open
        e.preventDefault();
        selectSuggestion(selectedIndex);
        document.execCommand("insertText", false, " ");
      } else if (e.key === "Escape") {
        hideSuggestions();
      }
    }
  });

  // Sync scroll
  editor.addEventListener("scroll", () => {
    lineNumbers.scrollTop = editor.scrollTop;
  });

  // --- Control Buttons ---
  runBtn.addEventListener("click", () => {
    const code = editor.innerText;
    output.innerText = "Running...\n";
    
    // Small delay to show "Running..."
    setTimeout(() => {
      try {
        const result = interpreter.interpret(code);
        output.innerText = result || "Program finished with no output.";
      } catch (err) {
        output.innerText = "Error: " + err.message;
      }
    }, 100);
  });

  clearBtn.addEventListener("click", () => {
    output.innerText = "";
  });

  // --- Language Toggle ---
  function setLanguage(lang) {
    if (lang === "kn") {
      isKannadaMode = true;
      langKnBtn.classList.add("active");
      langEnBtn.classList.remove("active");
      editor.classList.add("kannada-font");
      editor.setAttribute("data-placeholder", "ಇಲ್ಲಿ ನಿಮ್ಮ MagaLang ಬರೆಯಿರಿ...");
    } else {
      isKannadaMode = false;
      langEnBtn.classList.add("active");
      langKnBtn.classList.remove("active");
      editor.classList.remove("kannada-font");
      editor.setAttribute("data-placeholder", "Write your MagaLang here...");
      hideSuggestions();
    }
  }

  langEnBtn.addEventListener("click", () => setLanguage("en"));
  langKnBtn.addEventListener("click", () => setLanguage("kn"));

  // --- Examples ---
  exampleCards.forEach(card => {
    card.addEventListener("click", () => {
      let code = card.getAttribute("data-code");
      
      // If in Kannada mode, transliterate the example
      if (isKannadaMode) {
        if (typeof KannadaTranslit !== "undefined") {
          code = KannadaTranslit.transliterate(code);
        }
      }
      
      editor.innerText = code;
      updateLineNumbers();
      output.innerText = "Loaded example. Click Run to execute.";
    });
  });

  // Initial setup
  editor.innerText = initialCode;
  updateLineNumbers();
  setLanguage("kn");
});
