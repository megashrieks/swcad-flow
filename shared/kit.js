/*
 * What the flow symbols agree on.
 *
 * A flowchart is read at a glance, so its cards have to be consistent in the small
 * things: one corner radius, one padding, one relationship between the title size and
 * the body size, one way of wrapping a line that has run out of room. Those live here
 * rather than in four component scripts, so a change of proportion moves the whole
 * library at once.
 *
 * These are modern cards rather than the flowchart shapes of a 1970s template: a
 * rounded rectangle with a fill, a hairline border and real typography. The old
 * vocabulary - diamonds for decisions, parallelograms for input - is in `libs/uml`,
 * where the notation is the point. Here the point is that a reader can follow it.
 */

var FONT = 'Inter, Segoe UI, sans-serif';

/** Space between a border and the text inside it. */
var PAD = 14;
/** Corner radius. One number, so nothing in the library is rounder than anything else. */
var RADIUS = 8;
/** Baseline-to-baseline as a multiple of the type size. */
var LEADING = 1.45;

function pick(value, fallback) {
  return value === undefined || value === null || value === '' ? fallback : value;
}

function numOr(value, fallback) {
  var n = Number(value);
  return isFinite(n) ? n : fallback;
}

function bool(value, fallback) {
  return value === undefined || value === null ? fallback : Boolean(value);
}

/**
 * A list written as one parameter, an entry per line.
 *
 * How many exits a switch has, or how many rows a list has, is not something a component
 * can declare in advance, so the list is one multi-line parameter rather than a fixed run
 * of numbered ones. Blank lines are dropped: a trailing newline is what typing looks like
 * mid-thought, not a request for an empty row.
 */
function lines(value) {
  if (value === undefined || value === null) return [];
  var out = [];
  var raw = String(value).split(/\r?\n/);
  for (var i = 0; i < raw.length; i += 1) {
    var t = raw[i].trim();
    if (t) out.push(t);
  }
  return out;
}

/**
 * A piece of text reduced to something usable as an element id.
 *
 * Used to key a port on the value it stands for rather than on its position in the list,
 * so that inserting a case above an existing one - the ordinary way a switch grows - does
 * not silently re-point every connector already drawn from the rows below it.
 */
