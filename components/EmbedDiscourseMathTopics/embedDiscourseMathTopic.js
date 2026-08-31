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
// (on Apache) to proxy requests to math.writetech.ai.
// To do so, place the following within the VirtualHost block in
// /etc/apache2/sites-enabled/marksmath.org-le-ssl.conf

//     # ---- Discourse read-only API proxy ----
//     SSLProxyEngine On
//     ProxyRequests Off
//     ProxyPassMatch ^/discourse-api/(.*)$ https://math.writetech.ai/$1
//     ProxyPassReverse /discourse-api/ https://math.writetech.ai/
//     <Location /discourse-api/>
//         RequestHeader set Api-Key "ReadOnlyAPIKey"
//         RequestHeader set Api-Username "username_with_access"
//         Header unset Set-Cookie
//     </Location>
// 

import { importMathJax } from "./importMathJax.js";
import { select, create } from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const MathJax = importMathJax();
const d3 = { select, create };

const DISCOURSE_ORIGIN = "https://math.writetech.ai";
const API_PREFIX = "/discourse-api";
const POST_BATCH_SIZE = 50;

export async function embedDiscourseMathTopic(topicId) {
  const repliesContainer = d3
    .create("div")
    .attr("class", "replies-container");

  const renderedPostIds = new Set();

  try {
    const topic = await fetchJson(`${API_PREFIX}/t/${topicId}.json`);
    const topicUrl = discourseTopicUrl(topic, topicId);

    addReplyButton(repliesContainer, topicUrl);

    const initialPosts = topic.post_stream?.posts || [];
    renderPosts(
      repliesContainer,
      initialPosts.filter((post) => post.post_number !== 1),
      renderedPostIds
    );

    // Mark every initially loaded post as seen, including the original post.
    initialPosts.forEach((post) => renderedPostIds.add(post.id));

    const stream = topic.post_stream?.stream || [];
    const remainingPostIds = stream.filter((id) => !renderedPostIds.has(id));

    for (const batch of chunks(remainingPostIds, POST_BATCH_SIZE)) {
      const params = batch
        .map((id) => `post_ids[]=${encodeURIComponent(id)}`)
        .join("&");

      const postsJson = await fetchJson(
        `${API_PREFIX}/t/${topicId}/posts.json?${params}`
      );

      renderPosts(
        repliesContainer,
        postsJson.post_stream?.posts || [],
        renderedPostIds
      );
    }
  } catch (error) {
    console.error("Error fetching Discourse topic:", error);
  }

  const node = repliesContainer.node();
  return node.children.length === 0 ? null : node;
}

function addReplyButton(container, topicUrl) {
  const buttonContainer = container
    .append("div")
    .attr("class", "button-container")
    .style("margin", "5px");

  const replyLink = buttonContainer
    .append("a")
    .attr("href", topicUrl)
    .attr("target", "_blank")
    .attr("rel", "noopener noreferrer");

  replyLink.append("button").text("Reply on WriteTech");
}

function renderPosts(container, posts, renderedPostIds) {
  posts.forEach((post) => {
    if (!post?.id || renderedPostIds.has(post.id)) {
      return;
    }

    renderedPostIds.add(post.id);

    if (!post.cooked) {
      return;
    }

    const replyContainer = container
      .append("div")
      .attr("class", "reply-container")
      .style("border-top", "solid 0.8px #aaa")
      .style("padding", "10px");

    const infoDiv = replyContainer
      .append("div")
      .attr("class", "info-div")
      .style("display", "flex")
      .style("align-items", "center")
      .style("gap", "10px")
      .style("margin", "5px 0");

    const avatarUrl = absoluteDiscourseUrl(
      post.avatar_template?.replace("{size}", "42")
    );

    infoDiv
      .append("img")
      .attr("src", avatarUrl)
      .attr("alt", `${post.username}'s avatar`)
      .style("width", "42px")
      .style("height", "42px")
      .style("border-radius", "50%")
      .style("border", "1px solid #ccc");

    const userDiv = infoDiv
      .append("div")
      .style("display", "flex")
      .style("flex-direction", "column")
      .style("align-items", "center");

    userDiv
      .append("span")
      .text(post.username)
      .style("font-size", "0.9em")
      .style("font-weight", "bold");

    userDiv
      .append("span")
      .text(formatPostDate(post.created_at))
      .style("font-size", "0.8em")
      .style("color", "#666");

    const postContainer = replyContainer
      .append("div")
      .attr("class", "post-container");

    postContainer.html(post.cooked);
    rewriteDiscourseUrls(postContainer);
    renderMath(postContainer);
    flattenMentions(postContainer);
    addReactions(replyContainer, post);
  });
}

