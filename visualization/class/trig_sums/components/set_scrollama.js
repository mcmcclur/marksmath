import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

export function set_scrollama(sticky_viz) {
  const scroll_container = d3
    .select("section#scroll_container");
  const figure = scroll_container.select("figure");
  const article = scroll_container.select("article");
  const step0 = article.select('.step')
  const step = article.selectAll(".step");
  // const info = figure.select('.info')

  const scroller = scrollama();
  function handleResize() {
    const stepH = Math.floor(window.innerHeight * 0.8);
    const figureHeight = window.innerHeight*0.95;
    const figureMarginTop = (window.innerHeight - figureHeight)/2;
    figure
      .style("height", figureHeight + "px")
      .style("top", figureMarginTop + "px");
    step.style("height", stepH + "px");
    step0
      // .style("height", '200px')
      .style("margin-top", `-${figureHeight-100}px`)
    scroller.resize();
  }

  function handleStepEnter({index, direction}) {
    const sv = d3.select(sticky_viz);
    if(direction == "down") {
      sv
        .selectAll(`.step${index}`)
        .transition()
        .duration(500)
        .attr('opacity', 1);
      if(index == 9) {
        sv      
          .selectAll(`.fade9`)
          .attr("opacity", 1)
          .transition()
          .duration(300)
          .attr("opacity", 0.2);        
      } else if(index == 10) {
        sv
           .selectAll(`.highlight9`)
           .attr("opacity", 1)
           .transition()
           .duration(300)
           .attr("opacity", 0.2);
         sv
           .selectAll(`.highlight10`)
           .attr("opacity", 0.2)
           .transition()
           .duration(300)
           .attr("opacity", 1);
      }
    } else if(direction == "up") {
      sv
        .selectAll(`.step${index+1}`) 
        .transition()
        .duration(500)
        .attr('opacity', 0);
      if(index == 9) {
        sv
           .selectAll(`.highlight9`)
           .attr("opacity", 0.2)
           .transition()
           .duration(300)
           .attr("opacity", 1);
         sv
           .selectAll(`.highlight10`)
           .attr("opacity", 1)
           .transition()
           .duration(300)
           .attr("opacity", 0.2);
      } else if(index == 8) {
        sv
          .selectAll("g.mathjax")
          .transition()
          .duration(300)
          .attr('opacity', 1)
      }
    }
    

  }


  function init() {
    handleResize();
    scroller
      .setup({
        step: "#scroll_container article .step",
        offset: 0.6,
        debug: false
      })
      .onStepEnter(handleStepEnter);
    window.onbeforeunload = function () {
      window.scrollTo(0, 0);
    }
  }

  // kick things off
  init();
}
