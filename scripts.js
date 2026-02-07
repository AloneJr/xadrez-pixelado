document.addEventListener("DOMContentLoaded", () => {
  const boardEl = document.querySelector("#board");

  if (!boardEl) {
    console.error('Não achei o elemento #board. Confere se existe: <div id="board" class="board"></div>');
    return;
  }

  // posição inicial (visual)
  const boardState = [
    ["r","n","b","q","k","b","n","r"],
    ["p","p","p","p","p","p","p","p"],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["P","P","P","P","P","P","P","P"],
    ["R","N","B","Q","K","B","N","R"],
  ];

  function isWhite(piece) {
    return piece && piece === piece.toUpperCase();
  }

  function pieceToClass(piece) {
    const map = { p: "pawn", r: "rook", n: "knight", b: "bishop", q: "queen", k: "king" };
    const color = isWhite(piece) ? "w" : "b";
    const type = map[piece.toLowerCase()];
    return `${color}-${type}`;
  }

  function renderBoard() {
    boardEl.innerHTML = "";

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = document.createElement("div");
        cell.className = "cell " + ((r + c) % 2 === 0 ? "light" : "dark");
        cell.dataset.r = String(r);
        cell.dataset.c = String(c);

        const piece = boardState[r][c];
        if (piece) {
          const pieceEl = document.createElement("div");
          pieceEl.className = "piece " + pieceToClass(piece) + (isWhite(piece) ? "" : " black");

          // random suave (se quiser)
          pieceEl.style.setProperty("--bobDur", (1.6 + Math.random() * 0.9).toFixed(2) + "s");
          pieceEl.style.setProperty("--bobDelay", (-Math.random() * 1.2).toFixed(2) + "s");
          pieceEl.style.setProperty("--bobAmp", (1 + Math.random() * 2).toFixed(2) + "px");

          cell.appendChild(pieceEl);
        }

        boardEl.appendChild(cell);
      }
    }
  }

  function setupUserCursor() {
    let cursorUser = document.querySelector("#cursor-user");

    if (!cursorUser) {
      cursorUser = document.createElement("div");
      cursorUser.id = "cursor-user";
      cursorUser.className = "cursor idle";
      document.body.appendChild(cursorUser);
    }

    window.addEventListener("mousemove", (e) => {
      cursorUser.style.left = e.clientX + "px";
      cursorUser.style.top = e.clientY + "px";
    });

    window.addEventListener("mousedown", () => {
      cursorUser.classList.remove("idle", "hold", "drop");
      cursorUser.classList.add("grab");
    });

    window.addEventListener("mouseup", () => {
      cursorUser.classList.remove("grab", "hold");
      cursorUser.classList.add("drop");

      setTimeout(() => {
        cursorUser.classList.remove("drop");
        cursorUser.classList.add("idle");
      }, 120);
    });
  }

  renderBoard();
  setupUserCursor();
});
