// I use this script to embed Discourse topics into my website.
// Still needs work. It seems that content with embedded
// Desmos iframes kills the cooked content so that nothing
// shows up.
// 
// Generally, I embed topics that are created for students to
// reply to with questions about review sheets. As such, the 
// ability to typeset mathematics is critical and, as far as I
// can tell, the standard way to embed posts via Discourse 
// doesn't support math rendering. So, I wrote this.
// 
// Note that the script fetches posts in the topic from 
// /discourse-api/t/{topicId}.json.
// For this to work, I needed to configure my main website
// (on Apache) to proxy requests to discourse.marksmath.org.
// To do so, place the following within the VirtualHost block in
// /etc/apache2/sites-enabled/marksmath.org-le-ssl.conf

//     # ---- Discourse read-only API proxy ----
//     SSLProxyEngine On
//     ProxyRequests Off
//     ProxyPassMatch ^/discourse-api/(.*)$ https://discourse.marksmath.org/$1
//     ProxyPassReverse /discourse-api/ https://discourse.marksmath.org/
//     <Location /discourse-api/>
//         RequestHeader set Api-Key "ReadOnlyAPIKey"
//         RequestHeader set Api-Username "username_with_access"
//         Header unset Set-Cookie
//     </Location>

import {importMathJax} from './importMathJax.js';
const MathJax = importMathJax();
import {select, create} from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
const d3 = {select, create};

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
        `/discourse-api/t/${topicId}.json?page=${page}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const json = await response.json();

      let posts = json.post_stream.posts;
      if (posts.length <= 1) {
        throw new Error('No posts found in the topic.');
      }
      if(page == 1) {
        posts = posts.slice(1);
      }


      posts.forEach(function(post) {
        if (!post.cooked) {
          throw new Error('Post content is missing.');
        }
        const reply_container = replies_container
          .append('div')
          .attr('class', 'reply-container')
          .style('border-top', 'solid 0.8px #aaa')
          .style('padding', '10px ');        

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
            const coded_content = d3Span.html();
            const decoded = decodeEntities(coded_content);
            const new_content = MathJax.tex2svg(
              decoded, 
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
            const coded_content = d3Div.html();
            const decoded = decodeEntities(coded_content);
            const new_content = MathJax.tex2svg(
              decoded, 
              {display: true}
            );
            d3Div.html('');
            d3Div.append(() => new_content);
            d3Div.attr('class', 'math');
          });
        post_container
          .selectAll('a.mention')
          .each(function() {
            const a = d3.select(this);
            d3.select(this.parentNode)
              .insert('span', function() { return a.node(); })
              .attr('class', 'mention text-muted')
              .style('text-decoration', 'none')
              .text(a.text());
            a.remove();
          });

        // Add reactions here
        if (Array.isArray(post.reactions) && post.reactions.length > 0) {
          const emojiMap = {
            '+1': '👍',
            'heart': '❤️',
            'poop': '💩',
            'thinking': '🤔'
            // Add more mappings as needed
          };
          const reactions_row = reply_container
            .append('div')
            .attr('class', 'reactions-row')
            .style('display', 'flex')
            .style('gap', '12px')
            .style('margin', '6px 0 0 0')
            .style('align-items', 'center');
          post.reactions.forEach(function(reaction) {
            const emoji = emojiMap[reaction.id] || reaction.id;
            const reaction_div = reactions_row
              .append('span')
              .style('display', 'flex')
              .style('align-items', 'center')
              .style('font-size', '1.1em');
            reaction_div
              .append('span')
              .text(emoji)
              .style('margin-right', '3px');
            reaction_div
              .append('span')
              .text(reaction.count)
              .style('color', '#888')
              .style('font-size', '0.95em');
          });
        }
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


function decodeEntities(str) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = str;
  return textarea.value;
}