import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export async function logistic_regression_animation(tf) {

  // Generate some symmetric data that should look good for logistic regression
  const random = d3.randomNormal(2, 2);
  const randoms = d3.range(100).map(random);
  const pts1 = randoms.map((x) => [x, 1]);
  const pts0 = randoms.map((x) => [-x, 0]);
  const data = d3.zip(pts1, pts0).flat(1);

  // Process it to tensor form
  const X = data.map((d) => [d[0]]);
  const y = data.map((d) => [d[1]]);
  const X_tensor = tf.tensor2d(X);
  const y_tensor = tf.tensor2d(y);



  // Represent logistic regression as a single step 
  // neural network with a sigmoid activation function
  // using TensorFlow
  const model = tf.sequential();

  // Add the output layer with input shape specified
  model.add(
    tf.layers.dense({
      units: 1,
      inputShape: [1],
      activation: "sigmoid",
      useBias: false
    })
  );

  // Compile and fit the model
  model.compile({
    optimizer: tf.train.sgd(0.2),
    loss: "binaryCrossentropy",
    metrics: ["accuracy"]
  });
  await model.fit(X_tensor, y_tensor, {
    epochs: 100,
    batchSize: 512,
    shuffle: true,
    verbose: 0
  });

  // Use the model.predict method to generate a sigmoid graph
  const X2 = d3.range(-8, 8, 0.1);
  const X2_tensor = tf.tensor2d(X2.map((x) => [x]));
  const Y2 = Array.from(await model.predict(X2_tensor).data());
  const pts = d3.zip(X2, Y2);
  // End TensorFlow stuff


  // Standard D3 stuff to generate the image
  const w = 600;
  const h = 250;
  const svg = d3
    .create("svg")
    .attr("width", "100%")
    .attr("viewBox", [0, 0, w, h])
    .style("border", "solid 3px currentColor");

  const pad = 10;
  const [xmin, xmax] = [-8, 8];
  const [ymin, ymax] = [0, 1];
  const x_scale = d3
    .scaleLinear()
    .domain([xmin, xmax])
    .range([pad, w - pad]);
  const y_scale = d3
    .scaleLinear()
    .domain([ymin, ymax])
    .range([h - pad, pad]);
  const path = d3
    .line()
    .x((d) => x_scale(d[0]))
    .y((d) => y_scale(d[1]));

  const points = svg.append("g");
  points
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("fill", "currentColor")
    .attr("cx", (d) => x_scale(d[0]))
    .attr("cy", (d) => y_scale(d[1]))
    .attr("r", 5)
    .attr("opacity", 0);
  const logistic_curve = svg.append("g");

  const cscale = d3.scaleLinear().domain([xmin, xmax]).range([0, 1])

  points.selectAll("circle").each(function (c, i) {
    delay(5 * i).then(() => {
      d3.select(this)
      .attr("opacity", 0.8)
      .attr('fill', d3.color(d3.interpolateRdBu(cscale(c[0]))))
      .attr('stroke', 'currentColor')
      .attr('stroke-width', 0.5)
    });
  });

  delay(1000).then(update)
  return svg.node()

  async function update() {
    const curve = logistic_curve
      .append("path")
      .attr("d", path(pts))
      .attr("stroke", "currentColor")
      .attr("stroke-width", 3)
      .attr("fill", "none");
    let length = curve.node().getTotalLength();
    curve
      .attr("stroke-dasharray", [0, length])
      .transition()
      .duration(800)
      .attr("stroke-dasharray", [length, length]);
  }
}


function delay(duration, value) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve(value);
    }, duration);
  });
}
