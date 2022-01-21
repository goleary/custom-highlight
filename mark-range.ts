/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Obtained from https://github.com/GoogleChromeLabs/text-fragments-polyfill/blob/f0159ae64cc800d04fdbee6499f569a94ccf4915/src/text-fragment-utils.js

// Block elements. elements of a text fragment cannot cross the boundaries of a
// block element. Source for the list:
// https://developer.mozilla.org/en-US/docs/Web/HTML/Block-level_elements#Elements
export const BLOCK_ELEMENTS = [
  'ADDRESS',
  'ARTICLE',
  'ASIDE',
  'BLOCKQUOTE',
  'DETAILS',
  'DIALOG',
  'DD',
  'DIV',
  'DL',
  'DT',
  'FIELDSET',
  'FIGCAPTION',
  'FIGURE',
  'FOOTER',
  'FORM',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'HEADER',
  'HGROUP',
  'HR',
  'LI',
  'MAIN',
  'NAV',
  'OL',
  'P',
  'PRE',
  'SECTION',
  'TABLE',
  'UL',
  'TR',
  'TH',
  'TD',
  'COLGROUP',
  'COL',
  'CAPTION',
  'THEAD',
  'TBODY',
  'TFOOT',
];

type HighlightColor = 'puple';

/**
 * Defines the name and hex values of a mark so that they can be referenced anytime the mark
 * is interacted with
 */
export type ColorInfo = {
  name: string;
  hex: string;
};

/**
 * Text fragments CSS class name.
 */
export const TEXT_FRAGMENT_CSS_CLASS_NAME =
  'text-fragments-polyfill-target-text';

/**
 * Upnext mark data attribute name; allows finding and manipulating existing highlights
 */
export const UPNEXT_MARK_DATA_ATTRIBUTE_NAME = 'data-upnext-annotation-id';

/**
 * Upnext data attribute name to store the color of the highlight
 */
export const UPNEXT_HIGHLIGHT_COLOR_DATA_ATTRIBUTE_NAME = 'data-upnext-color';

/**
 * Upnext data attribute name to store whether the higlight has a note
 */
export const UPNEXT_HIGHLIGHT_HAS_NOTE_DATA_ATTRIBUTE_NAME =
  'data-upnext-has-note';

/**
 * Removes the given highlights.
 * @param {Node[]} marks - a list of <mark> elements to be removed, with their
 *     contents extracted and returned to the parent node (from which they were
 *     originally pulled).
 */
export const removeMarks = (marks: Node[]): void => {
  for (const mark of marks) {
    const range = document.createRange();
    range.selectNodeContents(mark);
    const fragment = range.extractContents();
    const parent = mark.parentNode;
    if (parent) {
      parent.insertBefore(fragment, mark);
      parent.removeChild(mark);
      parent.normalize();
    }
  }
};

/**
 * The style applied to every mark created
 */
const BASE_MARK_STYLE =
  'padding-top:0.24em; padding-bottom:0.24em; -webkit-user-select:none;';

/**
 * Applies the provided styles to the mark element, in addition to base styles that all marks should
 * have. A style should be in the format: 'padding:4px'
 */
const setMarkStyle = (mark: Element, ...styles: string[]): void => {
  let markStyle = BASE_MARK_STYLE;
  for (const style of styles) {
    markStyle += `${style};`;
  }
  mark.setAttribute('style', markStyle);
};

/**
 * Creates a trivial mark element (created in the document but not associated with any other nodes)
 * that is tagged with the provided id, has the provided listener method setup when clicked and with
 * the specified ColorInfo and hasNote status
 */
