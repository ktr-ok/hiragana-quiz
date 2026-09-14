/* 4×4盤面を3つの連結領域へ分割する問題生成器 */
(function (global) {
  'use strict';

  const BOARD_SIZE = 4;
  const PIECE_SIZES = [4, 5, 7];
  const COLORS = ['#ff6b6b', '#4d96ff', '#ffd93d'];
  const NAMES = ['あか', 'あお', 'きいろ'];
  const IDS = ['red', 'blue', 'yellow'];

  const key = (x, y) => `${x},${y}`;
  const fromKey = value => value.split(',').map(Number);
  const cellKey = cell => key(cell[0], cell[1]);
  const compareCells = (a, b) => a[1] - b[1] || a[0] - b[0];

  function neighbors(cell) {
    const [x, y] = cell;
    return [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]
      .filter(([nx, ny]) => nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE);
  }

  function isConnected(cells) {
    if (!cells.length) return false;
    const set = new Set(cells.map(cellKey));
    const seen = new Set([cellKey(cells[0])]);
    const queue = [cells[0]];
    while (queue.length) {
      const cell = queue.shift();
      neighbors(cell).forEach(next => {
        const nextKey = cellKey(next);
        if (set.has(nextKey) && !seen.has(nextKey)) {
          seen.add(nextKey);
          queue.push(next);
        }
      });
    }
    return seen.size === cells.length;
  }

  function normalize(cells) {
    const minX = Math.min(...cells.map(([x]) => x));
    const minY = Math.min(...cells.map(([, y]) => y));
    return cells.map(([x, y]) => [x - minX, y - minY]).sort(compareCells);
  }

  function shapeSignature(cells) {
    return normalize(cells).map(([x, y]) => `${x}:${y}`).join('|');
  }

  function width(cells) { return Math.max(...cells.map(([x]) => x)) + 1; }
  function height(cells) { return Math.max(...cells.map(([, y]) => y)) + 1; }
  function randomItem(items) { return items[Math.floor(Math.random() * items.length)]; }

  function candidateCells(remaining, wantedSize, maxAttempts) {
    const available = [...remaining].map(fromKey);
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const start = randomItem(available);
      const selected = new Map([[cellKey(start), start]]);
      while (selected.size < wantedSize) {
        const frontier = [];
        selected.forEach(cell => {
          neighbors(cell).forEach(next => {
            const nextKey = cellKey(next);
            if (remaining.has(nextKey) && !selected.has(nextKey)) frontier.push(next);
          });
        });
        if (!frontier.length) break;
        const next = randomItem(frontier);
        selected.set(cellKey(next), next);
      }
      const cells = [...selected.values()];
      if (cells.length === wantedSize && isConnected(cells)) return cells;
    }
    return null;
  }

  function remainingIsConnected(remaining) {
    return isConnected([...remaining].map(fromKey));
  }

  function makePiece(cells, index) {
    const normalized = normalize(cells);
    return {
      id: IDS[index],
      color: COLORS[index],
      name: NAMES[index],
      cells: normalized,
      target: { x: Math.min(...cells.map(([x]) => x)), y: Math.min(...cells.map(([, y]) => y)) },
      w: width(normalized),
      h: height(normalized)
    };
  }

  function splitBoard() {
    const fullBoard = new Set();
    for (let y = 0; y < BOARD_SIZE; y += 1) {
      for (let x = 0; x < BOARD_SIZE; x += 1) fullBoard.add(key(x, y));
    }

    for (let restart = 0; restart < 3000; restart += 1) {
      let remaining = new Set(fullBoard);
      const groups = [];
      let failed = false;

      for (let i = 0; i < PIECE_SIZES.length - 1; i += 1) {
        const cells = candidateCells(remaining, PIECE_SIZES[i], 300);
        if (!cells) { failed = true; break; }
        cells.forEach(cell => remaining.delete(cellKey(cell)));
        if (!remainingIsConnected(remaining)) { failed = true; break; }
        groups.push(cells);
      }

      const last = [...remaining].map(fromKey);
      if (failed || last.length !== PIECE_SIZES[2] || !isConnected(last)) continue;
      groups.push(last);

      const signatures = new Set(groups.map(shapeSignature));
      if (signatures.size !== 3) continue;
      if (groups.some(cells => width(cells) === 1 || height(cells) === 1)) continue;
      return groups;
    }

    throw new Error('問題を生成できませんでした。もう一度実行してください。');
  }

  function generatePuzzle() {
    return splitBoard().map(makePiece);
  }

  function validatePuzzle(pieces) {
    const occupied = new Map();
    const errors = [];
    pieces.forEach(piece => {
      if (!piece.cells.length || !isConnected(piece.cells)) errors.push(`${piece.id}: 連結していません`);
      piece.cells.forEach(([x, y]) => {
        const bx = piece.target.x + x;
        const by = piece.target.y + y;
        if (bx < 0 || by < 0 || bx >= BOARD_SIZE || by >= BOARD_SIZE) errors.push(`${piece.id}: 盤面外 (${bx},${by})`);
        const position = key(bx, by);
        if (occupied.has(position)) errors.push(`重複 (${bx},${by}): ${occupied.get(position)} と ${piece.id}`);
        occupied.set(position, piece.id);
      });
    });
    if (occupied.size !== BOARD_SIZE * BOARD_SIZE) errors.push(`未充填 ${BOARD_SIZE * BOARD_SIZE - occupied.size} マス`);
    return { valid: errors.length === 0, errors };
  }

  // 通常の<script src="puzzle-generator.js">でも動くよう、グローバルへ公開する。
  global.generatePuzzle = generatePuzzle;
  global.validatePuzzle = validatePuzzle;
})(window);
