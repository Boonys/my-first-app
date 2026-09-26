// Minimal DOM stand-in, only as much as the components actually touch.
// Test-only code: it never ships in src/.

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this.className = '';
    this.hidden = false;
    this.value = '';
    this._text = '';
    this._classes = new Set();
  }

  get classList() {
    const set = this._classes;
    return {
      add: (...c) => c.forEach((x) => set.add(x)),
      remove: (...c) => c.forEach((x) => set.delete(x)),
      toggle: (c, force) => (force ? set.add(c) : set.delete(c)),
      contains: (c) => set.has(c)
    };
  }

  get textContent() {
    return this._text;
  }

  set textContent(value) {
    this._text = String(value);
  }

  append(...nodes) {
    this.children.push(...nodes);
  }

  replaceChildren(...nodes) {
    this.children = [...nodes];
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  getAttribute(name) {
    return this.attributes[name];
  }

  addEventListener(type, handler) {
    (this.listeners[type] ??= []).push(handler);
  }

  dispatch(type, event = {}) {
    const payload = { preventDefault() {}, ...event };
    (this.listeners[type] ?? []).forEach((handler) => handler(payload));
  }

  focus() {
    this.focused = true;
  }

  reset() {
    this.resetCalled = true;
  }

  scrollIntoView() {}

  querySelectorAll(selector) {
    const wanted = selector.replace(/[[\]]/g, '');
    return this.descendants().filter((node) => node.matches(wanted));
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] ?? null;
  }

  matches(selector) {
    return this.className.split(/\s+/).includes(selector);
  }

  descendants() {
    return this.children.flatMap((child) => [
      child,
      ...(child.descendants ? child.descendants() : [])
    ]);
  }
}

export function installFakeDom() {
  const previous = globalThis.document;

  globalThis.document = {
    createElement: (tag) => new FakeElement(tag),
    createDocumentFragment: () => new FakeElement('fragment')
  };

  return {
    FakeElement,
    restore() {
      globalThis.document = previous;
    }
  };
}

export { FakeElement };
