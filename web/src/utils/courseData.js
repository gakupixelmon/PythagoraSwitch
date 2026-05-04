// コースデータ: ピタゴラスイッチのレイアウト定義
// type: 'straight' | 'curved'
// curvedはcontrolPointを使ったベジェ曲線を分割して直線の連続で表現

// ─── ユーティリティ ───────────────────────────────────
/**
 * 二次ベジェ曲線の補間
 */
function quadBezier(p0, p1, p2, t) {
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    u * u * p0[2] + 2 * u * t * p1[2] + t * t * p2[2],
  ];
}

/**
 * 曲線セグメントを複数の直線セグメントに展開する
 */
export function expandCurved(seg, resolution = 16) {
  const segments = [];
  let prev = seg.start;
  for (let i = 1; i <= resolution; i++) {
    const t = i / resolution;
    const next = quadBezier(seg.start, seg.control, seg.end, t);
    segments.push({
      type: 'straight',
      start: prev,
      end: next,
      width: seg.width ?? 0.6,
      wallHeight: seg.wallHeight ?? 0.18,
    });
    prev = next;
  }
  return segments;
}

/**
 * セグメントリストを展開する（curved→複数straight）
 */
export function expandCourse(rawSegments) {
  const result = [];
  for (const seg of rawSegments) {
    if (seg.type === 'curved') {
      result.push(...expandCurved(seg, 14));
    } else {
      result.push(seg);
    }
  }
  return result;
}

// ─── コース1: クラシック ───────────────────────────────
export const COURSE_CLASSIC = {
  id: 'classic',
  name: 'クラシック',
  ballStart: [0, 5.2, 0],
  goalPos: [0, -2.8, 13.5],
  segments: [
    // 0: スタート急斜面
    { type: 'straight', start: [0, 5, 0],    end: [0, 3, 3],    width: 0.65 },
    // 1: 水平
    { type: 'straight', start: [0, 3, 3],    end: [0, 2.8, 5.5], width: 0.65 },
    // 2: 右カーブ
    { type: 'curved',   start: [0, 2.8, 5.5], control: [2.5, 2.4, 7], end: [4.5, 2.1, 5.5], width: 0.65 },
    // 3: 急斜面下り
    { type: 'straight', start: [4.5, 2.1, 5.5], end: [4.5, 0.0, 8.5], width: 0.65 },
    // 4: 左カーブ
    { type: 'curved',   start: [4.5, 0.0, 8.5], control: [2, -0.2, 10.5], end: [0, -0.3, 9.5], width: 0.65 },
    // 5: 水平直線
    { type: 'straight', start: [0, -0.3, 9.5], end: [0, -0.5, 11], width: 0.65 },
    // 6: 最終斜面
    { type: 'straight', start: [0, -0.5, 11], end: [0, -2.5, 13.5], width: 0.8 },
  ],
};

// ─── コース2: スパイラル ──────────────────────────────
export const COURSE_SPIRAL = {
  id: 'spiral',
  name: 'スパイラル',
  ballStart: [-3, 6.2, -3],
  goalPos: [0, -3, 8],
  segments: [
    { type: 'straight', start: [-3, 6, -3], end: [-3, 5, 0], width: 0.6 },
    { type: 'curved',   start: [-3, 5, 0], control: [-3, 4.5, 2], end: [0, 4, 2], width: 0.6 },
    { type: 'curved',   start: [0, 4, 2], control: [3, 3.5, 2], end: [3, 3, 0], width: 0.6 },
    { type: 'curved',   start: [3, 3, 0], control: [3, 2.5, -2], end: [0, 2, -2], width: 0.6 },
    { type: 'curved',   start: [0, 2, -2], control: [-2, 1.5, -2], end: [-2, 1, 0], width: 0.6 },
    { type: 'curved',   start: [-2, 1, 0], control: [-2, 0.5, 2], end: [0, 0, 2.5], width: 0.6 },
    { type: 'curved',   start: [0, 0, 2.5], control: [2, -0.5, 2.5], end: [2, -1, 0], width: 0.6 },
    { type: 'straight', start: [2, -1, 0], end: [0, -2.8, 8], width: 0.8 },
  ],
};

// ─── コース3: ジグザグ ────────────────────────────────
export const COURSE_ZIGZAG = {
  id: 'zigzag',
  name: 'ジグザグ',
  ballStart: [0, 7.2, 0],
  goalPos: [3, -3, 14],
  segments: [
    { type: 'straight', start: [0, 7, 0], end: [0, 5.5, 2.5], width: 0.7 },
    // 右へ
    { type: 'straight', start: [0, 5.5, 2.5], end: [4, 4.5, 2.5], width: 0.7 },
    { type: 'straight', start: [4, 4.5, 2.5], end: [4, 3.5, 5], width: 0.7 },
    // 左へ
    { type: 'straight', start: [4, 3.5, 5], end: [-2, 2.5, 5], width: 0.7 },
    { type: 'straight', start: [-2, 2.5, 5], end: [-2, 1.5, 7.5], width: 0.7 },
    // 右へ
    { type: 'straight', start: [-2, 1.5, 7.5], end: [5, 0.5, 7.5], width: 0.7 },
    { type: 'straight', start: [5, 0.5, 7.5], end: [5, -0.5, 10], width: 0.7 },
    // 中央へゴール
    { type: 'curved', start: [5, -0.5, 10], control: [3, -1, 12], end: [3, -2.5, 14], width: 0.8 },
  ],
};

export const ALL_COURSES = [COURSE_CLASSIC, COURSE_SPIRAL, COURSE_ZIGZAG];
