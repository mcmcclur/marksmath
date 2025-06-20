// Accepts a graph generated by PyGraphviz and represented
// as an svg string and adds some interactivity.

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import tippyJs from 'https://cdn.jsdelivr.net/npm/tippy.js@6.3.7/+esm'


export function enhance_graph(svg_string, data) {
  const parser = new DOMParser();
  const gsvg = parser
    .parseFromString(svg_string, "image/svg+xml")
    .documentElement;
  const div = d3.create('div')
    .style('max-width', '100%');
  div.append(() => gsvg);
  const svg = div.select('svg')
    .attr('width', null)
    .attr('height', null)
    
  svg.selectAll('.node').nodes()
    .forEach(function(node) {
      const d3Node = d3.select(node)
      d3Node.select('ellipse').attr('fill', 'white');
      const title_node = d3Node.select('title');
      const title = title_node.text().replace('_', ' ');
      let this_data = data.data.filter(
        o => o.Abbreviation == title
      );
      if(this_data.length > 0) {
        this_data = this_data[0];
        const content = `<table>
          <tr><th>Department</th><td>${this_data.Department}</td></tr>
          <tr><th>Requirements</th><td style="text-align: center">${this_data.Requirements}</td></tr>
          <tr><th>Dependents</th><td style="text-align: center">${this_data.Dependents}</td></tr>
        </table>`;
        tippy(node, {
          content: content,
          allowHTML: true
        });
      }
      title_node.remove()
    });
  svg.selectAll("text")
    .style('pointer-events', 'none')
    .each(function () {
      const textNode = d3.select(this);
      const currentText = textNode.text();
      textNode.text(currentText.replace(/_/g, " "));
    })
  
  return div.node()
}
