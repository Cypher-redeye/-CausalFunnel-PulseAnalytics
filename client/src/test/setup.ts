import '@testing-library/jest-dom/vitest';

// Mock ResizeObserver for Recharts responsive container
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as Record<string, unknown>).ResizeObserver = MockResizeObserver;

// Mock HTMLCanvasElement getContext for Heatmap canvas rendering
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function () {
    return {
      clearRect: () => {},
      fillRect: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      strokeRect: () => {},
      fillText: () => {},
      measureText: () => ({ width: 100 }),
      createRadialGradient: () => ({
        addColorStop: () => {},
      }),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
    } as unknown as CanvasRenderingContext2D;
  } as unknown as typeof HTMLCanvasElement.prototype.getContext;
}
