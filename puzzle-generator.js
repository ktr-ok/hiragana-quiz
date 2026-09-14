/*
 * 4×4盤面・3ピース（4 / 5 / 7マス）の問題を自動生成するユーティリティ。
 * 回転・反転は一切せず、生成時に決まった向きのままピースを使う。
 *
 * 利用例:
 *   const puzzle = generatePuzzle();
 *   console.log(puzzle);
 *
 * 返り値は既存プロトタイプの const pieces = [...] にそのまま渡せる形式です。
 */

const BOARD_SIZE = 4;
const PIECE_SIZES = [4, 5, 7];
const COLORS = ['#ff6b6b', '#4d96ff', '#ffd93d'];
const NAMES = ['あか', 'あお', 'きいろ'];

const key = (x, y) => `${x},${y}`;
const fromKey = value => value.split(',').map(Number);
const cellKey = ([x, y]) => key(x, y);
const compareCells = (a, b) => a[1] - b[1] || a[0] - b[0];

function neighbors([x, y]) {
  return [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]
    .filter(([nx, ny]) => nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE);
}

function isConnected(cells) {
  const set = new Set(cells.map(cellKey));
  const seen = new Set([cellKey(cells[0])]);
  const queue = [cells[0]];
  while (queue.length) {
    const cell = queue.shift();
    for (const next of neighbors(cell)) {
      const nextKey = cellKey(next);
      if (set.has(nextKey) && !seen.has(nextKey)) {
        seen.add(nextKey);
        queue.push(next);
      }
    }
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

function hasLineLikeShape(cells) {
  return width(cells) === 1 || height(cells) === 1;
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffled(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function cellsForPiece(piece) {
  const result = [];
  for (const [x, y] of piece.cells) {
    result.push([piece.target.x + x, piece.target.y + y]);
  }
  return result;
}

function makePiece(cells, index) {
  const normalized = normalize(cells);
  const minX = Math.min(...cells.map(([x]) => x));
  const minY = Math.min(...cells.map(([, y]) => y));
  return {
    id: ['red', 'blue', 'yellow'][index],
    color: COLORS[index],
    name: NAMES[index],
    cells: normalized,
    target: { x: minX, y: minY },
    w: width(normalized),
    h: height(normalized)
  };
}

function candidateCells(remaining, wantedSize, maxAttempts = 300) {
  const remainingArray = [...remaining].map(fromKey);
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const start = randomItem(remainingArray);
    const selected = new Map([[cellKey(start), start]]);
    while (selected.size < wantedSize) {
      const frontier = [];
      for (const cell of selected.values()) {
        for (const next of neighbors(cell)) {
          if (remaining.has(cellKey(next)) && !selected.has(cellKey(next))) frontier.push(next);
        }
      }
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
  const cells = [...remaining].map(fromKey);
  return cells.length > 0 && isConnected(cells);
}

function splitBoardIntoPieces() {
  const fullBoard = new Set();
  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) fullBoard.add(key(x, y));
  }

  for (let restart = 0; restart < 2000; restart += 1) {
    let remaining = new Set(fullBoard);
    const groups = [];
    let failed = false;

    for (let i = 0; i < PIECE_SIZES.length - 1; i += 1) {
      const cells = candidateCells(remaining, PIECE_SIZES[i]);
      if (!cells) { failed = true; break; }
      cells.forEach(cell => remaining.delete(cellKey(cell)));
      if (!remainingIsConnected(remaining)) { failed = true; break; }
      groups.push(cells);
    }

    const lastCells = [...remaining].map(fromKey);
    if (failed || lastCells.length !== PIECE_SIZES[2] || !isConnected(lastCells)) continue;
    groups.push(lastCells);

    // 3歳向け: ただの棒だけ、または全ピースが同じような箱形になる候補は避ける。
    if (groups.some(hasLineLikeShape)) continue;
    const uniqueShapes = new Set(groups.map(shapeSignature));
    if (uniqueShapes.size < 3) continue;

    return groups.map(makePiece);
  }
  throw new Error('問題を生成できませんでした。もう一度実行してください。');
}

function generatePuzzle() {
  const pieces = shuffled(splitBoardIntoPieces());
  return pieces.map((piece, index) => ({
    ...piece,
    id: ['red', 'blue', 'yellow'][index],
    color: COLORS[index],
    name: NAMES[index]
  }));
}

function validatePuzzle(pieces) {
  const occupied = new Map();
  const errors = [];
  for (const piece of pieces) {
    if (piece.cells.length === 0 || !isConnected(piece.cells)) errors.push(`${piece.id}: ピースが連結していません`);
    for (const [x, y] of cellsForPiece(piece)) {
      if (x < 0 || y < 0 || x >= BOARD_SIZE || y >= BOARD_SIZE) errors.push(`${piece.id}: 盤面外のマス (${x}, ${y})`);
      const k = key(x, y);
      if (occupied.has(k)) errors.push(`重複: (${x}, ${y}) に ${occupied.get(k)} と ${piece.id}`);
      occupied.set(k, piece.id);
    }
  }
  if (occupied.size !== BOARD_SIZE * BOARD_SIZE) errors.push(`未充填: ${BOARD_SIZE * BOARD_SIZE - occupied.size} マス`);
  return { valid: errors.length === 0, errors };
}

// 既存プロトタイプでは、この行を使って固定の const pieces = [...] を置き換える。
// const pieces = generatePuzzle();
