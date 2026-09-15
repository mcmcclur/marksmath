// Fetch and optionally render WriteTech/Discourse tags from the read-only
// Apache API proxy used by the Discourse topic embedder.
//
// The browser should call /discourse-api/tags.json. Do not put the Discourse
// API key in this file; Apache adds it with RequestHeader before proxying to
// math.writetech.ai.

import { select, create } from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const d3 = { select, create };

const DEFAULT_API_PREFIX = "/discourse-api";
const DEFAULT_DISCOURSE_ORIGIN = "https://math.writetech.ai";

export async function getDiscourseTags(options = {}) {
  const json = await fetchDiscourseTagsJson(options);
  return normalizeTags(json);
}

export async function fetchDiscourseTagsJson(options = {}) {
  const apiPrefix = options.apiPrefix || DEFAULT_API_PREFIX;
  return fetchJson(`${trimTrailingSlash(apiPrefix)}/tags.json`);
}

export async function getDiscourseSequentialCategoryTags(
  categoryPath,
  options = {}
) {
  const json = await fetchDiscourseCategoryLatestJson(categoryPath, options);
  return getSequentialTagsFromCategoryLatestJson(json);
}

export function getSequentialTagsFromCategoryLatestJson(json) {
  const latestTag = getLatestNumberedTagName(json);
  const match = latestTag?.match(/^(.*-)(\d+)$/);

  if (!match) {
    console.warn("Could not derive sequential tags from latest category topic:", {
      latestTag,
      response: json,
    });
    return [];
  }

  const [, tagPrefix, latestNumber] = match;

  return range(Number(latestNumber), 0).map((index) => {
    return `${tagPrefix}${index}`;
  });
}

export async function fetchDiscourseCategoryLatestJson(
  categoryPath,
  options = {}
) {
  const apiPrefix = options.apiPrefix || DEFAULT_API_PREFIX;
  const latestPath = categoryLatestPath(categoryPath);

  return fetchJson(`${trimTrailingSlash(apiPrefix)}${latestPath}`);
}

export async function renderDiscourseTags(target, options = {}) {
  const tags = await getDiscourseTags(options);
  const node = buildTagsList(tags, options);

  if (target) {
    const container =
      typeof target === "string" ? d3.select(target) : d3.select(target);

    container.html("");
    container.append(() => node);
  }

  return node;
}

function buildTagsList(tags, options = {}) {
  const discourseOrigin = options.discourseOrigin || DEFAULT_DISCOURSE_ORIGIN;
  const showCounts = options.showCounts !== false;
  const listClass = options.listClass || "discourse-tags-list";
  const emptyText = options.emptyText || "No WriteTech tags found.";

  const root = d3.create("div").attr("class", "discourse-tags");

  if (tags.length === 0) {
    root.append("p").attr("class", "discourse-tags-empty").text(emptyText);
    return root.node();
  }

  const list = root.append("ul").attr("class", listClass);

  tags.forEach((tag) => {
    const item = list.append("li").attr("class", "discourse-tag");
    const slug = encodeURIComponent(tag.id || tag.text);

    item
      .append("a")
      .attr("href", `${trimTrailingSlash(discourseOrigin)}/tag/${slug}`)
      .attr("target", "_blank")
      .attr("rel", "noopener noreferrer")
      .text(tag.text || tag.id);

    if (showCounts && Number.isFinite(tag.count)) {
      item
        .append("span")
        .attr("class", "discourse-tag-count")
        .text(` (${tag.count})`);
    }
  });

  return root.node();
}

function normalizeTags(json) {
  const tagsById = new Map();

  addTags(tagsById, json?.tags);

  if (Array.isArray(json?.extras?.categories)) {
    json.extras.categories.forEach((category) => {
      addTags(tagsById, category.tags);
    });
  }

  if (Array.isArray(json?.extras?.tag_groups)) {
    json.extras.tag_groups.forEach((tagGroup) => {
      addTags(tagsById, tagGroup.tags);
    });
  }

  const tags = Array.from(tagsById.values()).sort((a, b) =>
    a.text.localeCompare(b.text)
  );

  if (tags.length === 0) {
    console.warn("No Discourse tags found in /tags.json response:", {
      topLevelKeys: Object.keys(json || {}),
      extrasKeys: Object.keys(json?.extras || {}),
      response: json,
    });
  }

  return tags;
}

function addTags(tagsById, tags) {
  if (!Array.isArray(tags)) {
    return;
  }

  tags
    .map(normalizeTag)
    .filter(Boolean)
    .forEach((tag) => {
      const existing = tagsById.get(tag.id);

      if (!existing) {
        tagsById.set(tag.id, tag);
        return;
      }

      if (Number.isFinite(tag.count) && tag.count > existing.count) {
        tagsById.set(tag.id, { ...existing, count: tag.count });
      }
    });
}

function normalizeTag(tag) {
  if (typeof tag === "string") {
    return {
      id: tag,
      text: tag,
      count: Number.NaN,
      raw: tag,
    };
  }

  if (!tag || typeof tag !== "object") {
    return null;
  }

  const id = tag.id || tag.text || tag.name;
  const text = tag.text || tag.name || tag.id;

  if (!id && !text) {
    return null;
  }

  return {
    id,
    text,
    count: Number(tag.count),
    raw: tag,
  };
}

function getLatestNumberedTagName(json) {
  const tags = [
    ...tagNames(json?.topic_list?.top_tags),
    ...tagNames(
      json?.topic_list?.topics?.flatMap((topic) => topic.tags || [])
    ),
  ];

  return tags.reduce((latest, tag) => {
    const tagNumber = trailingNumber(tag);
    const latestNumber = trailingNumber(latest);

    if (tagNumber === null) {
      return latest;
    }

    if (latestNumber === null || tagNumber > latestNumber) {
      return tag;
    }

    return latest;
  }, null);
}

function tagNames(tags) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags.map(tagName).filter(Boolean);
}

function tagName(tag) {
  if (typeof tag === "string") {
    return tag;
  }

  return tag?.name || tag?.id || null;
}

function trailingNumber(value) {
  const match = value?.match(/-(\d+)$/);
  return match ? Number(match[1]) : null;
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

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function categoryLatestPath(categoryPath) {
  let path = categoryPath.trim();

  if (/^https?:\/\//i.test(path)) {
    const url = new URL(path);
    path = `${url.pathname}${url.search}`;
  }

  if (!path.startsWith("/")) {
    path = path.startsWith("c/") ? `/${path}` : `/c/${path}`;
  }

  if (!path.includes(".json")) {
    path = `${trimTrailingSlash(path)}/l/latest.json`;
  }

  if (!/[?&]order=/.test(path)) {
    path += path.includes("?") ? "&order=created" : "?order=created";
  }

  return path;
}

function range(start, stop) {
  const step = start <= stop ? 1 : -1;
  const length = Math.abs(stop - start);

  return Array.from({ length }, (_, index) => start + index * step);
}
