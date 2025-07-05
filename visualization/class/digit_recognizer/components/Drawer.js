import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

export function Drawer({
  width = 8 * 28,
  height = 8 * 28,
  curve: Curve = d3.curveBasis,
  stroke = "black",
  strokeWidth = 10,
  lineCap = "round",
  lineJoin = "round"
} = {}) {
  const canvas = d3
    .create("canvas")
    .attr("width", width)
    .attr("height", height)
    .node();
  const context = canvas.getContext("2d");

  const strokes = (context.canvas.value = []);
  const curve = Curve(context);
  const redo = [];

  context.lineJoin = lineJoin;
  context.lineCap = lineCap;

  function render() {
    context.clearRect(0, 0, width, height);
    for (const stroke of strokes) {
      context.strokeStyle = stroke.stroke;
      context.lineWidth = stroke.strokeWidth;
      context.beginPath();
      curve.lineStart();
      for (const point of stroke) {
        curve.point(...point);
      }
      if (stroke.length === 1) curve.point(...stroke[0]);
      curve.lineEnd();
      context.stroke();
    }
  }

  d3.select(context.canvas).call(
    d3
      .drag()
      .container(context.canvas)
      .subject(dragsubject)
      .on("start drag", dragged)
      .on("start.render drag.render", render)
      .on("end", broadcast)
  );

  function broadcast() {
    const targetSize = 28;
    const inputSize = 8 * targetSize;

    // const context = canvas.getContext("2d");
    const inputImageData = context.getImageData(0, 0, inputSize, inputSize);
    // console.log(["inputImageData is", d3.group(inputImageData.data, (x) => x)]);
    let minX = inputSize,
      maxX = 0,
      minY = inputSize,
      maxY = 0;
    for (let y = 0; y < inputSize; y++) {
      for (let x = 0; x < inputSize; x++) {
        const i = (y * inputSize + x) * 4;
        const alpha = inputImageData.data[i + 3];
        // console.log(["alpha is", alpha]);
        if (alpha > 10) {
          // console.log(["alpha is still", alpha]);
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          console.log(["set min/max with", minX, maxX, minY, maxY]);
        }
      }
    }
    const boxWidth = maxX - minX + 1;
    const boxHeight = maxY - minY + 1;

    console.log(["dims are", minX, maxX, minY, maxY, boxWidth, boxHeight]);

    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = boxWidth;
    cropCanvas.height = boxHeight;
    const cropCtx = cropCanvas.getContext("2d");

    const downscaleCanvas = document.createElement("canvas");
    downscaleCanvas.width = targetSize;
    downscaleCanvas.height = targetSize;
    const downscaleCtx = downscaleCanvas.getContext("2d");

    cropCtx.putImageData(
      context.getImageData(minX, minY, boxWidth, boxHeight),
      0,
      0
    );

    downscaleCtx.clearRect(0, 0, 28, 28);
    downscaleCtx.imageSmoothingEnabled = true;

    const scale = Math.min(20 / boxWidth, 20 / boxHeight);
    const drawWidth = boxWidth * scale;
    const drawHeight = boxHeight * scale;

    const offsetX = (28 - drawWidth) / 2;
    const offsetY = (28 - drawHeight) / 2;

    downscaleCtx.drawImage(
      cropCanvas,
      0,
      0,
      boxWidth,
      boxHeight,
      offsetX,
      offsetY,
      drawWidth,
      drawHeight
    );

    // downscaleCtx.drawImage(canvas, 0, 0, targetSize, targetSize);
    const imageData = downscaleCtx.getImageData(0, 0, targetSize, targetSize);
    const downscaleData = imageData.data;

    const grayscaleData = new Float32Array(targetSize * targetSize);
    for (let i = 0; i < targetSize * targetSize; i++) {
      const r = downscaleData[i * 4];
      const g = downscaleData[i * 4 + 1];
      const b = downscaleData[i * 4 + 2];
      const a = downscaleData[i * 4 + 3];
      const gray = (r + g + b) / 3;
      grayscaleData[i] = a / 255;
    }
    context.canvas.value = grayscaleData;
    context.canvas.dispatchEvent(new CustomEvent("input"));
  }

  context.canvas.undo = () => {
    if (strokes.length === 0) return;
    redo.push(strokes.pop());
    render();
  };

  context.canvas.redo = (stroke) => {
    if (redo.length === 0) return;
    strokes.push(redo.pop());
    render();
  };

  // Create a new empty stroke at the start of a drag gesture.
  function dragsubject() {
    const currentStroke = [];
    currentStroke.stroke = typeof stroke === "function" ? stroke() : stroke;
    currentStroke.strokeWidth =
      typeof strokeWidth === "function" ? strokeWidth() : strokeWidth;
    strokes.push(currentStroke);
    redo.length = 0;
    return currentStroke;
  }

  // Add to the stroke when dragging.
  function dragged({ subject, x, y }) {
    subject.push([x, y]);
  }

  return canvas;
}