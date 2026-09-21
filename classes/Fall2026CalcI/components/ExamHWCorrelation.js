import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

const dataURL = new URL("./ExamHWCorrelation.csv", import.meta.url).href;

function correlation(data, xKey, yKey) {
  const n = data.length;

  if (n < 2) {
    return NaN;
  }

  const meanX = d3.mean(data, (d) => d[xKey]);
  const meanY = d3.mean(data, (d) => d[yKey]);

  let numerator = 0;
  let sumXSquared = 0;
  let sumYSquared = 0;

  for (const d of data) {
    const dx = d[xKey] - meanX;
    const dy = d[yKey] - meanY;

    numerator += dx * dy;
    sumXSquared += dx * dx;
    sumYSquared += dy * dy;
  }

  const denominator = Math.sqrt(sumXSquared * sumYSquared);

  return denominator === 0 ? NaN : numerator / denominator;
}

export async function makeCorrelationPlot(year) {
  if (![25, 26].includes(year)) {
    throw new Error("makeCorrelationPlot expects year to be either 25 or 26.");
  }

  const hwKey = `HW${year}`;
  const examKey = `Exam${year}`;
  const examHW = (await d3.csv(dataURL, d3.autoType)).filter(
    (d) =>
      d.ID !== "TP" &&
      Number.isFinite(d[hwKey]) &&
      Number.isFinite(d[examKey])
  );
  const corr = correlation(examHW, hwKey, examKey);

  return Plot.plot({
    grid: true,
    x: { label: "HW score" },
    y: { label: "Exam score" },
    width: 400,
    height: 400,
    subtitle: `r = ${corr.toFixed(3)}`,
    marks: [
      Plot.dot(examHW, {
        x: hwKey,
        y: examKey,
        tip: true,
        fill: year == 26 ? "steelblue" : "darkorange"
      }),
      Plot.linearRegressionY(examHW, {
        x: hwKey,
        y: examKey,
        stroke: year == 26 ? "steelblue" : "darkorange",
        strokeDasharray: "4,2"
      })
    ]
  });
}
