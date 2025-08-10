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
        

        // Info div with avatar, username, and formatted timestamp
        const info_div = reply_container
          .append('div')
          .attr('class', 'info-div')
          .style('display', 'flex')
          .style('align-items', 'center')
          .style('gap', '10px')
          .style('margin', '5px 0');

        // Avatar image
        const avatar_url = `https://discourse.marksmath.org${post.avatar_template.replace('{size}', '42')}`;
        const avatar_img = info_div
          .append('img')
          .attr('src', avatar_url)
          .attr('alt', `${post.username}'s avatar`)
          .style('width', '42px')
          .style('height', '42px')
          .style('border-radius', '50%')
          .style('border', '1px solid #ccc');

        // Username label (below avatar)
        const user_div = info_div
          .append('div')
          .style('display', 'flex')
          .style('flex-direction', 'column')
          .style('align-items', 'center');
        user_div
          .append('span')
          .text(post.username)
          .style('font-size', '0.9em')
          .style('font-weight', 'bold');

        // Format timestamp as M/D h:mm AM/PM
        const date = new Date(post.created_at);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const formatted = `${month}/${day} ${hours}:${minutes} ${ampm}`;
        user_div
          .append('span')
          .text(formatted)
          .style('font-size', '0.8em')
          .style('color', '#666');

        const post_container = reply_container
          .append('div')
          .attr('class', 'post-container');
        post_container.html(post.cooked);
        post_container.selectAll('span.math')
          .nodes()
          .forEach(function(span) {
            const d3Span = d3.select(span);
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