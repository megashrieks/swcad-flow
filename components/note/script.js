/*
 * A callout: the aside that says "mind this", set as annotation rather than as a card.
 *
 * The framed version - fill, border, coloured rail down the left - is what a docs site
 * uses, because there the callout has to interrupt a column of running prose. A drawing
 * is not a column of prose. Everything else on the sheet is already a box, so one more
 * box reads as another node in the diagram, and the rail's colour competes with the
 * connectors for the same attention. Set on the background with nothing but an icon, a
 * heading and a sentence, it reads as a note *about* the drawing instead of a part of it.
 *
 * So it draws no frame by default: no fill, no border, no corner radius. The variant
 * still picks a colour and an icon together, and the colour is spent on the icon, which
 * is the one mark that has to carry the severity. Give it a `fill` or a `stroke` and the
 * frame comes back - with padding, since a border needs room - which is how you get the
 * boxed form for the one note that really does have to interrupt.
 */

var k = require('lib:kit');
var icons = require('base:icons');

var GAP = 5;

var VARIANTS = {
  info: { colour: 'var(--sw-accent)', icon: 'info' },
  warn: { colour: 'var(--sw-warning)', icon: 'warning' },
  success: { colour: 'var(--sw-success)', icon: 'check' },
  danger: { colour: 'var(--sw-danger)', icon: 'alert' },
  neutral: { colour: 'var(--sw-ink-muted)', icon: 'comment' },
};

/** A colour parameter that has been left blank means "do not paint this", not "default". */
function paint(value) {
  var v = value === undefined || value === null ? '' : String(value).trim();
  return v === '' || v === 'none' ? null : v;
}

defineComponent({
  render: function (ctx) {
    var p = ctx.params;
    var variant = VARIANTS[String(k.pick(p.variant, 'info'))] || VARIANTS.info;
    var colour = k.pick(p.accent, variant.colour);
    var ink = k.pick(p.ink, 'var(--sw-ink)');
    var size = Math.max(7, k.numOr(p.fontSize, 13));
    var bodySize = Math.max(7, size - 1);
    var lineW = Math.max(0.2, k.numOr(p.lineWidth, 1.2));

    var title = String(k.pick(p.title, ''));
    var body = String(k.pick(p.text, ''));
    // Blank means the variant's own icon, which is the point of having variants at all.
    // "none" is how you say you want no icon, since blank is already taken.
    var iconName = String(k.pick(p.icon, variant.icon));
    var iconSize = Math.max(0, k.numOr(p.iconSize, 18));
    var hasIcon = iconName !== 'none' && iconSize > 0 && icons.paths[iconName];

    var fill = paint(p.fill);
    var stroke = paint(p.stroke);
    var framed = fill !== null || stroke !== null;
    // Padding is the frame's, not the text's: unframed there is no border to stand off
    // from, and an inset block of words would just sit adrift of everything it annotates.
    var pad = framed ? k.PAD : 0;
    var radius = framed ? Math.max(0, k.numOr(p.radius, 0)) : 0;

    var left = pad + (hasIcon ? iconSize + 10 : 0);
    var boxW = Math.max(80, k.numOr(ctx.size.w, 260));
    var textW = Math.max(40, boxW - left - pad);

    var rows = k.wrap(body, textW, bodySize);
    var titleH = title ? size * k.LEADING : 0;
    var bodyH = rows.length * bodySize * k.LEADING;
    var contentH = titleH + (titleH > 0 && bodyH > 0 ? GAP : 0) + bodyH;

    var h = Math.max(k.numOr(ctx.size.h, 0), Math.max(contentH, hasIcon ? iconSize : 0) + pad * 2);
    var widest = k.widthOf(title, size, { weight: '600' });
    for (var i = 0; i < rows.length; i += 1) widest = Math.max(widest, k.widthOf(rows[i], bodySize));
    var w = Math.max(boxW, left + widest + pad);

    // Drawn even when it paints nothing: it is what carries the hit area, the outline
    // port and the alignment box, so the note can still be clicked, connected and lined
    // up with its neighbours when it is only words on the background.
    var children = [
      svg.path({
        id: 'body',
        d: k.roundRect(0, 0, w, h, radius),
        fill: fill || 'none',
        stroke: stroke || 'none',
        'stroke-width': stroke ? lineW : null,
        'stroke-linejoin': 'round',
      }),
    ];

    var top = (h - contentH) / 2;
    if (hasIcon) {
      // On the title's line rather than the block's middle: a callout icon is a label for
      // the heading, and centring it against three lines of body text leaves it adrift.
      var titleMid = top + (titleH > 0 ? titleH / 2 : contentH / 2);
      var iconY = Math.max(pad, Math.min(h - pad - iconSize, titleMid - iconSize / 2));
      var mark = k.glyph(icons, iconName, pad, iconY, iconSize, colour, 1.6);
      if (mark) children.push(mark);
    }
    if (title) {
      children.push(k.line(title, left, top + (titleH - size) / 2, size, { id: 'title', weight: '600', fill: ink }));
    }
    if (rows.length) {
      var laid = k.stack(rows, left, top + titleH + (titleH > 0 ? GAP : 0), bodySize, {
        idFirst: 'text',
        fill: 'var(--sw-ink-muted)',
      });
      for (var n = 0; n < laid.nodes.length; n += 1) children.push(laid.nodes[n]);
    }

    return svg.g({}, children);
  },
});
