document.addEventListener("DOMContentLoaded", () => {
  const boardEl = document.querySelector("#board");
  if (!boardEl) return;

  // ----------------------------
  // Estado visual do tabuleiro
  // ----------------------------
  const INITIAL_BOARD = [
    ["r","n","b","q","k","b","n","r"],
    ["p","p","p","p","p","p","p","p"],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["P","P","P","P","P","P","P","P"],
    ["R","N","B","Q","K","B","N","R"],
  ];

  let boardState = INITIAL_BOARD.map(row => row.slice());

  // ----------------------------
  // Helpers
  // ----------------------------
  function isWhite(piece) {
    return piece && piece === piece.toUpperCase();
  }

  function pieceToClass(piece) {
    const map = { p: "pawn", r: "rook", n: "knight", b: "bishop", q: "queen", k: "king" };
    const color = isWhite(piece) ? "w" : "b";
    const type = map[piece.toLowerCase()];
    return `${color}-${type}`;
  }

  // Retorna o centro (x,y) de uma célula
  function cellCenter(cellEl) {
    const rect = cellEl.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, size: rect.width };
  }

  // ----------------------------
  // Render
  // ----------------------------
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

          // random suave (balanço)
          pieceEl.style.setProperty("--bobDur", (1.6 + Math.random() * 0.9).toFixed(2) + "s");
          pieceEl.style.setProperty("--bobDelay", (-Math.random() * 1.2).toFixed(2) + "s");
          pieceEl.style.setProperty("--bobAmp", (1 + Math.random() * 2).toFixed(2) + "px");

          cell.appendChild(pieceEl);
        }

        boardEl.appendChild(cell);
      }
    }
  }

  // ----------------------------
  // Cursor falso (user)
  // ----------------------------
  let cursorUser = document.querySelector("#cursor-user");
  if (!cursorUser) {
    cursorUser = document.createElement("div");
    cursorUser.id = "cursor-user";
    cursorUser.className = "cursor idle";
    document.body.appendChild(cursorUser);
  }

  function setCursor(state) {
    cursorUser.classList.remove("idle", "grab", "hold", "drop");
    cursorUser.classList.add(state);
  }

  // ----------------------------
  // “Pick & Drop” visual
  // ----------------------------
  let holding = false;
  let heldPiece = "";
  let fromPos = null;
  let floating = null;
  let lastMouse = { x: 0, y: 0 };

  function getCellFromEventTarget(target) {
    return target?.closest?.(".cell") || null;
  }

  function hasPieceAt(r, c) {
    return !!boardState[r][c];
  }

  function cellHasPiece(cellEl) {
    const r = Number(cellEl.dataset.r);
    const c = Number(cellEl.dataset.c);
    return hasPieceAt(r, c);
  }

  function pieceClassToFile(pieceChar) {
    const cls = pieceToClass(pieceChar); // w-queen
    return `${cls.replace("-", "_")}.png`; // w_queen.png
  }

  function pickFromCell(cellEl) {
    const r = Number(cellEl.dataset.r);
    const c = Number(cellEl.dataset.c);

    const piece = boardState[r][c];
    if (!piece) return;

    holding = true;
    heldPiece = piece;
    fromPos = { r, c };

    // esconde peça original (só visual)
    const pieceDom = cellEl.querySelector(".piece");
    if (pieceDom) pieceDom.classList.add("hidden");

    // cria peça flutuante no centro da célula
    const { x, y, size } = cellCenter(cellEl);
    floating = document.createElement("div");
    floating.className = "floating-piece";

    const px = Math.floor(size * 0.86);
    floating.style.width = px + "px";
    floating.style.height = px + "px";
    floating.style.backgroundImage = `url("assets/pieces/${pieceClassToFile(piece)}")`;
    floating.style.left = x + "px";
    floating.style.top = y + "px";
    document.body.appendChild(floating);

    setCursor("hold");
  }

  function cancelHoldRestore() {
    if (!fromPos) return;

    const fromCell = boardEl.querySelector(
      `.cell[data-r="${fromPos.r}"][data-c="${fromPos.c}"]`
    );
    if (fromCell) {
      const pieceDom = fromCell.querySelector(".piece");
      if (pieceDom) pieceDom.classList.remove("hidden");
    }

    if (floating) {
      floating.remove();
      floating = null;
    }

    holding = false;
    heldPiece = "";
    fromPos = null;
    setCursor("idle");
  }

  function dropToCell(cellEl) {
    const r = Number(cellEl.dataset.r);
    const c = Number(cellEl.dataset.c);

    // só solta em casa vazia
    if (boardState[r][c]) return;

    setCursor("drop");

    // alvo da animação (centro da casa destino)
    const { x: tx, y: ty } = cellCenter(cellEl);

    // anima até o alvo
    floating.classList.add("dropping");
    floating.style.left = tx + "px";
    floating.style.top = ty + "px";

    const finish = () => {
      floating?.removeEventListener("transitionend", finish);

      boardState[fromPos.r][fromPos.c] = "";
      boardState[r][c] = heldPiece;

      floating?.remove();
      floating = null;

      holding = false;
      heldPiece = "";
      fromPos = null;

      renderBoard();
      setCursor("idle");
    };

    floating.addEventListener("transitionend", finish);
  }

  // ----------------------------
  // Mouse: mover cursor e hover states
  // ----------------------------
  window.addEventListener("mousemove", (e) => {
    lastMouse.x = e.clientX;
    lastMouse.y = e.clientY;

    cursorUser.style.left = e.clientX + "px";
    cursorUser.style.top = e.clientY + "px";

    // se segurando, peça flutuante segue o mouse
    if (holding && floating && !floating.classList.contains("dropping")) {
      floating.style.left = e.clientX + "px";
      floating.style.top = e.clientY + "px";
    }

    // cursor: grab quando passa por peça
    if (!holding) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const cell = el?.closest?.(".cell");
      if (cell && cellHasPiece(cell)) setCursor("grab");
      else setCursor("idle");
    }
  });

  // Clique: pegar ou soltar
  boardEl.addEventListener("click", (e) => {
    const cell = getCellFromEventTarget(e.target);
    if (!cell) return;

    const r = Number(cell.dataset.r);
    const c = Number(cell.dataset.c);

    if (!holding) {
      if (boardState[r][c]) pickFromCell(cell);
      return;
    }

    if (!boardState[r][c]) dropToCell(cell);
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && holding) cancelHoldRestore();
  });

  // ==================================================
  // UI: Reset / Tema / Easter Egg Terraria
  // ==================================================

  const btnReset = document.querySelector("#btn-reset");
  const btnTema = document.querySelector("#btn-tema");
  const temaIcone = document.querySelector("#tema-icone");

  // flag: se arrastou, não troca tema no click
  let temaDraggedRecently = false;

  // Easter egg: só 1 vez até reset/reload
  let eggSpawned = false;

  function isSunShowing() {
    // checa se o ícone atual é o sol
    return !!temaIcone && temaIcone.src.includes("sun.png");
  }

  function spawnTerrariaEggOnce() {
    if (eggSpawned) return;
    eggSpawned = true;

    const tree = document.createElement("img");
    tree.src = "assets/bg/e_tree.png";
    tree.alt = "Terraria easter egg";
    tree.className = "e-tree";

    const tip = document.createElement("div");
    tip.className = "e-tree-tooltip";
    tip.textContent = "Entendeu a referência?";

    document.body.appendChild(tree);
    document.body.appendChild(tip);

    const audio = new Audio("assets/sfx/toasty_egg.mp3");
    audio.volume = 0.8;
    audio.play().catch(() => {});
  }

  function removeTerrariaEgg() {
    document.querySelectorAll(".e-tree, .e-tree-tooltip").forEach(el => el.remove());
    eggSpawned = false;
  }

  // Reset: volta board e remove egg
  btnReset?.addEventListener("click", () => {
    if (holding) cancelHoldRestore();
    removeTerrariaEgg();

    boardState = INITIAL_BOARD.map(row => row.slice());
    renderBoard();
    setCursor("idle");
  });

  // Clique no tema: só troca se NÃO houve drag
  btnTema?.addEventListener("click", () => {
    if (temaDraggedRecently) {
      temaDraggedRecently = false;
      return;
    }

    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");

    if (temaIcone) {
      temaIcone.src = isDark ? "assets/buttons/sun.png" : "assets/buttons/moon.png";
      temaIcone.alt = isDark ? "Tema claro" : "Tema escuro";
    }
  });

  // Drag do botão tema: funciona com sol OU lua
  let draggingTema = false;
  let dragStarted = false;
  let startX = 0, startY = 0;

  function beginDragTema(e) {
    draggingTema = true;
    dragStarted = false;
    temaDraggedRecently = false;

    btnTema.classList.remove("returning");
    btnTema.classList.add("dragging");

    const p = e.touches ? e.touches[0] : e;
    startX = p.clientX;
    startY = p.clientY;
  }

  function moveDragTema(e) {
    if (!draggingTema) return;

    const p = e.touches ? e.touches[0] : e;
    const dx = p.clientX - startX;
    const dy = p.clientY - startY;

    // Só vira "drag de verdade" depois do threshold
    if (!dragStarted && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      dragStarted = true;
      temaDraggedRecently = true;

      // ✅ Easter egg acontece APENAS quando estiver com o SOL
      if (isSunShowing()) spawnTerrariaEggOnce();
    }

    btnTema.style.transform = `translate(${dx}px, ${dy}px)`;

    if (e.cancelable) e.preventDefault();
  }

  function endDragTema() {
    if (!draggingTema) return;
    draggingTema = false;

    btnTema.classList.remove("dragging");
    btnTema.classList.add("returning");
    btnTema.style.transform = `translate(0px, 0px)`;

    setTimeout(() => btnTema.classList.remove("returning"), 240);

    // evita click fantasma
    setTimeout(() => { temaDraggedRecently = false; }, 0);
  }

  if (btnTema) {
    btnTema.addEventListener("mousedown", beginDragTema);
    window.addEventListener("mousemove", moveDragTema);
    window.addEventListener("mouseup", endDragTema);

    btnTema.addEventListener("touchstart", beginDragTema, { passive: false });
    window.addEventListener("touchmove", moveDragTema, { passive: false });
    window.addEventListener("touchend", endDragTema);
  }

  // ----------------------------
  // Start
  // ----------------------------
  renderBoard();
  setCursor("idle");
});
