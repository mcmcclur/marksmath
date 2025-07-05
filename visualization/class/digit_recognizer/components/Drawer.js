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
    const innerSize = 20;
    const inputSize = 8 * targetSize;

    // const context = canvas.getContext("2d");
    const inputImageData = context.getImageData(0, 0, inputSize, inputSize);
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
        }
      }
    }
    const boxWidth = maxX - minX + 1;
    const boxHeight = maxY - minY + 1;

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

    // Step 3: Resize to fit in 20x20 box
      const scale = Math.min(innerSize / boxWidth, innerSize / boxHeight);
      const drawWidth = boxWidth * scale;
      const drawHeight = boxHeight * scale;

      const scaleCanvas = document.createElement("canvas");
      scaleCanvas.width = innerSize;
      scaleCanvas.height = innerSize;
      const scaleCtx = scaleCanvas.getContext("2d");
      scaleCtx.imageSmoothingEnabled = true;
      scaleCtx.clearRect(0, 0, innerSize, innerSize);
      scaleCtx.drawImage(
        cropCanvas,
        0, 0, boxWidth, boxHeight,
        (innerSize - drawWidth) / 2,
        (innerSize - drawHeight) / 2,
        drawWidth,
        drawHeight
      );

      // Step 4: Center based on centroid
      const innerImage = scaleCtx.getImageData(0, 0, innerSize, innerSize);
      const grayscaleInner = new Float32Array(innerSize * innerSize);
      let totalMass = 0, cx = 0, cy = 0;
      for (let y = 0; y < innerSize; y++) {
        for (let x = 0; x < innerSize; x++) {
          const i = (y * innerSize + x) * 4;
          const alpha = innerImage.data[i + 3];
          const value = alpha / 255;
          grayscaleInner[y * innerSize + x] = value;
          totalMass += value;
          cx += x * value;
          cy += y * value;
        }
      }
      cx /= totalMass;
      cy /= totalMass;

      const shiftX = Math.round(targetSize / 2 - cx);
      const shiftY = Math.round(targetSize / 2 - cy);

      // Step 5: Draw into final 28x28 canvas with translation
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = targetSize;
      finalCanvas.height = targetSize;
      const finalCtx = finalCanvas.getContext("2d");
      finalCtx.clearRect(0, 0, targetSize, targetSize);
      finalCtx.setTransform(1, 0, 0, 1, shiftX, shiftY);
      finalCtx.drawImage(scaleCanvas, 0, 0);
      finalCtx.setTransform(1, 0, 0, 1, 0, 0); // reset

      const finalImageData = finalCtx.getImageData(0, 0, targetSize, targetSize);
      const finalPixels = new Float32Array(targetSize * targetSize);
      for (let i = 0; i < targetSize * targetSize; i++) {
        finalPixels[i] = finalImageData.data[i * 4 + 3] / 255;
      }   
    context.canvas.value = finalPixels;
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