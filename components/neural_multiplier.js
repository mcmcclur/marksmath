import {
  select,
  interpolateRdBu,
  max,
  format,
  randomUniform,
  scaleLinear,
  create
} from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
const d3 = {
  create,
  select,
  interpolateRdBu,
  max,
  format,
  randomUniform,
  scaleLinear
}

export function animate_network(model) {
  const network = new Network(model);
  const input = [
    d3.randomUniform(-1, 1)(),
    d3.randomUniform(-1, 1)()
  ];
  const result = network.forward(input);

  const w = 380;
  const h = 420;
  const pad = 40;

  const fill_color = d3
    .scaleLinear()
    .domain([-1, 1])
    .interpolate((d) => d3.interpolateRdBu);

  const svg = d3
    .create("svg")
    .attr("viewBox", [0, 0, w, h])
    .style("max-width", `${w}px`);

  const viz = svg.append("g");
  const edges = viz.append("g");
  const nodes = viz.append("g")
    .attr('opacity', 0)

  const max_nodes = d3.max(result.map((o) => o.z.length));
  const h_step = (w - 2 * pad) / (max_nodes - 1);
  const v_step = (h - 2 * pad) / result.length;

  const input_nodes = nodes.append("g")
  input_nodes
    .selectAll("circle")
    .data(input)
    .join("circle")
    .attr("cx", (d, i) => w / 2 - h_step + 2 * i * h_step)
    .attr("cy", (d, i) => h - pad)
    .attr("r", 8)
    .attr("fill", fill_color)
    .classed('responsive-stroke', true)

  let node_cnt = 0;
  result.forEach(function ({ z, a }, j) {
    const layer = nodes.append("g");
    layer
      .selectAll("circle")
      .data(a)
      .join("circle")
      .attr(
        "cx",
        (d, i) => pad + (h_step * (max_nodes - a.length)) / 2 + i * h_step
      )
      .attr("cy", (d) => {
        return h - pad - (j + 1) * v_step;
      })
      .attr("r", 8)
      .attr("fill", "black")
      // .attr('class', 'delay')
      .classed('delay', true)
      .classed('responsive-stroke', true)
      .attr("data-value", (d) => d);
  });

  nodes
    .transition()
    .duration(300)
    .attr('opacity', 1)

  nodes.selectAll("circle.delay").each(
    function (value, idx) {
      delay(180 * idx).then(() =>
        d3.select(this)
          .transition()
          .duration(50)
          .attr("fill", fill_color(value))
      );
  });

  let cnt = 1;
  const layers = nodes.selectAll("g").nodes();
  for (let i = 1; i <= layers.length; i++) {
    const in_layer = d3.select(layers[i - 1]);
    const out_layer = d3.select(layers[i]);
    in_layer
      .selectAll("circle")
      .nodes()
      .forEach(function (c1) {
        const x1 = c1.getAttribute("cx");
        const y1 = c1.getAttribute("cy");
        out_layer
          .selectAll("circle")
          .nodes()
          .forEach(function (c2) {
            const x2 = c2.getAttribute("cx");
            const y2 = c2.getAttribute("cy");
            delay(40 * cnt++).then(function () {
              const edge = edges
                .append("line")
                .attr("x1", x1)
                .attr("y1", y1)
                .attr("x2", x2)
                .attr("y2", y2)
                .attr("stroke-width", 0.5)
                .classed("responsive-stroke", true);
              const length = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
              edge
                .attr("stroke-dasharray", [0, length])
                .transition()
                .duration(350)
                .attr("stroke-dasharray", [length, length]);
            });
          });
      });
  }
  return svg.node();
}

// Classes to define a simple neural network
class Neuron {
  constructor(weights, bias, activation) {
    this.weights = weights;
    this.bias = bias;
    this.activation = activation;
  }

  compute(inputs) {
    const z = this.weights.reduce(
      (sum, w, i) => sum + w * inputs[i],
      this.bias
    );
    const a = this.activationFunc(z);
    return { z, a };
  }

  get activationFunc() {
    return this.activation === "tanh" ? tanh : linear;
  }
}

// Layer class
class Layer {
  constructor(config, activation) {
    this.neurons = config.map(
      (n) => new Neuron(n.weights, n.bias, activation)
    );
    this.activation = activation;
  }

  compute(inputs) {
    return this.neurons.map((neuron) => neuron.compute(inputs));
  }
}

// Network class
class Network {
  constructor(model) {
    this.layers = model.layers.map(
      (layer) => new Layer(layer.neurons, layer.activation)
    );
  }

  forward(input) {
    const result = [];
    let currentInput = input;

    for (const layer of this.layers) {
      const layerOutput = layer.compute(currentInput);
      const activations = layerOutput.map(({ a }) => a);
      result.push({
        z: layerOutput.map(({ z }) => z),
        a: activations
      });
      currentInput = activations;
    }

    return result;
  }
}



function tanh(x) {
  return Math.tanh(x);
}

function linear(x) {
  return x;
}

function delay(duration, value) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve(value);
    }, duration);
  });
}
