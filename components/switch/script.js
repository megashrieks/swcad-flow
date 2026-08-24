/*
 * A switch: the branch that has more than two ways out.
 *
 * A decision asks a yes/no question and a flowchart draws it as one shape with two exits.
 * A branch on a value - a status, a plan tier, a message type - has no such shape, so
 * people draw a chain of decisions and the diagram turns into a staircase that says
 * nothing the original expression did not. This is that branch drawn as what it is: a
 * header naming what is being tested, and a row per value, each with its own exit.
 *
 * The cases are one multi-line parameter rather than a run of numbered ones, because how
 * many values a thing can take is data, not shape: a fixed set of slots is both a ceiling
 * to bump into and a column of empty fields to scroll past. The card is then sized by what
 * is written in it - a line added makes it taller, a line removed makes it shorter - which
 * is why it does not take a size of its own. A table with a gap under the last row is not
 * a better table for having been dragged there.
 *
 * Every exit is named after its own case, which is the point of naming them at all: a
 * connector dropped on the `closed` row reports `closed`, and the branch is labelled by
 * where it starts instead of by a caption someone has to keep in step. Each case has an
 * exit on *both* sides under that one name, so the pair is one logical port and a
 * connector attaches to whichever side it approaches from - the switch reads the same
 * whether the flow runs left to right or fans out around it.
 *
 * Ports are keyed on a slug of the case rather than on its line number, so inserting a
 * case above an existing one - the ordinary way a switch grows - leaves every connector
 * already drawn below it attached to the row it was drawn from.
 */

var k = require('lib:kit');
var icons = require('base:icons');

/** Space above and below a row's text. */
var ROW_PAD = 10;
/** Room kept clear on the right, so a case value never runs into its own exit. */
var GUTTER = 16;
/** Half-length of the invisible run of edge each port sits on. */
var LIP = 9;
/** Narrow enough to be a badge, wide enough not to look like an accident. */
var MIN_W = 120;

/** `d` for a rectangle rounded along its top edge only - the header band. */
function band(w, h, r) {
  var rad = Math.max(0, Math.min(r, w / 2, h));
  return (
    'M ' + k.r2(rad) + ' 0' +
    ' H ' + k.r2(w - rad) +
    ' A ' + k.r2(rad) + ' ' + k.r2(rad) + ' 0 0 1 ' + k.r2(w) + ' ' + k.r2(rad) +
    ' V ' + k.r2(h) + ' H 0 V ' + k.r2(rad) +
    ' A ' + k.r2(rad) + ' ' + k.r2(rad) + ' 0 0 1 ' + k.r2(rad) + ' 0 Z'
  );
}

/**
 * The card's measurements, worked out once from the parameters.
 *
 * `render` and `ports` are separate hooks over the same instance, and an exit that does
 * not sit on the row it belongs to is worse than no exit at all, so both read their
 * geometry from here rather than each doing the arithmetic in its own way.
 */
function layout(ctx) {
  var p = ctx.params;
  var size = Math.max(7, k.numOr(p.fontSize, 14));
  var rowSize = Math.max(7, size - 1);

  var subject = String(k.pick(p.subject, ''));
  var iconName = String(k.pick(p.icon, '')).trim();
  var iconSize = Math.max(0, k.numOr(p.iconSize, 18));
  var hasIcon = iconName !== '' && iconSize > 0 && icons.paths[iconName];

  // One row per line. Two cases written the same way are one branch as far as the reader
  // is concerned, so the second gets a suffixed id rather than quietly taking the first
  // one's connectors - a duplicate is a typo to be seen, not a collision to be hidden.
  var rows = [];
  var seen = {};
  var values = k.lines(p.cases);
  for (var i = 0; i < values.length; i += 1) {
    var base = k.slug(values[i], 'case-' + (i + 1));
    var id = base;
    var n = 2;
    while (Object.prototype.hasOwnProperty.call(seen, id)) {
      id = base + '-' + n;
      n += 1;
    }
    seen[id] = true;
    rows.push({ id: id, label: 'c-' + id, value: values[i], muted: false });
  }

  var fallback = String(k.pick(p.fallback, '')).trim();
  if (fallback !== '') rows.push({ id: 'default', label: 'fallback', value: fallback, muted: true });

  var headH = Math.max(size * k.LEADING + 12, hasIcon ? iconSize + 12 : 0);
  var rowH = rowSize * k.LEADING + ROW_PAD;

  var iconCol = hasIcon ? iconSize + 8 : 0;
  var widest = iconCol + k.widthOf(subject, size, { weight: '600' });
  for (var j = 0; j < rows.length; j += 1) {
    widest = Math.max(widest, k.widthOf(rows[j].value, rowSize));
  }

  var w = Math.max(MIN_W, k.PAD * 2 + GUTTER + widest);
  var h = headH + rows.length * rowH;

  for (var m = 0; m < rows.length; m += 1) {
    rows[m].mid = headH + m * rowH + rowH / 2;
    rows[m].top = headH + m * rowH;
  }

  return {
    w: w,
    h: h,
    headH: headH,
    rowH: rowH,
    rows: rows,
    size: size,
    rowSize: rowSize,
    subject: subject,
    iconName: iconName,
    iconSize: iconSize,
    iconCol: iconCol,
    hasIcon: hasIcon,
  };
}