function slug(value, fallback) {
  var s = String(value === undefined || value === null ? '' : value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || fallback;
}

function r2(v) {
  return Math.round(v * 100) / 100;
}

function font(size, opts) {
  var o = opts || {};
  return { family: o.family || FONT, size: size, weight: o.weight || '400', style: o.style || 'normal' };
}

function widthOf(value, size, opts) {
  if (value === undefined || value === null || value === '') return 0;
  return text.measure(String(value), font(size, opts)).width;
}

/**
 * Break a paragraph to a width, honouring the newlines that are already in it.
 *
 * A description is prose, and prose that is clipped at the border is worse than a card
 * that grew - so the caller lays out whatever comes back and sizes the card to it. A
 * word longer than the whole line is left to overhang rather than broken mid-word,
 * because a hyphen the author did not write is a lie about the text.
 *
 * The array carries an `ends` property listing the index of each line that finishes a
 * paragraph. Only justification cares, and only because the last line of a paragraph is
 * the one line that must be left short.
 */
function wrap(value, width, size, opts) {
  var out = [];
  out.ends = [];
  if (value === undefined || value === null) return out;
  var paras = String(value).split(/\r?\n/);
  for (var p = 0; p < paras.length; p += 1) {
    var words = paras[p].trim().split(/\s+/);
    if (words.length === 1 && words[0] === '') continue;
    var run = '';
    for (var i = 0; i < words.length; i += 1) {
      var next = run ? run + ' ' + words[i] : words[i];
      if (run && widthOf(next, size, opts) > width) {
        out.push(run);
        run = words[i];
      } else {
        run = next;
      }
    }
    if (run) out.push(run);
    if (out.length) out.ends.push(out.length - 1);
  }
  return out;
}

/** How wide a single space is, which is what justification has to give away. */
function spaceWidth(size, opts) {
  return widthOf(' ', size, opts) || size * 0.26;
}

/**
 * One line set to an exact width by widening the gaps between its words.
 *
 * Not `textLength`: SVG's own fitting spreads the slack between every pair of glyphs, so
 * a stretched line comes out letter-spaced and no two lines of a paragraph share the same
 * tracking. Placing each word at its own `x` moves only the spaces, which is what
 * justification means.
 *
 * Returns `null` when the line should be left ragged - a single word has no gap to give,
 * and a line that would need more than a couple of spaces per gap reads as a river down
 * the column, which is worse than an uneven right edge.
 */
function justified(value, x, y, size, width, opts) {
  var o = opts || {};
  var words = String(value).split(/\s+/);
  var kept = [];
  for (var i = 0; i < words.length; i += 1) if (words[i] !== '') kept.push(words[i]);
  if (kept.length < 2) return null;

  var widths = [];
  var total = 0;
  for (var n = 0; n < kept.length; n += 1) {
    widths[n] = widthOf(kept[n], size, o);
    total += widths[n];
  }
  var gap = (width - total) / (kept.length - 1);
  var normal = spaceWidth(size, o);
  // A gap below a normal space means the line already fills the column. The ceiling is
  // for the pathological line - two long words alone on a row - where justifying would
  // tear a hole across the card; everything short of that is better set flush, because a
  // paragraph where only some lines reach the margin looks broken rather than ragged.
  if (gap < normal || gap > normal * 6) return null;

  var runs = [];
  var at = x;
  for (var w = 0; w < kept.length; w += 1) {
    // The space stays in the text so the words are still words to anything that reads
    // the markup; the explicit `x` is what actually places them.
    runs.push(svg.tspan(w === kept.length - 1 ? kept[w] : kept[w] + ' ', { x: r2(at) }));
    at += widths[w] + gap;
  }
  return svg.text('', {
    id: o.id,
    x: r2(x),
    y: r2(y + size * 0.82),
    'font-family': o.family || FONT,
    'font-size': size,
    'font-weight': o.weight || '400',
    'letter-spacing': o.tracking || null,
    fill: o.fill || 'var(--sw-ink)',
  }, runs);
}

/** One run of text. `y` is the top of the line, not the baseline. */
function line(value, x, y, size, opts) {
  var o = opts || {};
  return svg.text(String(value), {
    id: o.id,
    x: r2(x),
    y: r2(y + size * 0.82),
    'text-anchor': o.anchor || 'start',
    'font-family': o.family || FONT,
    'font-size': size,
    'font-weight': o.weight || '400',
    'letter-spacing': o.tracking || null,
    fill: o.fill || 'var(--sw-ink)',
  });
}

/**
 * The `y` to hand `line` so a run of text sits on a given centre line.
 *
 * Type is centred on its cap height, not on its em box. The em box carries room for
 * descenders that a number does not have, so a digit centred by box sits visibly high
 * in its chip - which is exactly the kind of half-pixel wrongness that makes a diagram
 * look hand-made. Inter's caps are about 0.71em, so half of that is the offset from the
 * baseline, and `line` adds its own 0.82em to get there.
 */
function centreY(cy, size) {
  return cy - size * 0.465;
}

/**
 * A stack of lines, returned with the height it took. `idFirst` names the first one.
 *
 * `justify` is the column width to set the lines to. The last line of each paragraph is
 * left ragged - `values.ends` says which those are, and without it only the very last
 * line is spared.
 */
function stack(values, x, y, size, opts) {
  var o = opts || {};
  var step = size * LEADING;
  var out = [];
  var ends = values.ends || [values.length - 1];
  for (var i = 0; i < values.length; i += 1) {
    var top = y + i * step + (step - size) / 2;
    var id = i === 0 ? o.idFirst : null;
    var attrs = {
      anchor: o.anchor,
      weight: o.weight,
      family: o.family,
      tracking: o.tracking,
      fill: o.fill,
      id: id,
    };
    var flat = null;
    if (o.justify && ends.indexOf(i) < 0) flat = justified(values[i], x, top, size, o.justify, attrs);
    out.push(flat || line(values[i], x, top, size, attrs));
  }
  return { nodes: out, height: values.length * step };
}

/** `d` for a rounded rectangle, so a card is one element whatever its corners do. */
function roundRect(x, y, w, h, r) {
  var rad = Math.max(0, Math.min(r, w / 2, h / 2));
  if (rad === 0) {
    return 'M ' + r2(x) + ' ' + r2(y) + ' H ' + r2(x + w) + ' V ' + r2(y + h) + ' H ' + r2(x) + ' Z';
  }
  var arc = ' A ' + r2(rad) + ' ' + r2(rad) + ' 0 0 1 ';
  return (
    'M ' + r2(x + rad) + ' ' + r2(y) +
    ' H ' + r2(x + w - rad) + arc + r2(x + w) + ' ' + r2(y + rad) +
    ' V ' + r2(y + h - rad) + arc + r2(x + w - rad) + ' ' + r2(y + h) +
    ' H ' + r2(x + rad) + arc + r2(x) + ' ' + r2(y + h - rad) +
    ' V ' + r2(y + rad) + arc + r2(x + rad) + ' ' + r2(y) + ' Z'
  );
}

/**
 * `d` for a polygon with rounded corners.
 *
 * A quadratic through each vertex rather than a fitted arc: the trim distance along
 * both edges is the same, so the corner stays tangent to them, and a sharp vertex - the
 * point of a chevron - keeps its direction while losing its needle. `radius` may be one
 * number for the whole outline or one per vertex, which is how a shape can have soft
 * corners and crisper points at the same time. Each trim is capped at half its edge so
 * two corners can never eat the same segment.
 */
function roundPoly(pts, radius) {
  var n = pts.length;
  if (n < 3) return '';
  var d = '';
  for (var i = 0; i < n; i += 1) {
    var cur = pts[i];
    var prev = pts[(i + n - 1) % n];
    var next = pts[(i + 1) % n];
    var inX = prev[0] - cur[0];
    var inY = prev[1] - cur[1];
    var outX = next[0] - cur[0];
    var outY = next[1] - cur[1];
    var inLen = Math.sqrt(inX * inX + inY * inY) || 1;
    var outLen = Math.sqrt(outX * outX + outY * outY) || 1;
    var want = typeof radius === 'number' ? radius : radius[i] || 0;
    var t = Math.max(0, Math.min(want, inLen / 2, outLen / 2));
    var ax = cur[0] + (inX / inLen) * t;
    var ay = cur[1] + (inY / inLen) * t;
    d += (i === 0 ? 'M ' : ' L ') + r2(ax) + ' ' + r2(ay);
    if (t > 0) {
      d += ' Q ' + r2(cur[0]) + ' ' + r2(cur[1]) + ' ' + r2(cur[0] + (outX / outLen) * t) + ' ' + r2(cur[1] + (outY / outLen) * t);
    }
  }
  return d + ' Z';
}

/**
 * An element that is only there to carry a port: no paint, no area of its own.
 *
 * It is a stroke rather than a dot because a `point` port is drawn by the editor whenever
 * the pointer is anywhere inside the node, and three dots blinking on every time the mouse
 * crosses a card is noise. A `surface` port on an invisible stroke is quiet until a
 * connector is actually being drawn, which is how every other shipped library behaves.
 * Trace part of the shape's own edge with it and a connector lands exactly where it looks.
 */
function stub(id, d) {
  return svg.path({ id: id, d: d, fill: 'none', stroke: 'transparent' });
}

/**
 * A glyph from the product icon set, scaled into a box and stroked in one colour.
 *
 * The icons live in `libs/product` rather than being copied here: an icon set is a
 * dependency, not a design decision, and two copies of the same 24-unit outlines would
 * drift the moment one was regenerated. Both libraries ship with the app, so the reach
 * across always resolves. An unknown name draws nothing, which is what makes `icon`
 * safe to type into the inspector.
 */
function glyph(icons, name, x, y, size, stroke, weight) {
  var subpaths = (icons && icons.paths && icons.paths[name]) || [];
  if (!subpaths.length) return null;
  var scale = size / icons.size;
  var at = Math.round((weight / scale) * 1e3) / 1e3;
  var marks = [];
  for (var i = 0; i < subpaths.length; i += 1) {
    marks.push(
      svg.path({
        d: subpaths[i],
        fill: 'none',
        stroke: stroke,
        'stroke-width': at,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      }),
    );
  }
  return svg.g(
    { transform: 'translate(' + r2(x) + ' ' + r2(y) + ') scale(' + Math.round(scale * 1e4) / 1e4 + ')' },
    marks,
  );
}

defineComponent({
  FONT: FONT,
  PAD: PAD,
  RADIUS: RADIUS,
  LEADING: LEADING,
  pick: pick,
  numOr: numOr,
  bool: bool,
  lines: lines,
  slug: slug,
  r2: r2,
  font: font,
  widthOf: widthOf,
  wrap: wrap,
  line: line,
  justified: justified,
  spaceWidth: spaceWidth,
  centreY: centreY,
  stack: stack,
  roundRect: roundRect,
  roundPoly: roundPoly,
  stub: stub,
  glyph: glyph,
});
