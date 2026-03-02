export const CANVAS_CONFIG = {
  defaultViewport: { x: 0, y: 0, zoom: 0.8 },
  minZoom: 0.1,
  maxZoom: 4,
  snapGrid: [20, 20] as [number, number],
  nodeGap: { x: 300, y: 200 },
  layerOffsets: {
    input: 0,
    context: 200,
    agents: 450,
    outputs: 700,
    branches: 950,
  },
} as const;
