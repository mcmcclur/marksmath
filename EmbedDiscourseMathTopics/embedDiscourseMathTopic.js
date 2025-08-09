import {importMathJax} from './importMathJax.js';
const MathJax = importMathJax();
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

export async function embedDiscourseMathTopic(topicId) {
  const replies_container = d3.create('div');
  replies_container.attr('class', 'replies-container');
  let page = 1;
  try {
    while(page < 20) {
      const response = await fetch(
        `https://discourse.marksmath.org/t/${topicId}.json?page=${page}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const json = await response.json();
      const posts = json.post_stream.posts;
      
      if (posts.length <= 1) {
        throw new Error('No posts found in the topic.');
      }
    
      posts.forEach(function(post) {
        if (!post.cooked) {
          throw new Error('Post content is missing.');
        }
      const div = replies_container
          .append('div')
          .style('border-top', 'solid 0.5px black')
          .style('border-bottom', 'solid 0.5px black');
        div.html(post.cooked);
        div.selectAll('span.math')
          .nodes()
          .forEach(function(span) {
            const d3Span = d3.select(span);
            // const new_content = katex.render(d3Span.html(), d3Span.node())
            const new_content = MathJax.tex2svg(
              d3Span.html(), 
              {display: false}
            );
            d3Span.html('');
            d3Span.append(() => new_content);
            d3Span.attr('class', 'math');
          });
        div.selectAll('div.math')
          .nodes()
          .forEach(function(Div) {
            const d3Div = d3.select(Div);
            const new_content = MathJax.tex2svg(
              d3Div.html(), 
              {display: true}
            );
            d3Div.html('');
            d3Div.append(() => new_content);
            d3Div.attr('class', 'math');
          });
      });
      page = page+1;
    }
  } catch (error) {
    if (error.message && error.message.includes('404')) {
      "pass";
    } else {
      console.error('Error fetching data:', error);
    }
  }
  finally {
    const node = replies_container.node();
    if (node.children.length === 0) {
      return null;
    }
    return node;
  }
}