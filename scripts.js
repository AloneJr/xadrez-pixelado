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
          pieceEl.className =
            "piece " + pieceToClass(piece) + (isWhite(piece) ? "" : " black");

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
// Botão reset
// ----------------------------
const btnReset = document.querySelector("#btn-reset");
btnReset?.addEventListener("click", () => {
  // se estiver segurando peça, cancela
  if (holding) cancelHoldRestore();

  boardState = INITIAL_BOARD.map(row => row.slice());
  renderBoard();
  setCursor("idle");
});

// ----------------------------
// Botão tema (lua/sol + background)
// ----------------------------
const btnTema = document.querySelector("#btn-tema");
const temaIcone = document.querySelector("#tema-icone");

btnTema?.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  const isDark = document.body.classList.contains("dark");
  if (temaIcone) {
    temaIcone.src = isDark ? "assets/buttons/sun.png" : "assets/buttons/moon.png";
    temaIcone.alt = isDark ? "Tema claro" : "Tema escuro";
  }
});

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
  let heldPiece = "";   // letra (P, p, etc)
  let fromPos = null;   // {r,c}
  let floating = null;  // elemento flutuante
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

  function createFloatingPiece(pieceChar, startX, startY, cellSize) {
    const el = document.createElement("div");
    el.className = "floating-piece";

    // tamanho proporcional à célula (igual ao CSS 86%)
    const size = Math.floor(cellSize * 0.86);
    el.style.width = size + "px";
    el.style.height = size + "px";

    // imagem da peça: usa o PNG já existente
    const cls = pieceToClass(pieceChar); // ex: w-queen
    el.style.backgroundImage = `url("assets/pieces/${cls.replace("-", "_")}.png")`;

    el.style.left = startX + "px";
    el.style.top = startY + "px";

    document.body.appendChild(el);
    return el;
  }

  // Converte "w-queen" => "w_queen.png" (mesmo padrão dos seus assets)
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

    // só solta em casa vazia (como você pediu)
    if (boardState[r][c]) return;

    setCursor("drop");

    // alvo da animação (centro da casa destino)
    const { x: tx, y: ty } = cellCenter(cellEl);

    // anima a peça flutuante até o alvo
    floating.classList.add("dropping");
    floating.style.left = tx + "px";
    floating.style.top = ty + "px";

    // após animação, atualiza o estado e re-renderiza
    const finish = () => {
      floating?.removeEventListener("transitionend", finish);

      // move no "estado"
      boardState[fromPos.r][fromPos.c] = "";
      boardState[r][c] = heldPiece;

      // limpa
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

    // se segurando, peça flutuante segue o mouse (sem transição)
    if (holding && floating && !floating.classList.contains("dropping")) {
      floating.style.left = e.clientX + "px";
      floating.style.top = e.clientY + "px";
    }

    // estado do cursor quando NÃO está segurando
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
      // pegar se tiver peça
      if (boardState[r][c]) pickFromCell(cell);
      return;
    }

    // segurando: solta se vazio, senão ignora
    if (!boardState[r][c]) dropToCell(cell);
  });

  // Escape cancela “hold” (útil pra debug)
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && holding) cancelHoldRestore();
  });

  // ----------------------------
  // Start
  // ----------------------------
  renderBoard();
  setCursor("idle");
});
