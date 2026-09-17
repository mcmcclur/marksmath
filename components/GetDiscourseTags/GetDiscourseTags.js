// Fetch assignment tags from a WriteTech category. 
// This allows us to automatically build a dropdown menu in 
// a class webpage to access HWs assignment by assignment.
//
// Requests use the same-origin API proxy configured on marksmath.org.

const API_PREFIX = "/discourse-api";
const EASTERN_TIME = "America/New_York";

export async function getCategoryAssignments(category) {
  const json = await fetchJson(`${API_PREFIX}${categoryLatestPath(category)}`);
  const assignments = assignmentTags(json);

  if (assignments.length === 0) {
    console.warn("Could not find a numbered assignment tag:", {
      response: json,
    });
    return [];
  }

  return Promise.all(assignments.map(addCloseDate));
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

async function addCloseDate(assignment) {
  const tagJson = await fetchJson(`${API_PREFIX}${tagPath(assignment)}`);
  const topicId = tagJson?.topic_list?.topics?.[0]?.id;

  if (!topicId) {
    return {
      tag: assignment.name,
      close: null,
      closed: false,
    };
  }

  const topicJson = await fetchJson(`${API_PREFIX}/t/${topicId}.json`);
  const executeAt = topicJson?.topic_timer?.execute_at;

  return {
    tag: assignment.name,
    close: formatCloseDate(executeAt),
    closed: topicJson?.closed === true || closeDateHasPassed(executeAt),
  };
}

function categoryLatestPath(category) {
  let path = category.trim();

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

function assignmentTags(json) {
  const byName = tagObjects(json?.topic_list?.top_tags)
    .concat(tagObjects(json?.topic_list?.topics?.flatMap((topic) => topic.tags)))
    .filter((tag) => trailingNumber(tag.name) !== null)
    .reduce((tags, tag) => {
      if (!tags.has(tag.name)) {
        tags.set(tag.name, tag);
      }

      return tags;
    }, new Map());

  return Array.from(byName.values())
    .sort((a, b) => trailingNumber(b.name) - trailingNumber(a.name));
}

function tagObjects(tags) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags.map(tagObject).filter(Boolean);
}

function tagObject(tag) {
  if (typeof tag === "string") {
    return {
      id: null,
      name: tag,
    };
  }

  const name = tag?.name || tag?.slug || String(tag?.id || "");

  if (!name) {
    return null;
  }

  return {
    id: tag.id || null,
    name,
  };
}

function tagPath(tag) {
  const encodedTag = encodeURIComponent(tag.name);

  if (tag.id) {
    return `/tag/${encodedTag}/${encodeURIComponent(tag.id)}.json`;
  }

  return `/tag/${encodedTag}.json`;
}

function trailingNumber(value) {
  const match = value?.match(/-(\d+)$/);
  return match ? Number(match[1]) : null;
}

function formatCloseDate(value) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN_TIME,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function closeDateHasPassed(value) {
  return value ? new Date(value).getTime() <= Date.now() : false;
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}
