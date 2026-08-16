const CHART_COLOR_CLASSES = ['fill-chart-1', 'fill-chart-2', 'fill-chart-3', 'fill-chart-4', 'fill-chart-5']

/** Cycles through the app's 5 chart color tokens for an arbitrary-length category list (PIE/
 * BAR_CATEGORY distributions) -- same tokens LineChart/BarChart already use elsewhere. */
export function chartColorForIndex(index: number): string {
  return CHART_COLOR_CLASSES[index % CHART_COLOR_CLASSES.length]!
}
