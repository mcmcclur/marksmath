import {importMathJax} from './importMathJax.js';
const MathJax = importMathJax();
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

export async function embedDiscourseMathTopic(topicId) {
  const replies_container = d3.create('div')
    .attr('class', 'replies-container');
  const reply_button_container = replies_container
    .append('div')
    .attr('class', 'button-container')
    .style('margin', '5px');
  const reply_link = reply_button_container
    .append('a')
    .attr('href', `https://discourse.marksmath.org/t/${topicId}`);
  reply_link
    .append('button')
    .text('Reply on Discourse');

  let page = 1;
  try {
    while(page < 20) {
      const response = await fetch(
        `https://discourse.marksmath.org/t/${topicId}.json?page=${page}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const json = await response.json();
      console.log(json);

      let posts = json.post_stream.posts;
      if(page == 1) {
        posts = posts.slice(1);
      }
      
      if (posts.length <= 1) {
        throw new Error('No posts found in the topic.');
      }
    
      posts.forEach(function(post) {
        if (!post.cooked) {
          throw new Error('Post content is missing.');
        }
        const reply_container = replies_container
          .append('div')
          .attr('class', 'reply-container')
          .style('border-top', 'solid 0.5px black')
          // .style('border-bottom', 'solid 0.5px black');
        
        // Next step is to an info div with the author, date, 
        // and potentially reply to whom info.  

        const post_container = reply_container
          .append('div')
          .attr('class', 'post-container');
        post_container.html(post.cooked);
        post_container.selectAll('span.math')
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
        post_container.selectAll('div.math')
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