import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

export async function run_cnn(input, model) {
if(input) {
    const prediction = model.predict(input);
    const predictedProbabilities = await prediction.data();
    const probs =  d3.sort(Array.from(predictedProbabilities)
      .map((p,digit) => ({p,digit})), o => -o.p);
    const display = d3.create('div')
    display.append('div')
      .text("CNN Says")
      .style('font-weight', 'bold')
    if(probs[0].p > 0.99) {
      if(probs[0].digit == 8) {
        display.append('div')
          .text("That's an 8!")
      }
      else {
        display.append('div')
          .text(`That's a ${probs[0].digit}!`)
      }
      return display.node();
    }
    else {
      const results = probs.filter(o => o.p > 0.01);
      display.append('div')
        .text("Test inconclusive; probabilities are:");
      const table = display.append('table')
      const digit_row = table.append('tr');
      digit_row.append('th')
        .text('d')
        .style('background-color', '#aaa')
        .style('border', 'solid 1px currentcolor')
        .style('padding', '1px 5px 1px 5px');
      const prob_row = table.append('tr')
      prob_row.append('th')
        .text('p')
        .style('background-color', '#aaa')
        .style('border', 'solid 1px currentcolor')
        .style('padding', '1px 5px 1px 5px');
      results.forEach(function(o) {
        digit_row.append('td')
          .text(o.digit)
          .style('border', 'solid 1px currentcolor')
          .style('text-align', 'center')
        prob_row.append('td')
          .text(d3.format('0.3f')(o.p))
          .style('border', 'solid 1px currentcolor')
          .style('padding', '1px 3px 1px 3px');
      })
    }
    return display.node();
  }
  else {
    const display = d3.create('div');
    display.text("Waiting for input...");
    return display.node();
  }
}

