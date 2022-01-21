// TODO: get rid of jquery, entirely unnecessary
//@ts-ignore
// import $ from 'jquery';

//@ts-ignore
import { Gesture } from '@use-gesture/vanilla';
// import { markRange } from './mark-range';
import { drawRects } from './draw-rects';

import {
  expandRangeStartToWordBound,
  expandRangeEndToWordBound,
} from './fragment-utils';

// from https://stackoverflow.com/a/13527512/5186877
// document.caretRangeFromPoint stops working in iOS safari when user-select: none set
// https://bugs.webkit.org/show_bug.cgi?id=119711
const caretRangeFromPoint = function (x, y) {
  debugger;
  var log = '';

  function inRect(x, y, rect) {
    return (
      x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
    );
  }

  function inObject(x, y, object) {
    var rects = object.getClientRects();
    for (var i = rects.length; i--; ) if (inRect(x, y, rects[i])) return true;
    return false;
  }

  function getTextNodes(node, x, y) {
    if (!inObject(x, y, node)) return [];

    var result = [];
    node = node.firstChild;
    while (node) {
      if (node.nodeType == 3) result.push(node);
      if (node.nodeType == 1) result = result.concat(getTextNodes(node, x, y));

      node = node.nextSibling;
    }

    return result;
  }
  var element = document.elementFromPoint(x, y);
  var nodes = getTextNodes(element, x, y);
  if (!nodes.length) return null;
  var node = nodes[0];

  var range = document.createRange();
  range.setStart(node, 0);
  range.setEnd(node, 1);

  for (var i = nodes.length; i--; ) {
    if (i === 0)
      var node = nodes[i],
        text = node.nodeValue;

    range = document.createRange();
    range.setStart(node, 0);
    range.setEnd(node, text.length);

    if (!inObject(x, y, range)) continue;

    for (var j = text.length; j--; ) {
      if (text.charCodeAt(j) <= 32) continue;

      range = document.createRange();
      range.setStart(node, j);
      range.setEnd(node, j + 1);

      if (inObject(x, y, range)) {
        range.setEnd(node, j);
        return range;
      }
    }
  }

  return range;
};

// from https://stackoverflow.com/a/11191372/5186877 but modified to create range, not selection
function createRangeFromPoints(startX, startY, endX, endY): Range | null {
  let start, end;
  let range: Range;
  if (typeof document.caretPositionFromPoint != 'undefined') {
    start = document.caretPositionFromPoint(startX, startY);
    end = document.caretPositionFromPoint(endX, endY);
    range = document.createRange();
    range.setStart(start.offsetNode, start.offset);
    range.setEnd(end.offsetNode, end.offset);
  } else if (typeof document.caretRangeFromPoint != 'undefined') {
    //start = document.caretRangeFromPoint(startX, startY);
    // end = document.caretRangeFromPoint(endX, endY);

    // Document.caretRangeFromPoint doesn't work (returns null) in iOS webkit on elements with `user-select: none` set.
    // https://bugs.webkit.org/show_bug.cgi?id=119711
    if (!start || !end) {
      start = caretRangeFromPoint(startX, startY);
      end = caretRangeFromPoint(endX, endY);
    }
    if (!start || !end) {
      return null;
    }
    range = document.createRange();

    range.setStart(start.startContainer, start.startOffset);
    range.setEnd(end.startContainer, end.startOffset);
  }

  // allowing range start/end to be set on non-text nodes results in jarring behaviour
  if (
    range.startContainer.nodeName !== '#text' ||
    range.endContainer.nodeName !== '#text'
  ) {
    return null;
  }

  return range;
}

// Do the stuff

let startX, startY;

let lastRangeText = '';

const gesture = new Gesture(
  document,
  {
    onDragStart: (state) => {
      startX = state.event.clientX;
      startY = state.event.clientY;
      // startWord = getFullWord(state.event);
    },
    onDrag: (state) => {
      // TODO: make sure this can cross word boundaries
      // endWord = getFullWord(state.event);

      const minX = Math.min(startX, state.event.clientX);
      const minY = Math.min(startY, state.event.clientY);
      const maxX = Math.max(startX, state.event.clientX);
      const maxY = Math.max(startY, state.event.clientY);

      const range = createRangeFromPoints(minX, minY, maxX, maxY);
      if (range && range.toString() !== lastRangeText) {
        expandRangeStartToWordBound(range);
        expandRangeEndToWordBound(range);

        lastRangeText = range.toString();
        drawRects(range.getClientRects());
      }
    },
    onDragEnd: (state) => {
      // TODO: make sure this can cross word boundaries
      // endWord = getFullWord(state.event);
      debugger;
      const minX = Math.min(startX, state.event.clientX);
      const minY = Math.min(startY, state.event.clientY);
      const maxX = Math.max(startX, state.event.clientX);
      const maxY = Math.max(startY, state.event.clientY);

      const range = createRangeFromPoints(minX, minY, maxX, maxY);

      if (range && range.toString() !== lastRangeText) {
        expandRangeStartToWordBound(range);
        expandRangeEndToWordBound(range);
        lastRangeText = range.toString();
        drawRects(range.getClientRects());
      }
    },
  },
  { drag: { preventScroll: true } }
);
