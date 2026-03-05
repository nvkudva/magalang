document.addEventListener("DOMContentLoaded", () => {
  const editor = document.getElementById("editor");
  const output = document.getElementById("output");
  const runBtn = document.getElementById("runBtn");
  const clearBtn = document.getElementById("clearBtn");
  const lineNumbers = document.getElementById("lineNumbers");
  const exampleCards = document.querySelectorAll(".example-card");

  const interpreter = new MagaInterpreter();

  // Initial code
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

  editor.value = initialCode;
  updateLineNumbers();

  function updateLineNumbers() {
    const lines = editor.value.split("\n").length;
    lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join(
      "<br>",
    );
  }

  editor.addEventListener("input", updateLineNumbers);
  editor.addEventListener("scroll", () => {
    lineNumbers.scrollTop = editor.scrollTop;
  });

  runBtn.addEventListener("click", () => {
    output.innerText = "Running...";
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

  clearBtn.addEventListener("click", () => {
    output.innerText = "";
  });

  exampleCards.forEach((card) => {
    card.addEventListener("click", () => {
      const code = card.getAttribute("data-code");
      editor.value = code.trim();
      updateLineNumbers();
      output.innerText = "Loaded example. Click Run to execute.";

      // Visual feedback
      card.style.transform = "scale(0.95)";
      setTimeout(() => (card.style.transform = ""), 100);
    });
  });

  // Support tab key in textarea
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
