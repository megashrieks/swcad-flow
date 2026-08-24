/*
 * A swimlane: who does what.
 *
 * A flow that crosses three teams is unreadable until it is split into lanes, at which
 * point the diagram answers a question it could not answer before - not just what
 * happens, but who it happens to. That is worth a component of its own.
 *
 * The border is drawn as four separate strokes rather than one rectangle so that the lane
 * can be grabbed by its edge without the middle of it becoming a click target. What keeps
 * the middle open to connectors is not the strokes, though — it is the engine's rule that
 * nothing which encloses an end of a route may also be in the way of it. Four thin bars
 * were once the whole trick, and they were never enough: a step in this lane wired to a
 * step in the next has to cross two of them, and thin or not, an obstacle is an obstacle,
 * so the route went round the end of the lane instead of straight down.
 *
 * The header band is a hit area so the lane can be dragged by its title bar. That also
 * makes the lane block as one solid box rather than as its separate strokes, which is
 * what stops an unrelated connector cutting across a lane it has no business in. All four
 * border strokes carry the same port name, which the engine reads as one port with four
 * places to land, so a connector attaches on whichever side it approaches from.
 */

var k = require('lib:kit');

function edge(id, d, stroke, lineW) {
  return svg.path({ id: id, d: d, fill: 'none', stroke: stroke, 'stroke-width': lineW, 'stroke-linejoin': 'miter' });
}

defineComponent({
  render: function (ctx) {
    var p = ctx.params;
    var vertical = String(k.pick(p.orientation, 'horizontal')) === 'vertical';
    var stroke = k.pick(p.stroke, 'var(--sw-ink-muted)');
    var ink = k.pick(p.ink, 'var(--sw-ink)');
    var fill = k.pick(p.fill, 'none');
    var band = k.pick(p.headerFill, 'var(--sw-surface)');
    var size = Math.max(7, k.numOr(p.fontSize, 13));
    var lineW = Math.max(0.2, k.numOr(p.lineWidth, 1.2));
    var head = Math.max(size + 12, k.numOr(p.headerSize, 34));

    var title = String(k.pick(p.title, ''));
    var w = Math.max(80, k.numOr(ctx.size.w, vertical ? 260 : 520));
    var h = Math.max(60, k.numOr(ctx.size.h, vertical ? 420 : 160));

    var children = [];
    if (fill && fill !== 'none') {
      children.push(svg.rect({ x: 0, y: 0, width: k.r2(w), height: k.r2(h), fill: fill, stroke: 'none' }));
    }

    // The band is a filled rect with its own id so it is a grab handle - the lane is moved
    // by its header, the way a window is moved by its title bar. It also carries the
    // title's `label` annotation rather than the text element doing it: a horizontal
    // lane's title is turned on its side, and the inline editor is placed from a box
    // stated in unrotated coordinates, so it would open at right angles to the words.
    // Editing the band works whichever way the lane runs.
    children.push(
      svg.rect({
        id: 'header',
        x: 0,
        y: 0,
        width: k.r2(vertical ? w : head),
        height: k.r2(vertical ? head : h),
        fill: band,
        stroke: 'none',
      }),
    );

    var x2 = k.r2(w);
    var y2 = k.r2(h);
    children.push(edge('top', 'M 0 0 H ' + x2, stroke, lineW));
    children.push(edge('right', 'M ' + x2 + ' 0 V ' + y2, stroke, lineW));
    children.push(edge('bottom', 'M ' + x2 + ' ' + y2 + ' H 0', stroke, lineW));
    children.push(edge('left', 'M 0 ' + y2 + ' V 0', stroke, lineW));
    children.push(
      svg.path({
        d: vertical ? 'M 0 ' + k.r2(head) + ' H ' + x2 : 'M ' + k.r2(head) + ' 0 V ' + y2,
        fill: 'none',
        stroke: stroke,
        'stroke-width': lineW,
      }),
    );

    if (title) {
      if (vertical) {
        children.push(
          k.line(title, w / 2, k.centreY(head / 2, size), size, {
            anchor: 'middle',
            weight: '600',
            tracking: 0.3,
            fill: ink,
          }),
        );
      } else {
        // Turned to run up the lane, which is how a horizontal swimlane is always
        // labelled - the band is only as wide as the type is tall.
        children.push(
          svg.g({ transform: 'rotate(-90 ' + k.r2(head / 2) + ' ' + k.r2(h / 2) + ')' }, [
            k.line(title, head / 2, k.centreY(h / 2, size), size, {
              anchor: 'middle',
              weight: '600',
              tracking: 0.3,
              fill: ink,
            }),
          ]),
        );
      }
    }

    return svg.g({}, children);
  },
});
