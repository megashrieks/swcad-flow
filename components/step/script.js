/*
 * A step: the card a modern flowchart is actually made of.
 *
 * A step in a real diagram is a heading with a sentence under it - "Validate payload /
 * reject anything without a signature" - and often a number saying where it comes in the
 * sequence. `base/box` holds a title and nothing else, which is why people reach for a
 * UML component and abuse its member list to get body text. This is that shape, drawn on
 * purpose.
 *
 * The card is as big as the instance box or as big as its contents, whichever is bigger,
 * so dragging it wider re-wraps the description and typing past the bottom grows it. It
 * never clips: a step whose text has been cut off is worse than one that is too tall.
 */

var k = require('lib:kit');
var icons = require('base:icons');

var GAP = 6;
var BADGE = 11;

defineComponent({
  render: function (ctx) {
    var p = ctx.params;
    var accent = k.pick(p.accent, 'var(--sw-accent)');
    var ink = k.pick(p.ink, 'var(--sw-ink)');
    var size = Math.max(7, k.numOr(p.fontSize, 14));
    var bodySize = Math.max(7, size - 2);
    var lineW = Math.max(0.2, k.numOr(p.lineWidth, 1.2));

    var number = String(k.pick(p.number, '')).trim();
    var title = String(k.pick(p.title, ''));
    var body = String(k.pick(p.description, ''));
    var iconName = String(k.pick(p.icon, '')).trim();
    var iconSize = Math.max(0, k.numOr(p.iconSize, 20));

    var hasBadge = number !== '';
    var hasIcon = iconName !== '' && iconSize > 0 && icons.paths[iconName];

    // Columns first: the text runs between the badge and the icon, and the width left
    // for it decides how the description wraps, which decides the height.
    var left = k.PAD + (hasBadge ? BADGE * 2 + 10 : 0);
    var right = k.PAD + (hasIcon ? iconSize + 10 : 0);

    var boxW = Math.max(120, k.numOr(ctx.size.w, 240));
    var textW = Math.max(40, boxW - left - right);

    var rows = k.wrap(body, textW, bodySize);
    var titleH = title ? size * k.LEADING : 0;
    var bodyH = rows.length * bodySize * k.LEADING;
    var contentH = titleH + (titleH > 0 && bodyH > 0 ? GAP : 0) + bodyH;

    // The badge and the icon set a floor on the height even when there is no text at
    // all, so an unlabelled step is still a card rather than a sliver.
    var minH = Math.max(contentH, hasBadge ? BADGE * 2 : 0, hasIcon ? iconSize : 0) + k.PAD * 2;
    var h = Math.max(k.numOr(ctx.size.h, 0), minH);

    // Growing sideways is the other half of never clipping: a single word longer than
    // the column would otherwise hang over the border.
    var widest = 0;
    for (var i = 0; i < rows.length; i += 1) widest = Math.max(widest, k.widthOf(rows[i], bodySize));
    var w = Math.max(boxW, left + Math.max(widest, k.widthOf(title, size, { weight: '600' })) + right);

    var children = [
      svg.path({
        id: 'body',
        d: k.roundRect(0, 0, w, h, k.RADIUS),
        fill: k.pick(p.fill, 'var(--sw-surface)'),
        stroke: k.pick(p.stroke, 'var(--sw-line)'),
        'stroke-width': lineW,
        'stroke-linejoin': 'round',
      }),
    ];

    var top = (h - contentH) / 2;
    // The badge and the icon belong to the title, not to the card: on a step with no
    // description the text centres in the box, and anything pinned to the top edge would
    // be left sitting above it. They ride the title's centre line, clamped so a short
    // card cannot push them through its own border.
    var titleMid = top + (titleH > 0 ? titleH / 2 : contentH / 2);
    var ride = function (half) {
      return Math.max(k.PAD + half, Math.min(h - k.PAD - half, titleMid));
    };

    if (hasBadge) {
      // Solid rather than outlined: the number is an ordinal, and a filled chip reads as
      // one at a glance where a ring reads as a state. Paper, not white, so it survives
      // a dark theme.
      var numSize = Math.max(7, size - 3);
      var badgeY = ride(BADGE);
      children.push(
        svg.circle({ cx: k.r2(k.PAD + BADGE), cy: k.r2(badgeY), r: BADGE, fill: accent, stroke: 'none' }),
      );
      children.push(
        k.line(number, k.PAD + BADGE, k.centreY(badgeY, numSize), numSize, {
          id: 'number',
          anchor: 'middle',
          weight: '600',
          fill: 'var(--sw-paper)',
        }),
      );
    }

    if (hasIcon) {
      var mark = k.glyph(icons, iconName, w - k.PAD - iconSize, ride(iconSize / 2) - iconSize / 2, iconSize, accent, 1.6);
      if (mark) children.push(mark);
    }

    if (title) {
      children.push(k.line(title, left, top + (titleH - size) / 2, size, { id: 'title', weight: '600', fill: ink }));
    }
    if (rows.length) {
      // Justified to the column, so a block of prose reads as a block: a card is a narrow
      // measure and a ragged right edge inside a bordered box looks like a mistake.
      var laid = k.stack(rows, left, top + titleH + (titleH > 0 ? GAP : 0), bodySize, {
        idFirst: 'description',
        fill: 'var(--sw-ink-muted)',
        justify: textW,
      });
      for (var n = 0; n < laid.nodes.length; n += 1) children.push(laid.nodes[n]);
    }

    return svg.g({}, children);
  },
});
