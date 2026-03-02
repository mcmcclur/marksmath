data = [
  [12, 0.144239, 'agolriz'],
  [7, 0.1690946, "narito"],
  [16, 0.142155, "bmartin3"],
  [17, 0.14289, "prsteed"],
  [6, 0.16616, "Mel"],
  [19, 0.137243432, "Cornell"],
  [8, 0.154179958293, "qkupp"],
  [13, 0.15379, "lsavage1"],
  [8, 0.1499, "atobbe"],
  [8, 0.15877, "ncasteve"],
  [8.1, 0.15418, "edomanta"],
  [7.9, 0.154179958, "jgayfiel"],
  [18, 0.142443, "DanielD"],
  [13, 0.1442743482, "bjenkins"],
  [3, 0.196455, "mark"]
].map(function (a) {
  a.name = a[2];
  a.N = a[0];
  a.score = a[1];
  return a;
});
Plot.plot({
  width: 300,
  height: 250,
  x: { domain: [2, 20] },
  y: { domain: [0.135, 0.2] },
  marks: [
    Plot.dot(data, {
      x: "N",
      y: "score",
      tip: true,
      channels: { Name: "name", x: Math.round },
      fill: "black"
    }),
    Plot.linearRegressionY(data, {
      x: "N",
      y: "score",
      ci: 0,
      stroke: "red"
    }),
    Plot.ruleX([2]),
    Plot.ruleY([0.135])
  ]
})