const createMark = (
  id: string,
  listener: (id: string) => void,
  colorInfo?: ColorInfo,
  hasNote?: boolean
): HTMLElement => {
  const trivialMark = document.createElement('mark');
  // For some reason we need this to run after the main thread clears.
  trivialMark.onpointerup = (): void => {
    setTimeout(() => listener(id), 0);
  };
  trivialMark.setAttribute('class', TEXT_FRAGMENT_CSS_CLASS_NAME);
  trivialMark.setAttribute(UPNEXT_MARK_DATA_ATTRIBUTE_NAME, id);
  let colorStyle = '';
  if (colorInfo) {
    trivialMark.setAttribute(
      UPNEXT_HIGHLIGHT_COLOR_DATA_ATTRIBUTE_NAME,
      colorInfo.name
    );
    colorStyle = `background:${colorInfo.hex}`;
  }
  setMarkStyle(trivialMark, colorStyle);
  const hasNoteBool = hasNote || false;
  trivialMark.setAttribute(
    UPNEXT_HIGHLIGHT_HAS_NOTE_DATA_ATTRIBUTE_NAME,
    hasNoteBool.toString()
  );
  return trivialMark;
};

/**
 * Given an annotationId, finds all associated <mark> nodes and returns them as an array
 * @param annotationId - the annotationId for which to find marks for
 * @returns {Element[]} The <mark> nodes taht were found
 */
export const getAnnotationMarks = (annotationId: string): Element[] => {
  const elements = document.querySelectorAll(
    `[${UPNEXT_MARK_DATA_ATTRIBUTE_NAME}="${annotationId}"]`
  );
  if (!elements) {
    throw Error(
      `Could not find annotation marks for annotation: ${annotationId}`
    );
  }
  // NOTE: this is allegedly the fastest way to turn a NodeListOf<Element> into an array
  // https://stackoverflow.com/questions/3199588/fastest-way-to-convert-javascript-nodelist-to-array
  const marks = [];
  for (let i = 0; i < elements.length; i++) {
    marks.push(elements[i]);
  }
  return marks;
};

/**
 * Returns the text highlighted by the provided annotationId. Unlike getting text from document.selection(),
 * this method will not respect formatting (like newlines), and instead concats the textContent of each
 * mark element that comprises the highlight
 */
export const getHighlightText = (annotationId: string): string => {
  const marks = getAnnotationMarks(annotationId);
  let text = '';
  for (const mark of marks) {
    text += mark.textContent;
  }
  return text;
};

/**
 * Returns the HighlightColor of the provided mark elements
 */
export const getMarksColor = (marks: Element[]): HighlightColor => {
  const color = marks[0].getAttribute(
    UPNEXT_HIGHLIGHT_COLOR_DATA_ATTRIBUTE_NAME
  ) as HighlightColor;
  return color;
};

/**
 * Returns whether the provided marks have a note associated with them
 */
export const getMarksHaveNote = (marks: Element[]): boolean => {
  const hasNote = marks[0].getAttribute(
    UPNEXT_HIGHLIGHT_HAS_NOTE_DATA_ATTRIBUTE_NAME
  );
  return hasNote === 'true';
};

/**
 * Updates the color attributes of the provided marks
 */
export const updateMarksColor = (
  marks: Element[],
  { name, hex }: ColorInfo
): void => {
  for (let i = 0; i < marks.length; i++) {
    setMarkStyle(marks[i], `background:${hex}`);
    marks[i].setAttribute(UPNEXT_HIGHLIGHT_COLOR_DATA_ATTRIBUTE_NAME, name);
  }
};

/**
 * Updates the note attribute of the provided marks
 */
export const updateMarksHaveNote = (
  marks: Element[],
  hasNote: boolean
): void => {
  for (let i = 0; i < marks.length; i++) {
    marks[i].setAttribute(
      UPNEXT_HIGHLIGHT_HAS_NOTE_DATA_ATTRIBUTE_NAME,
      hasNote.toString()
    );
  }
};

/**
 * @param node the node on which the NodeIterator should be set to when returned
 * @param backwards whether or not this nodeIterator is setup to advance
 * forwards or backwards
 * @returns NodeIterator ready for usage
 */
