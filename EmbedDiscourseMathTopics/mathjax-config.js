// Simple MathJax config file.

window.MathJax = {
  tex: {
    // Recognize $dollar signs$ as inline delimiters.
    // $$double dollars$$ are enabled by default.
    // inlineMath: [['$', '$'], ['\\(', '\\)']]
  },
  loader: {
    // Since I imported MathJax from cloudflare, rather than
    // installing it locally, I need to let MathJax know where
    // to look for additional resources.
    paths: {
      mathjax: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/'
    }
  },
  chtml: {
    fontURL: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/output/chtml/fonts/woff-v2/'
  }
  // // If you want to do something other than just typeset
  // // $this$ $$stuff$$, you can use the startup.pageReady hook.
  // startup: {
  //   pageReady() {
  //     return MathJax.startup.defaultPageReady().then(
  //       // Should probably do something more clever than this
  //       function() {
  //         MathJax.tex2svgPromise("x^2").then(e => console.log(["p", e]));
  //       }
  //     )
  //   }
  // }
};