function rewriteDiscourseUrls(postContainer) {
  postContainer
    .selectAll("a[href], img[src], source[src], video[src], audio[src]")
    .each(function () {
      const el = d3.select(this);

      ["href", "src"].forEach((attr) => {
        const value = el.attr(attr);
        if (value) {
          el.attr(attr, absoluteDiscourseUrl(value));
        }
      });

      if (this.tagName.toLowerCase() === "a") {
        el.attr("target", "_blank").attr("rel", "noopener noreferrer");
      }
    });
}

function renderMath(postContainer) {
  postContainer
    .selectAll("span.math")
    .nodes()
    .forEach((span) => {
      replaceMathNode(span, false);
    });

  postContainer
    .selectAll("div.math")
    .nodes()
    .forEach((div) => {
      replaceMathNode(div, true);
    });
}

function replaceMathNode(node, display) {
  const d3Node = d3.select(node);
  const decoded = decodeEntities(d3Node.html());
  const svg = MathJax.tex2svg(decoded, { display });

  d3Node.html("");
  d3Node.append(() => svg);
  d3Node.attr("class", "math");
}

function flattenMentions(postContainer) {
  postContainer.selectAll("a.mention").each(function () {
    const a = d3.select(this);

    d3.select(this.parentNode)
      .insert("span", function () {
        return a.node();
      })
      .attr("class", "mention text-muted")
      .style("text-decoration", "none")
      .text(a.text());

    a.remove();
  });
}

function addReactions(replyContainer, post) {
  if (!Array.isArray(post.reactions) || post.reactions.length === 0) {
    return;
  }

  const emojiMap = {
    "+1": "👍",
    heart: "❤️",
    poop: "💩",
    thinking: "🤔",
  };

  const reactionsRow = replyContainer
    .append("div")
    .attr("class", "reactions-row")
    .style("display", "flex")
    .style("gap", "12px")
    .style("margin", "6px 0 0 0")
    .style("align-items", "center");

  post.reactions.forEach((reaction) => {
    const emoji = emojiMap[reaction.id] || reaction.id;

    const reactionDiv = reactionsRow
      .append("span")
      .style("display", "flex")
      .style("align-items", "center")
      .style("font-size", "1.1em");

    reactionDiv.append("span").text(emoji).style("margin-right", "3px");

    reactionDiv
      .append("span")
      .text(reaction.count)
      .style("color", "#888")
      .style("font-size", "0.95em");
  });
}

async function fetchJson(url) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status} while fetching ${url}`);
  }

  return response.json();
}

function discourseTopicUrl(topic, topicId) {
  if (topic?.slug && topic?.id) {
    return `${DISCOURSE_ORIGIN}/t/${topic.slug}/${topic.id}`;
  }

  return `${DISCOURSE_ORIGIN}/t/${topicId}`;
}

function absoluteDiscourseUrl(url) {
  if (!url) {
    return "";
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (url.startsWith("//")) {
    return `https:${url}`;
  }

  if (url.startsWith("/")) {
    return `${DISCOURSE_ORIGIN}${url}`;
  }

  return url;
}

function formatPostDate(value) {
  const date = new Date(value);

  const month = date.getMonth() + 1;
  const day = date.getDate();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;

  return `${month}/${day} ${hours}:${minutes} ${ampm}`;
}

function chunks(values, size) {
  const result = [];

  for (let i = 0; i < values.length; i += size) {
    result.push(values.slice(i, i + size));
  }

  return result;
}

function decodeEntities(str) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = str;
  return textarea.value;
}