const getNodeIterator = (node: Node, backwards = false): NodeIterator => {
  const nodeIterator = document.createNodeIterator(document.body);
  let cursor = nodeIterator.nextNode();
  while (cursor !== node && cursor) {
    cursor = nodeIterator.nextNode();
  }
  if (!cursor) {
    throw Error('walked to end of document without finding node');
  }
  if (backwards) {
    nodeIterator.previousNode();
  }
  return nodeIterator;
};

const nodeHasText = (node: Node): boolean => !!node.textContent?.trim();

/**
 * Reduces the size of the range until the start & end containers are text
 * nodes. The text contained in the range is not changed in the process.
 */
const reduceRangeEndpointsToTextNodes = (range: Range): void => {
  if (range.startContainer.nodeType !== Node.TEXT_NODE) {
    const nodeIterator = getNodeIterator(range.startContainer);
    let node = nodeIterator.nextNode();
    while (node && (node.nodeType !== Node.TEXT_NODE || !nodeHasText(node))) {
      node = nodeIterator.nextNode();
    }
    if (node) {
      range.setStart(node, 0);
    }
  }

  if (range.endContainer.nodeType !== Node.TEXT_NODE) {
    const nodeIterator = getNodeIterator(range.endContainer, true);
    let node = nodeIterator.previousNode();
    while (node && (node.nodeType !== Node.TEXT_NODE || !nodeHasText(node))) {
      node = nodeIterator.previousNode();
    }
    if (node && node.parentNode) {
      range.setEnd(node, node.parentNode.childNodes.length - 1);
    }
  }
};

export const markRange = (
  range: Range,
  id: string,
  listener: (id: string) => void,
  colorInfo?: ColorInfo,
  hasNote?: boolean
): HTMLElement[] => {
  // This ensures that we can mark the start & end of the range using
  // Range.surroundContents() by reducing the range until it starts & ends
  // within text nodes. This is to avoid the range partially containing a
  // non-text node which causes Range.surroundContents() to fail
  // https://dom.spec.whatwg.org/#dom-range-surroundcontents
  // We only care about marking text & this preserves all text in the range.
  reduceRangeEndpointsToTextNodes(range);

  // If the range is entirely within a single node, just surround it.
  if (range.startContainer === range.endContainer) {
    const trivialMark = createMark(id, listener, colorInfo, hasNote);
    range.surroundContents(trivialMark);
    return [trivialMark];
  }

  // Start node -- special case
  const startNode = range.startContainer;
  const startNodeSubrange = range.cloneRange();
  startNodeSubrange.setEndAfter(startNode);

  // End node -- special case
  const endNode = range.endContainer;
  const endNodeSubrange = range.cloneRange();
  endNodeSubrange.setStartBefore(endNode);

  // In between nodes
  const marks = [];
  range.setStartAfter(startNode);
  range.setEndBefore(endNode);
  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    {
      acceptNode: function (node) {
        if (!range.intersectsNode(node)) return NodeFilter.FILTER_REJECT;

        if (
          BLOCK_ELEMENTS.includes(node.nodeName) ||
          node.nodeType === Node.TEXT_NODE
        )
          return NodeFilter.FILTER_ACCEPT;
        return NodeFilter.FILTER_SKIP;
      },
    }
  );
  let node = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.TEXT_NODE && nodeHasText(node)) {
      const mark = createMark(id, listener, colorInfo, hasNote);
      if (node.parentNode) {
        node.parentNode.insertBefore(mark, node);
      }
      mark.appendChild(node);
      marks.push(mark);
    }
    node = walker.nextNode();
  }
  const startMark = createMark(id, listener, colorInfo, hasNote);
  startNodeSubrange.surroundContents(startMark);

  const endMark = createMark(id, listener, colorInfo, hasNote);
  endNodeSubrange.surroundContents(endMark);

  return [startMark, ...marks, endMark];
};
