import '@testing-library/jest-dom';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: jest.fn(), removeListener: jest.fn(),
    addEventListener: jest.fn(), removeEventListener: jest.fn(), dispatchEvent: jest.fn(),
  })),
});
// jsdom has no pseudo-element layout; retain its normal computed styles.
const computedStyle = window.getComputedStyle.bind(window);
window.getComputedStyle = (element) => computedStyle(element);
