/*
 * A decision: the branch point, drawn as a hexagon rather than a diamond.
 *
 * The diamond is the shape everyone recognises and the one nobody can use. Its area
 * grows with the square of its text, so "Has the customer already been charged?" comes
 * out either as a huge lozenge or as a squashed one with the words hanging over the
 * edges - which is why the classical shape in `libs/uml` has to stretch, and why a
 * stretched one looks wrong. A hexagon is a diamond with its middle pulled apart: the
 * chevron ends still say "this is where the flow forks", and the flat middle is a line
 * of text wide, so the shape grows sideways at the rate the words do.
 *
 * The exits are named. `yes` leaves to the right and `no` leaves the bottom, which is
 * the convention every flowchart already follows, so a connector dropped on one carries
 * its meaning without a label. `in` has two pins - the flat top and the left tip - since
 * a flow drawn left to right enters from the side and one drawn downwards from above;
 * they are one logical port, so a connector takes whichever is nearer. The whole outline
 * is connectable too, for the branches that are neither.
 */

var k = require('lib:kit');
var icons = require('base:icons');

/** How deep the chevron ends cut in, before the caps below. */
var POINT = 20;
/** Points stay crisper than the flat corners, or the shape reads as a stadium. */
var TIP_RADIUS = 0.55;
/** Beyond this the question widens the shape rather than stacking up inside it. */
var MAX_ROWS = 3;

