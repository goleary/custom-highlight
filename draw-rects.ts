export const drawRects = (rects: DOMRectList) => {
  const elements: Element[] = [];
  const root = document.querySelector('#rects');
  for (const rect of rects) {
    const d = document.createElement('div');
    d.style['position'] = 'absolute';
    d.style['backgroundColor'] = 'yellow';
    d.style['zIndex'] = '-1';
    d.style['top'] = `${rect.top + window.scrollY}px`;
    d.style['left'] = `${rect.left}px`;
    d.style['width'] = `${rect.width}px`;
    d.style['height'] = `${rect.height}px`;
    elements.push(d);
  }
  root.innerHTML = null;
  root.append(...elements);
};
