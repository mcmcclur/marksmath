import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

export async function run_knn(input, classifier) {
if(input) {
  const display = d3.create('div')
  display.append('div')
    .text("KNN Says")
    .style('font-weight', 'bold');
  let prediction_cnts = (await classifier.predictClass(input, 20)).confidences;
  prediction_cnts = d3.sort(
    Object.values(prediction_cnts).map((cnt, d) => ({ d, cnt })),
    (o) => -o.cnt).filter((o) => o.cnt > 0);
  if(prediction_cnts.length == 1) {
    if(prediction_cnts[0].d == 8) {
      display.append('div')
        .text("That's an 8!")
      }
      else {
        display.append('div')
          .text(`That's a ${prediction_cnts[0].d}!`)
      }
    }
    else {
      display.append('div')
        .text("Test inconclusive; class counts are:");
      const table = display.append('table')
      const digit_row = table.append('tr');
      digit_row.append('th')
        .text('d')
        .style('background-color', '#aaa')
        .style('border', 'solid 1px currentcolor')
        .style('padding', '1px 5px 1px 5px');
      const cnt_row = table.append('tr')
      cnt_row.append('th')
        .text('cnt')
        .style('background-color', '#aaa')
        .style('border', 'solid 1px currentcolor')
        .style('padding', '1px 5px 1px 5px');
      prediction_cnts.forEach(function(o) {
        digit_row.append('td')
          .text(o.d)
          .style('border', 'solid 1px currentcolor')
          .style('text-align', 'center')
        cnt_row.append('td')
          .text(d3.format('0.2f')(o.cnt))
          .style('border', 'solid 1px currentcolor')
          .style('padding', '1px 3px 1px 3px');
      })
    }
    return display.node();
} else {
    const display = d3.create('div');
    return display.node();
  }
}