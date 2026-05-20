export function little_julia(target = "#homepage-julia") {
  const complexDynamics = globalThis.complex_dynamics;
  const d3 = complexDynamics?.d3;
  if (!d3) {
    return null;
  }

  const canvasNode =
    typeof target === "string" ? document.querySelector(target) : target;
  if (!(canvasNode instanceof HTMLCanvasElement)) {
    return null;
  }

  canvasNode.__littleJuliaCleanup?.();

  const canvas = d3.select(canvasNode);
  const opts = { algorithm: "inverse_iteration", fill_size: 1, trail: false };
  let timer = null;
  let startTime = 0;
  let transitionFrom = null;
  let transitionTo = null;
  let lastPoint = { re: -0.001, im: 0 };
  let scales = null;
  let resizeFrame = null;
  let resizeObserver = null;

  const syncCanvasSize = () => {
    const size = getCanvasSize(canvasNode);
    canvas.attr("width", size).attr("height", size);
    scales = {
      width: size,
      height: size,
      x: d3.scaleLinear().domain([0, size]).range([-2, 2]),
      y: d3.scaleLinear().domain([size, 0]).range([-2, 2])
    };
  };

  const render = (c) => {
    if (!canvasNode.isConnected) {
      stopTimer();
      return false;
    }

    syncCanvasSize();
    lastPoint = c;
    const julia = new complexDynamics.QuadraticJuliaSet(c);
    julia.generate(canvasNode, opts);
    return true;
  };

  const ptToComplex = (event) => {
    const [x, y] = pointer(event, canvasNode, d3);
    return { re: scales.x(x), im: scales.y(y) };
  };

  const stopTimer = () => {
    if (timer?.stop) {
      timer.stop();
    }
    timer = null;
  };

  const queueResizeRender = () => {
    if (resizeFrame !== null) {
      return;
    }

    resizeFrame = globalThis.requestAnimationFrame(() => {
      resizeFrame = null;
      render(lastPoint);
    });
  };

  const tickTransition = () => {
    const t = (Date.now() - startTime) / 500;
    const clamped = Math.min(t, 1);
    const c = {
      re: clamped * transitionTo.re + (1 - clamped) * transitionFrom.re,
      im: clamped * transitionTo.im + (1 - clamped) * transitionFrom.im
    };
    render(c);
    if (t >= 1) {
      stopTimer();
      return false;
    }
    return true;
  };

  const onMouseMove = (event) => {
    const c = ptToComplex(event);
    if (c.re * c.re + c.im * c.im < 4) {
      stopTimer();
      render(c);
    }
  };

  const onMouseLeave = () => {
    transitionFrom = lastPoint;
    transitionTo = random_c();
    startTime = Date.now();
    stopTimer();
    timer = d3.timer(tickTransition);
  };

  const onMouseEnter = () => {
    stopTimer();
  };

  if (!render(lastPoint)) {
    return null;
  }

  canvas
    .on("mousemove.little-julia", onMouseMove)
    .on("mouseleave.little-julia", onMouseLeave)
    .on("mouseenter.little-julia", onMouseEnter);

  if (typeof ResizeObserver === "function") {
    resizeObserver = new ResizeObserver(() => {
      queueResizeRender();
    });
    resizeObserver.observe(canvasNode);
  } else {
    globalThis.addEventListener("resize", queueResizeRender);
  }

  const cleanup = () => {
    stopTimer();
    if (resizeFrame !== null) {
      globalThis.cancelAnimationFrame(resizeFrame);
      resizeFrame = null;
    }
    canvas.on(".little-julia", null);
    resizeObserver?.disconnect();
    globalThis.removeEventListener("resize", queueResizeRender);
    delete canvasNode.__littleJuliaCleanup;
  };

  canvasNode.__littleJuliaCleanup = cleanup;
  return cleanup;
}

function getCanvasSize(canvasNode) {
  const measured = Math.round(canvasNode.getBoundingClientRect().width);
  if (measured > 0) {
    return measured;
  }

  const parentWidth = Math.round(
    canvasNode.parentElement?.getBoundingClientRect?.().width ?? 0
  );
  if (parentWidth > 0) {
    return parentWidth;
  }

  const fallback = Math.round(globalThis.innerWidth);
  return Math.max(fallback, 300);
}

function pointer(event, node, d3) {
  const rect = node.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0 && event) {
    const clientX = event.clientX ?? event.pageX;
    const clientY = event.clientY ?? event.pageY;
    if (Number.isFinite(clientX) && Number.isFinite(clientY)) {
      return [
        ((clientX - rect.left) * node.width) / rect.width,
        ((clientY - rect.top) * node.height) / rect.height
      ];
    }
  }

  if (typeof d3.pointer === "function") {
    return d3.pointer(event, node);
  }

  if (typeof d3.mouse === "function") {
    return d3.mouse(node);
  }

  return [0, 0];
}

function random_c() {
  const re = 2 * Math.random() - 1.7;
  const im = 1.5 * Math.random() - 0.75;
  return { re, im };
}