/**
 * A run of edge long enough to aim at, pulled in from both corners so it never strays
 * onto the arc - a port that hangs off the rounded corner is a connector that ends a pixel
 * outside the shape it is attached to.
 */
function lip(mid, span) {
  return Math.max(0.5, Math.min(LIP, mid - k.RADIUS, span - k.RADIUS - mid));
}

/** The invisible stroke a case's exit lives on, one per side. */
function exitPath(L, row, side) {
  var half = lip(row.mid, L.h);
  var x = side === 'w' ? 0 : L.w;
  return 'M ' + k.r2(x) + ' ' + k.r2(row.mid - half) + ' V ' + k.r2(row.mid + half);
}

defineComponent({
  render: function (ctx) {
    var p = ctx.params;
    var L = layout(ctx);
    var accent = k.pick(p.accent, 'var(--sw-accent)');
    var ink = k.pick(p.ink, 'var(--sw-ink)');
    var stroke = k.pick(p.stroke, 'var(--sw-line)');
    var lineW = Math.max(0.2, k.numOr(p.lineWidth, 1.2));

    var children = [
      svg.path({
        id: 'body',
        d: k.roundRect(0, 0, L.w, L.h, k.RADIUS),
        fill: k.pick(p.fill, 'var(--sw-surface)'),
        stroke: stroke,
        'stroke-width': lineW,
        'stroke-linejoin': 'round',
      }),
      // Tinted rather than filled: the header has to read as a different kind of row
      // without becoming the loudest thing on the sheet, and a wash of the accent does
      // that in every theme, where a chosen colour would only work in one.
      svg.path({ d: band(L.w, L.headH, k.RADIUS), fill: accent, 'fill-opacity': 0.1, stroke: 'none' }),
      svg.path({
        d: 'M 0 ' + k.r2(L.headH) + ' H ' + k.r2(L.w),
        fill: 'none',
        stroke: stroke,
        'stroke-width': lineW,
      }),
    ];

    if (L.hasIcon) {
      var mark = k.glyph(icons, L.iconName, k.PAD, (L.headH - L.iconSize) / 2, L.iconSize, accent, 1.6);
      if (mark) children.push(mark);
    }
    if (L.subject) {
      children.push(
        k.line(L.subject, k.PAD + L.iconCol, k.centreY(L.headH / 2, L.size), L.size, {
          id: 'subject',
          weight: '600',
          fill: ink,
        }),
      );
    }

    for (var n = 0; n < L.rows.length; n += 1) {
      var row = L.rows[n];

      if (n > 0) {
        // The rule above the default row is the one that carries weight: it is the line
        // between "these are the values" and "and anything else", which is a different
        // statement from the one between two neighbouring cases.
        children.push(
          svg.path({
            d: 'M 0 ' + k.r2(row.top) + ' H ' + k.r2(L.w),
            fill: 'none',
            stroke: stroke,
            'stroke-width': lineW,
            'stroke-opacity': row.muted ? 0.75 : 0.3,
          }),
        );
      }

      children.push(
        k.line(row.value, k.PAD, k.centreY(row.mid, L.rowSize), L.rowSize, {
          id: row.label,
          fill: row.muted ? 'var(--sw-ink-muted)' : ink,
        }),
      );

      children.push(k.stub('p-' + row.id + '-e', exitPath(L, row, 'e')));
      children.push(k.stub('p-' + row.id + '-w', exitPath(L, row, 'w')));
    }

    // `in` has three pins, all reporting the same port: a flow drawn downwards enters from
    // above and one drawn along a row enters from whichever side it came from, so a
    // connector aimed at `in` takes whichever is nearer.
    var flat = lip(L.w / 2, L.w);
    children.push(k.stub('p-in', 'M ' + k.r2(L.w / 2 - flat) + ' 0 H ' + k.r2(L.w / 2 + flat)));
    var side = lip(L.headH / 2, L.h);
    var ends = ' ' + k.r2(L.headH / 2 - side) + ' V ' + k.r2(L.headH / 2 + side);
    children.push(k.stub('p-in-left', 'M 0' + ends));
    children.push(k.stub('p-in-right', 'M ' + k.r2(L.w) + ends));

    return svg.g({}, children);
  },

  /*
   * The exits cannot be declared in the annotation table: their names *are* the cases, and
   * the cases are typed in after the component is written. They are declared here instead,
   * pointing at the strokes `render` drew, so each spreads along a run of the card's edge
   * exactly as a statically annotated port would - quiet until a connector is being drawn,
   * rather than a row of dots lighting up whenever the pointer crosses the card.
   */
  ports: function (ctx) {
    var L = layout(ctx);
    var out = [];
    for (var i = 0; i < L.rows.length; i += 1) {
      var row = L.rows[i];
      out.push({
        id: 'p-' + row.id + '-e',
        name: row.value,
        direction: 'out',
        facing: [1, 0],
        surface: 'outline',
      });
      out.push({
        id: 'p-' + row.id + '-w',
        name: row.value,
        direction: 'out',
        facing: [-1, 0],
        surface: 'outline',
      });
    }
    return out;
  },
});
