/*
 * A terminator: where a flow starts and where it ends.
 *
 * The only thing available for this was `uml/initial-node`, which is a filled dot -
 * correct UML and no use in a diagram that is not UML, because a dot cannot say "Start"
 * or "Payment captured". This is the pill every modern flowchart uses instead: a fully
 * rounded rectangle with a word in it.
 *
 * It sizes itself to the word. A terminator is one short label by definition, so there
 * is nothing to wrap and nothing to clip - drag it wider if you want it wider, and it
 * will not shrink below its text.
 */

var k = require('lib:kit');
var icons = require('base:icons');

defineComponent({
  render: function (ctx) {
    var p = ctx.params;
    var solid = k.bool(p.solid, true);
    var accent = k.pick(p.accent, 'var(--sw-accent)');
    var size = Math.max(7, k.numOr(p.fontSize, 13));
    var lineW = Math.max(0.2, k.numOr(p.lineWidth, 1.2));

    var label = String(k.pick(p.text, ''));
    var iconName = String(k.pick(p.icon, '')).trim();
    var iconSize = Math.max(0, k.numOr(p.iconSize, 16));
    var hasIcon = iconName !== '' && iconSize > 0 && icons.paths[iconName];

    // Filled is the default because a terminator is punctuation: it should be the first
    // and last thing the eye lands on. Outlined is there for a sheet that is already
    // busy, and takes the same colour so the two read as the same component.
    var fill = solid ? accent : k.pick(p.fill, 'var(--sw-surface)');
    var ink = solid ? 'var(--sw-paper)' : k.pick(p.ink, accent);
    var stroke = solid ? 'none' : accent;

    var pad = 18;
    var gap = hasIcon ? 8 : 0;
    var needW = pad * 2 + (hasIcon ? iconSize + gap : 0) + k.widthOf(label, size, { weight: '600' });
    var h = Math.max(28, k.numOr(ctx.size.h, 40), size + 16, hasIcon ? iconSize + 12 : 0);
    var w = Math.max(needW, k.numOr(ctx.size.w, 120), h);

    var inner = (hasIcon ? iconSize + gap : 0) + k.widthOf(label, size, { weight: '600' });
    var startX = (w - inner) / 2;

    var children = [
      svg.path({
        id: 'body',
        d: k.roundRect(0, 0, w, h, h / 2),
        fill: fill,
        stroke: stroke,
        'stroke-width': stroke === 'none' ? 0 : lineW,
        'stroke-linejoin': 'round',
      }),
    ];

    if (hasIcon) {
      var mark = k.glyph(icons, iconName, startX, (h - iconSize) / 2, iconSize, ink, 1.7);
      if (mark) children.push(mark);
    }
    if (label) {
      children.push(
        k.line(label, startX + (hasIcon ? iconSize + gap : 0), k.centreY(h / 2, size), size, {
          id: 'text',
          weight: '600',
          tracking: 0.2,
          fill: ink,
        }),
      );
    }

    return svg.g({}, children);
  },
});