defineComponent({
  render: function (ctx) {
    var p = ctx.params;
    var accent = k.pick(p.accent, 'var(--sw-accent)');
    var ink = k.pick(p.ink, 'var(--sw-ink)');
    var size = Math.max(7, k.numOr(p.fontSize, 14));
    var lineW = Math.max(0.2, k.numOr(p.lineWidth, 1.2));

    var question = String(k.pick(p.question, ''));
    var iconName = String(k.pick(p.icon, '')).trim();
    var iconSize = Math.max(0, k.numOr(p.iconSize, 18));
    var hasIcon = iconName !== '' && iconSize > 0 && icons.paths[iconName];

    var boxW = Math.max(120, k.numOr(ctx.size.w, 200));
    var boxH = Math.max(44, k.numOr(ctx.size.h, 80));

    // The point depth is a fraction of the width so a long node keeps flat ends rather
    // than growing spears, and it can never pass the half-height that would fold the
    // top and bottom edges into each other.
    var point = Math.max(0, Math.min(k.numOr(p.point, POINT), boxW * 0.28, boxH / 2));
    var iconCol = hasIcon ? iconSize + 10 : 0;
    var inset = point + k.PAD;

    var textW = Math.max(40, boxW - inset * 2 - iconCol);
    var opts = { weight: '600' };
    var rows = k.wrap(question, textW, size, opts);

    // A hexagon that has grown taller than it is wide has given up the one thing it was
    // chosen for. Past three lines the shape widens instead of stacking: the box's width
    // is still what decides the wrap for anything shorter, so dragging one narrower
    // re-flows it as usual, and only a question that would tower is overruled. Bisecting
    // finds the narrowest measure that still fits, so it grows by as little as it can.
    if (rows.length > MAX_ROWS) {
      var lo = textW;
      var hi = Math.max(textW, k.widthOf(question, size, opts));
      for (var g = 0; g < 14 && hi - lo > 1; g += 1) {
        var probe = (lo + hi) / 2;
        if (k.wrap(question, probe, size, opts).length > MAX_ROWS) lo = probe;
        else hi = probe;
      }
      rows = k.wrap(question, hi, size, opts);
    }
    var contentH = rows.length * size * k.LEADING;

    var h = Math.max(boxH, Math.max(contentH, hasIcon ? iconSize : 0) + k.PAD * 2);
    // Re-derive after the height moved: a tall decision may allow deeper points, and a
    // short one must not keep the depth it was asked for.
    point = Math.max(0, Math.min(k.numOr(p.point, POINT), boxW * 0.28, h / 2));
    inset = point + k.PAD;

    var widest = 0;
    for (var i = 0; i < rows.length; i += 1) widest = Math.max(widest, k.widthOf(rows[i], size, opts));
    var w = Math.max(boxW, inset * 2 + iconCol + widest);

    var mid = h / 2;
    var body = k.roundPoly(
      [[point, 0], [w - point, 0], [w, mid], [w - point, h], [point, h], [0, mid]],
      [k.RADIUS, k.RADIUS, k.RADIUS * TIP_RADIUS, k.RADIUS, k.RADIUS, k.RADIUS * TIP_RADIUS],
    );

    var children = [
      svg.path({
        id: 'body',
        d: body,
        fill: k.pick(p.fill, 'var(--sw-surface)'),
        stroke: k.pick(p.stroke, 'var(--sw-line)'),
        'stroke-width': lineW,
        'stroke-linejoin': 'round',
      }),
    ];

    if (hasIcon) {
      var mark = k.glyph(icons, iconName, inset, mid - iconSize / 2, iconSize, accent, 1.6);
      if (mark) children.push(mark);
    }

    if (rows.length) {
      // Centred in the room the icon left, not in the box, so a symbol on the left does
      // not push the words off the middle of the shape.
      //
      // The `question` id - and with it the double-click editing that the `label`
      // annotation grants - is only put on a question that came out as one line. A label
      // replaces its element's text with the whole bound value, so naming the first row
      // of a wrapped block would paint the entire question over it. The engine drops a
      // label whose element was never drawn, so a question long enough to wrap simply
      // has no inline editor and is edited in the inspector, exactly like a step's
      // description. Most decisions are two or three words, so most of them keep it.
      var laid = k.stack(rows, (inset + iconCol + w - inset) / 2, (h - contentH) / 2, size, {
        idFirst: rows.length === 1 ? 'question' : null,
        anchor: 'middle',
        weight: '600',
        fill: ink,
      });
      for (var n = 0; n < laid.nodes.length; n += 1) children.push(laid.nodes[n]);
    }

    // The exits are invisible strokes lying on the shape's own edge, not dots. The
    // editor draws a point port whenever the pointer is inside the node, so dots would
    // flicker on every time the mouse crossed a decision; a surface port waits until a
    // connector is being drawn. `in` and `no` are short runs of the flat top and bottom,
    // and the chevron tips are their own curves - the same quadratic `roundPoly` drew -
    // so they degenerate to segments on the side edges when the points are flattened.
    var flat = Math.max(1, Math.min(9, (w - point * 2) / 2 - k.RADIUS));
    var lipA = k.r2(w / 2 - flat);
    var lipB = k.r2(w / 2 + flat);
    children.push(k.stub('p-in', 'M ' + lipA + ' 0 H ' + lipB));
    children.push(k.stub('p-no', 'M ' + lipA + ' ' + k.r2(h) + ' H ' + lipB));

    var tipLen = Math.sqrt(point * point + mid * mid) || 1;
    var tipT = Math.min(k.RADIUS * TIP_RADIUS, tipLen / 2);
    var tipDx = (point / tipLen) * tipT;
    var tipDy = (mid / tipLen) * tipT;
    var tip = function (id, apexX, x) {
      return k.stub(
        id,
        'M ' + k.r2(x) + ' ' + k.r2(mid - tipDy) +
          ' Q ' + k.r2(apexX) + ' ' + k.r2(mid) + ' ' + k.r2(x) + ' ' + k.r2(mid + tipDy),
      );
    };
    children.push(tip('p-yes', w, w - tipDx));
    // The left tip is a second `in` pin, not a port of its own: same-named ports are one
    // logical port, so a connector aimed at `in` lands on the top or the left depending
    // on which is nearer, and both report the same connection. A flow laid out left to
    // right enters a decision from the side; one laid out downwards enters from above.
    children.push(tip('p-in-left', 0, tipDx));

    return svg.g({}, children);
  },
});
