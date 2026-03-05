/**
 * Main application logic for the Maga-Code Playground.
 * Handles UI interactions, editor updates, and interpreter execution.
 */
document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const editor = document.getElementById("editor");
  const output = document.getElementById("output");
  const runBtn = document.getElementById("runBtn");
  const clearBtn = document.getElementById("clearBtn");
  const lineNumbers = document.getElementById("lineNumbers");
  const exampleCards = document.querySelectorAll(".example-card");

  const interpreter = new MagaInterpreter();

  // Initial code template
  const initialCode = `shuru maga
    helu maga "Namaskara Maga!";
    
    vayassu = 21;
    helu maga "Nanna vayassu: " + vayassu;
    
    maga vayassu >= 18 adre {
        helu maga "Major kano nuvvu!";
    } illandre maga {
        helu maga "Innu chikka magu kano nuvvu.";
    }
mugisu maga`;

  /**
   * Initializes the editor with the default template.
   */
  editor.value = initialCode;
  updateLineNumbers();

  /**
   * Updates the line number display based on the current editor content.
   */
  function updateLineNumbers() {
    const lines = editor.value.split("\n").length;
    lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join(
      "<br>",
    );
  }

  // Event Listeners
  editor.addEventListener("input", updateLineNumbers);

  /**
   * Syncs scrolling between the editor and line numbers.
   */
  editor.addEventListener("scroll", () => {
    lineNumbers.scrollTop = editor.scrollTop;
  });

  /**
   * Executes the code currently in the editor.
   */
  runBtn.addEventListener("click", () => {
    output.innerText = "Running...";
    // Small delay to provide visual feedback for 'Running...'
    setTimeout(() => {
      try {
        const result = interpreter.interpret(editor.value);
        output.innerText =
          result || "Program executed successfully (no output).";
      } catch (e) {
        output.innerText = "Error: " + e.message;
      }
    }, 100);
  });

  /**
   * Clears the terminal output area.
   */
  clearBtn.addEventListener("click", () => {
    output.innerText = "";
  });

  /**
   * Handles loading code examples from cards.
   */
  exampleCards.forEach((card) => {
    card.addEventListener("click", () => {
      const code = card.getAttribute("data-code");
      editor.value = code.trim();
      updateLineNumbers();
      output.innerText = "Loaded example. Click Run to execute.";

      // Visual feedback on click
      card.style.transform = "scale(0.95)";
      setTimeout(() => (card.style.transform = ""), 100);
    });
  });

  /**
   * Enhances the textarea with tab support for indentation.
   */
  editor.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      editor.value =
        editor.value.substring(0, start) + "    " + editor.value.substring(end);
      editor.selectionStart = editor.selectionEnd = start + 4;
    }
  });
});
