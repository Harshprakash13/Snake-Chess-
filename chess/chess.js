(() => {
  // DOM
  const boardEl = document.getElementById('board')
  const statusEl = document.getElementById('status')
  const resetBtn = document.getElementById('resetBtn')
  const undoBtn = document.getElementById('undoBtn')
  const flipBtn = document.getElementById('flipBtn')
  const difficultySelect = document.getElementById('difficulty')
  const askPromotionCB = document.getElementById('askPromotion')
  const moveListEl = document.getElementById('moveList')

  // Game state
  let board = []
  let turn = 'w'
  let enPassant = null // [r,c] of square that can be captured en-passant
  let castlingRights = { wK: true, wQ: true, bK: true, bQ: true }
  let history = [] // stack of previous states for undo
  let flipped = false
  let selected = null
  let legalMovesCache = [] // {from:[r,c], to:[r,c], promo?: 'q'|'r'|...}
  let moveNumber = 1

  // Piece unicode
  const UNICODE = {
    w: { p: '♙', r: '♖', n: '♘', b: '♗', q: '♕', k: '♔' },
    b: { p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚' }
  }

  // init
  function init() {
    initBoard()
    renderBoard()
    updateStatus()
    attachListeners()
  }

  function initBoard() {
    // starting array (row 0 = black 8th rank)
    board = Array.from({length:8}, ()=>Array(8).fill(null))
    const back = ['r','n','b','q','k','b','n','r']
    for(let c=0;c<8;c++){
      board[0][c] = {type: back[c], color:'b', hasMoved:false}
      board[1][c] = {type: 'p', color:'b', hasMoved:false}
      board[6][c] = {type: 'p', color:'w', hasMoved:false}
      board[7][c] = {type: back[c], color:'w', hasMoved:false}
    }
    turn = 'w'
    enPassant = null
    castlingRights = { wK: true, wQ: true, bK: true, bQ: true }
    history = []
    moveNumber = 1
  }

  // deep copy of board
  function cloneBoard(b) {
    return b.map(row => row.map(s => s ? {...s} : null))
  }

  // Save state for undo
  function pushHistory(moveObj) {
    history.push({
      board: cloneBoard(board),
      turn, enPassant: enPassant ? [...enPassant] : null,
      castlingRights: {...castlingRights},
      moveNumber,
      move: moveObj
    })
  }

  function popHistory() {
    if (history.length === 0) return
    const state = history.pop()
    board = state.board
    turn = state.turn
    enPassant = state.enPassant
    castlingRights = state.castlingRights
    moveNumber = state.moveNumber
    renderBoard()
    updateStatus()
    updateMovesUI()
  }

  // Utilities
  function inside(r,c){ return r>=0 && r<8 && c>=0 && c<8 }
  function isOpponent(piece, color){ return piece && piece.color && piece.color !== color }

  // Generate legal moves for color
  function generateLegalMoves(color) {
    const moves = []
    for(let r=0;r<8;r++){
      for(let c=0;c<8;c++){
        const piece = board[r][c]
        if (!piece || piece.color !== color) continue
        genMovesForPiece(r,c,piece,moves)
      }
    }
    // Filter moves that leave own king in check
    const legal = moves.filter(m => {
      const snapshot = {
        board: cloneBoard(board),
        enPassant,
        castlingRights: {...castlingRights}
      }
      makeMoveInternal(m)
      const inCheck = isKingInCheck(color)
      // restore
      board = snapshot.board
      enPassant = snapshot.enPassant
      castlingRights = snapshot.castlingRights
      return !inCheck
    })
    return legal
  }

  // Generate raw pseudo-legal moves for a piece (adds to moves array)
  function genMovesForPiece(r,c,piece,movesOut) {
    const color = piece.color
    const dir = color === 'w' ? -1 : 1

    // Pawn moves
    if (piece.type === 'p') {
      const startRow = color === 'w' ? 6 : 1
      // forward 1
      if (inside(r+dir,c) && !board[r+dir][c]) {
        // promotion?
        if ((color === 'w' && r+dir === 0) || (color==='b' && r+dir===7)) {
          movesOut.push({from:[r,c], to:[r+dir,c], promo:'q'})
        } else movesOut.push({from:[r,c], to:[r+dir,c]})
        // forward 2
        if (r === startRow && !board[r+2*dir][c]) {
          movesOut.push({from:[r,c], to:[r+2*dir,c], doublePawn:true})
        }
      }
      // captures
      for (let dc of [-1,1]) {
        const nr = r+dir, nc = c+dc
        if (inside(nr,nc) && board[nr][nc] && board[nr][nc].color !== color) {
          if ((color==='w' && nr===0) || (color==='b' && nr===7)) {
            movesOut.push({from:[r,c], to:[nr,nc], promo:'q', capture:true})
          } else movesOut.push({from:[r,c], to:[nr,nc], capture:true})
        }
      }
      // en-passant capture
      if (enPassant) {
        if (r === (color==='w' ? 3 : 4)) {
          for (let dc of [-1,1]) {
            const nc = c+dc
            if (nc === enPassant[1] && enPassant[0] === r+dir) {
              // capturing into enPassant square; record captured pawn at (r, nc)
              movesOut.push({from:[r,c], to:[r+dir,nc], enPassantCapture:[r, nc], capture:true})
            }
          }
        }
      }
      return
    }

    // Knight
    if (piece.type === 'n') {
      const deltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]
      for (let [dr,dc] of deltas) {
        const nr = r+dr, nc = c+dc
        if (!inside(nr,nc)) continue
        if (!board[nr][nc] || board[nr][nc].color !== color) movesOut.push({from:[r,c], to:[nr,nc], capture: !!board[nr][nc]})
      }
      return
    }

    // Sliding pieces helper
    const slide = (dirs) => {
      for (let [dr,dc] of dirs) {
        let nr=r+dr, nc=c+dc
        while (inside(nr,nc)) {
          if (!board[nr][nc]) movesOut.push({from:[r,c], to:[nr,nc]})
          else {
            if (board[nr][nc].color !== color) movesOut.push({from:[r,c], to:[nr,nc], capture:true})
            break
          }
          nr += dr; nc += dc
        }
      }
    }

    if (piece.type === 'b') slide([[-1,-1],[-1,1],[1,-1],[1,1]])
    if (piece.type === 'r') slide([[-1,0],[1,0],[0,-1],[0,1]])
    if (piece.type === 'q') slide([[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]])

    // King (including castling)
    if (piece.type === 'k') {
      for (let dr=-1; dr<=1; dr++){
        for (let dc=-1; dc<=1; dc++){
          if (dr===0 && dc===0) continue
          const nr=r+dr, nc=c+dc
          if (!inside(nr,nc)) continue
          if (!board[nr][nc] || board[nr][nc].color !== color) movesOut.push({from:[r,c],to:[nr,nc],capture: !!board[nr][nc]})
        }
      }
      // Castling: ensure king/rook haven't moved, squares empty, and not in check and not passing through check
      if (color === 'w' && r===7 && c===4) {
        if (castlingRights.wK && !board[7][5] && !board[7][6] && !isSquareAttacked(7,4,'b') && !isSquareAttacked(7,5,'b') && !isSquareAttacked(7,6,'b')) {
          if (board[7][7] && board[7][7].type==='r' && !board[7][7].hasMoved) movesOut.push({from:[7,4],to:[7,6],castle:'K'})
        }
        if (castlingRights.wQ && !board[7][3] && !board[7][2] && !board[7][1] && !isSquareAttacked(7,4,'b') && !isSquareAttacked(7,3,'b') && !isSquareAttacked(7,2,'b')) {
          if (board[7][0] && board[7][0].type==='r' && !board[7][0].hasMoved) movesOut.push({from:[7,4],to:[7,2],castle:'Q'})
        }
      }
      if (color === 'b' && r===0 && c===4) {
        if (castlingRights.bK && !board[0][5] && !board[0][6] && !isSquareAttacked(0,4,'w') && !isSquareAttacked(0,5,'w') && !isSquareAttacked(0,6,'w')) {
          if (board[0][7] && board[0][7].type==='r' && !board[0][7].hasMoved) movesOut.push({from:[0,4],to:[0,6],castle:'K'})
        }
        if (castlingRights.bQ && !board[0][3] && !board[0][2] && !board[0][1] && !isSquareAttacked(0,4,'w') && !isSquareAttacked(0,3,'w') && !isSquareAttacked(0,2,'w')) {
          if (board[0][0] && board[0][0].type==='r' && !board[0][0].hasMoved) movesOut.push({from:[0,4],to:[0,2],castle:'Q'})
        }
      }
      return
    }
  }

  // Check if square [r,c] is attacked by colorAttacker
  function isSquareAttacked(r,c,colorAttacker) {
    // For each attacker piece, check if it could move to [r,c] (pseudo-legal)
    // Pawns
    const pawnDir = colorAttacker === 'w' ? -1 : 1
    for (let dc of [-1,1]) {
      const pr = r - pawnDir, pc = c - dc
      if (inside(pr,pc)) {
        const p = board[pr][pc]
        if (p && p.type==='p' && p.color===colorAttacker) return true
      }
    }
    // Knights
    const knightD = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]
    for (let [dr,dc] of knightD) {
      const nr = r+dr, nc = c+dc
      if (inside(nr,nc) && board[nr][nc] && board[nr][nc].type==='n' && board[nr][nc].color===colorAttacker) return true
    }
    // Sliding: rook/queen (orthogonal)
    const orth = [[-1,0],[1,0],[0,-1],[0,1]]
    for (let [dr,dc] of orth) {
      let nr=r+dr, nc=c+dc
      while (inside(nr,nc)) {
        const p = board[nr][nc]
        if (p) { if ((p.type==='r' || p.type==='q') && p.color===colorAttacker) return true; else break }
        nr+=dr; nc+=dc
      }
    }
    // Sliding: bishop/queen (diagonal)
    const diag = [[-1,-1],[-1,1],[1,-1],[1,1]]
    for (let [dr,dc] of diag) {
      let nr=r+dr, nc=c+dc
      while (inside(nr,nc)) {
        const p = board[nr][nc]
        if (p) { if ((p.type==='b' || p.type==='q') && p.color===colorAttacker) return true; else break }
        nr+=dr; nc+=dc
      }
    }
    // King adjacent
    for (let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
      if (dr===0 && dc===0) continue
      const nr=r+dr, nc=c+dc
      if (inside(nr,nc) && board[nr][nc] && board[nr][nc].type==='k' && board[nr][nc].color===colorAttacker) return true
    }
    return false
  }

  // Find king position for color
  function findKing(color) {
    for (let r=0;r<8;r++) for (let c=0;c<8;c++){
      const p = board[r][c]
      if (p && p.type==='k' && p.color===color) return [r,c]
    }
    return null
  }

  function isKingInCheck(color) {
    const kingPos = findKing(color)
    if (!kingPos) return false
    return isSquareAttacked(kingPos[0], kingPos[1], color === 'w' ? 'b' : 'w')
  }

  // Make move (object as from:[r,c], to:[r,c], optional promo, castle:'K'|'Q', doublePawn, enPassantCapture:[r,c])
  // Does not check legality here (should be checked earlier)
  function makeMoveInternal(move) {
    const [fr,fc] = move.from, [tr,tc] = move.to
    const piece = board[fr][fc]
    // push current position handled by caller
    // handle capture
    let captured = null
    if (move.enPassantCapture) {
      const [cr,cc] = move.enPassantCapture
      captured = board[cr][cc]; board[cr][cc] = null
    } else {
      captured = board[tr][tc]
    }
    // move piece
    board[tr][tc] = {...piece, hasMoved:true}
    board[fr][fc] = null

    // castling: move rook
    if (move.castle === 'K') {
      // king moved two to the right, rook from h -> f
      const r = tr
      board[r][5] = board[r][7]; board[r][7] = null
      board[r][5].hasMoved = true
    } else if (move.castle === 'Q') {
      const r = tr
      board[r][3] = board[r][0]; board[r][0] = null
      board[r][3].hasMoved = true
    }

    // promotion
    if (move.promo) {
      board[tr][tc] = { type: move.promo, color: board[tr][tc].color, hasMoved:true }
    }

    // update enPassant: if moved double pawn, set square behind it
    if (move.doublePawn) {
      enPassant = [(fr+tr)/2, fc] // square behind pawn
    } else {
      enPassant = null
    }

    // update castling rights if rook/king moved or captured rook
    // king moved
    if (piece.type === 'k') {
      if (piece.color === 'w') { castlingRights.wK = false; castlingRights.wQ = false }
      else { castlingRights.bK = false; castlingRights.bQ = false }
    }
    // rook moved or captured
    if (piece.type === 'r') {
      if (piece.color === 'w') {
        if (fr===7 && fc===0) castlingRights.wQ = false
        if (fr===7 && fc===7) castlingRights.wK = false
      } else {
        if (fr===0 && fc===0) castlingRights.bQ = false
        if (fr===0 && fc===7) castlingRights.bK = false
      }
    }
    if (captured && captured.type === 'r') {
      // captured rook removal of castling rights
      if (captured.color === 'w') {
        if (tr===7 && tc===0) castlingRights.wQ = false
        if (tr===7 && tc===7) castlingRights.wK = false
      } else {
        if (tr===0 && tc===0) castlingRights.bQ = false
        if (tr===0 && tc===7) castlingRights.bK = false
      }
    }
    return { captured }
  }

  // Apply move with history push
  function makeMove(move) {
    // push current state for undo
    pushHistory(move)
    const result = makeMoveInternal(move)
    // update turn and move number
    if (turn === 'b') moveNumber++
    turn = (turn === 'w' ? 'b' : 'w')
    return result
  }

  // Build and render board HTML
  function renderBoard() {
    boardEl.innerHTML = ''
    // 8x8 squares; row 0 at top (8th rank). If flipped, show reversed
    const rows = [...Array(8).keys()]
    const cols = [...Array(8).keys()]
    const riter = flipped ? rows.reverse() : rows
    const citer = flipped ? cols.reverse() : cols
    for (let r of riter) {
      for (let c of citer) {
        const sq = document.createElement('div')
        sq.className = 'square ' + (((r+c) %2===0) ? 'light' : 'dark')
        sq.dataset.r = r; sq.dataset.c = c
        const p = board[r][c]
        if (p) sq.textContent = UNICODE[p.color][p.type]
        sq.addEventListener('click', onSquareClick)
        boardEl.appendChild(sq)
      }
    }
    clearSelectionHighlights()
    updateMovesUI()
  }

  function clearSelectionHighlights() {
    document.querySelectorAll('.square').forEach(el => {
      el.classList.remove('selected'); el.classList.remove('legal')
      el.style.outline = ''
      el.style.background = ''
    })
  }

  function coordinatesToIndex(r,c) {
    // convert to index in the DOM grid depending on flipped
    const rows = flipped ? [...Array(8).keys()].reverse() : [...Array(8).keys()]
    const cols = flipped ? [...Array(8).keys()].reverse() : [...Array(8).keys()]
    const rowIndex = rows.indexOf(r)
    const colIndex = cols.indexOf(c)
    return rowIndex * 8 + colIndex
  }

  function highlightLegalMoves(fromR, fromC, legal) {
    clearSelectionHighlights()
    const fromIdx = coordinatesToIndex(fromR, fromC)
    const fromEl = boardEl.children[fromIdx]
    fromEl.classList.add('selected')
    // mark squares with legal moves from that from
    legal.forEach(m => {
      const [tr,tc] = m.to
      const idx = coordinatesToIndex(tr,tc)
      boardEl.children[idx].classList.add('legal')
    })
  }

  // click handler
  function onSquareClick(e) {
    const r = parseInt(e.currentTarget.dataset.r)
    const c = parseInt(e.currentTarget.dataset.c)
    if (!selected) {
      const p = board[r][c]
      if (p && p.color === turn) {
        selected = [r,c]
        // compute legal moves once for color and filter by from
        legalMovesCache = generateLegalMoves(turn)
        const myMoves = legalMovesCache.filter(m => m.from[0]===r && m.from[1]===c)
        highlightLegalMoves(r,c,myMoves)
      }
    } else {
      const from = selected; const to = [r,c]
      // find matching move in legalMovesCache
      const move = legalMovesCache.find(m=> m.from[0]===from[0] && m.from[1]===from[1] && m.to[0]===to[0] && m.to[1]===to[1])
      if (move) {
        // handle promotion ask
        if (move.promo && askPromotionCB.checked) {
          const promo = prompt('Promote to (q,r,b,n). Default q:', 'q')
          if (promo && ['q','r','b','n'].includes(promo.toLowerCase())) move.promo = promo.toLowerCase()
        }
        makeMove(move)
        renderBoard()
        updateMoveList(move)
        updateStatus()
        // AI move after small delay
        if (!isGameOver()) {
          setTimeout(() => aiTurn(), 160)
        }
      } else {
        // clicked elsewhere: clear selection or select new piece
        selected = null
        renderBoard()
      }
    }
  }

  // Update move list UI
  function updateMoveList(move) {
    const li = document.createElement('li')
    const san = moveToSAN(move)
    if (turn === 'b') {
      // we just made a white move (turn has already toggled), add numbering
      const wrapper = document.createElement('div')
      wrapper.textContent = (history.length % 2 === 1 ? Math.ceil(history.length/2) : '') + ' ' + san
      moveListEl.appendChild(li)
      li.textContent = san
    } else {
      // black move appended
      const last = moveListEl.lastElementChild
      if (last) last.textContent = (last.textContent || '') + ' ' + san
      else { li.textContent = san; moveListEl.appendChild(li) }
    }
  }

  // Simple SAN-ish for move list (not full PGN correctness)
  function moveToSAN(m) {
    const p = board[m.to[0]][m.to[1]]
    const piece = (m && m.promo) ? (m.promo.toUpperCase()) : ''
    const fromFile = 'abcdefgh'[m.from[1]]
    const fromRank = 8 - m.from[0]
    const toFile = 'abcdefgh'[m.to[1]]
    const toRank = 8 - m.to[0]
    if (m.promo) return fromFile+fromRank + '-' + toFile+toRank + '=' + m.promo.toUpperCase()
    if (p && p.type === 'p') {
      if (m.capture) return fromFile + 'x' + toFile+toRank
      return toFile+toRank
    } else {
      const pieceChar = (p && p.type) ? p.type.toUpperCase() : ''
      return pieceChar + (m.capture ? 'x' : '-') + toFile+toRank
    }
  }

  function updateMovesUI() {
    // rebuild move list from history for robustness
    moveListEl.innerHTML = ''
    for (let i=0;i<history.length;i++) {
      const mv = history[i].move
      if (!mv) continue
      const san = moveToSAN(mv)
      const li = document.createElement('li')
      li.textContent = san
      moveListEl.appendChild(li)
    }
  }

  function isGameOver() {
    const myLegal = generateLegalMoves(turn)
    if (myLegal.length === 0) {
      if (isKingInCheck(turn)) return true // checkmate
      return true // stalemate
    }
    return false
  }

  function updateStatus() {
    if (isKingInCheck(turn)) {
      const winner = turn === 'w' ? 'Black' : 'White'
      statusEl.textContent = `Status: ${turn==='w' ? 'White' : 'Black'} is in check.`
      // checkmate detection:
      const myLegal = generateLegalMoves(turn)
      if (myLegal.length === 0) {
        statusEl.textContent = `Status: Checkmate — ${winner} wins!`
      }
    } else {
      const myLegal = generateLegalMoves(turn)
      if (myLegal.length === 0) {
        statusEl.textContent = 'Status: Stalemate — Draw'
      } else {
        statusEl.textContent = `Status: ${turn==='w' ? 'White' : 'Black'} to move`
      }
    }
  }

  // Undo
  undoBtn.addEventListener('click', () => {
    popHistory()
  })

  resetBtn.addEventListener('click', () => {
    initBoard()
    history = []
    renderBoard()
    updateStatus()
    moveListEl.innerHTML = ''
  })

  flipBtn.addEventListener('click', () => {
    flipped = !flipped
    renderBoard()
  })

  function attachListeners() {
    // difficulty select already in DOM; AI triggers use it
  }

  /* ================= AI ================= */
  // simple evaluation (material + small mobility)
  const pieceVal = { p:100, n:320, b:330, r:500, q:900, k:20000 }

  function evaluatePosition() {
    let sc = 0
    for (let r=0;r<8;r++) for (let c=0;c<8;c++){
      const p = board[r][c]
      if (!p) continue
      sc += (p.color==='w' ? 1 : -1) * (pieceVal[p.type] || 0)
    }
    return sc
  }

  // minimax with alpha-beta. colorMax = true when maximizing for white
  function minimaxAB(depth, alpha, beta, maximizingPlayer) {
    if (depth === 0) return {score: evaluatePosition()}
    // Determine whose turn: game state 'turn'
    const legal = generateLegalMoves(turn)
    if (legal.length === 0) {
      // terminal state
      if (isKingInCheck(turn)) {
        return { score: maximizingPlayer ? -999999 : 999999 } // checkmate
      } else return { score: 0 } // stalemate
    }

    if (maximizingPlayer) {
      let maxEval = -Infinity; let best = null
      for (let m of legal) {
        const snapshot = snapshotState()
        makeMoveInternal(m)
        turn = (turn==='w' ? 'b' : 'w')
        const res = minimaxAB(depth-1, alpha, beta, false)
        // restore
        restoreState(snapshot)
        if (res.score > maxEval) { maxEval = res.score; best = m }
        alpha = Math.max(alpha, res.score)
        if (beta <= alpha) break
      }
      return { score: maxEval, move: best }
    } else {
      let minEval = Infinity; let best = null
      for (let m of legal) {
        const snapshot = snapshotState()
        makeMoveInternal(m)
        turn = (turn==='w' ? 'b' : 'w')
        const res = minimaxAB(depth-1, alpha, beta, true)
        restoreState(snapshot)
        if (res.score < minEval) { minEval = res.score; best = m }
        beta = Math.min(beta, res.score)
        if (beta <= alpha) break
      }
      return { score: minEval, move: best }
    }
  }

  function snapshotState() {
    return { board: cloneBoard(board), turn, enPassant: enPassant ? [...enPassant] : null, castlingRights: {...castlingRights} }
  }
  function restoreState(s) {
    board = s.board; turn = s.turn; enPassant = s.enPassant; castlingRights = s.castlingRights
  }

  function aiTurn() {
    if (isGameOver()) { updateStatus(); return }
    setControlsDisabled(true)
    statusEl.textContent = 'Status: AI thinking...'
    setTimeout(() => {
      const level = difficultySelect.value
      let move = null
      if (level === 'easy') {
        const legal = generateLegalMoves(turn)
        move = legal[Math.floor(Math.random() * legal.length)]
      } else {
        const depth = level === 'medium' ? 2 : 3
        // AI plays as 'turn' (should be 'b' normally)
        // For convenience, maximize for White when it's White's turn, otherwise minimize
        const maximizing = (turn === 'w')
        const result = minimaxAB(depth, -Infinity, Infinity, maximizing)
        move = result.move
        // If result.move null fallback to random
        if (!move) {
          const legal = generateLegalMoves(turn)
          move = legal[Math.floor(Math.random() * legal.length)]
        }
      }
      if (move) {
        makeMove(move)
        updateMoveList(move)
        renderBoard()
        updateStatus()
      }
      setControlsDisabled(false)
    }, 120)
  }

  function setControlsDisabled(dis) {
    resetBtn.disabled = dis
    undoBtn.disabled = dis
    flipBtn.disabled = dis
    difficultySelect.disabled = dis
  }

  // start game with white to move; if want AI first, call aiTurn() here
  init()

})()
