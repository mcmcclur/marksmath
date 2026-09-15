// Fetch assignment tags from a WriteTech category.
//
// Requests always use the WriteTech API proxy, so this works from local
// development servers as well as the production site.

const API_PREFIX = "https://math.writetech.ai/discourse-api";

export async function getCategoryAssignments(category) {
  const json = await fetchJson(`${API_PREFIX}${categoryLatestPath(category)}`);
  const latestTag = latestNumberedTagName(json);
  const match = latestTag?.match(/^(.*-)(\d+)$/);

  if (!match) {
    console.warn("Could not find a numbered assignment tag:", {
      latestTag,
      response: json,
    });
    return [];
  }

  const [, tagPrefix, latestNumber] = match;

  return descendingRange(Number(latestNumber)).map((index) => {
    return `${tagPrefix}${index}`;
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

function latestNumberedTagName(json) {
  return tagNames(json?.topic_list?.top_tags)
    .concat(tagNames(json?.topic_list?.topics?.flatMap((topic) => topic.tags)))
    .reduce((latest, tag) => {
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

function descendingRange(start) {
  return Array.from({ length: start }, (_, index) => start - index);
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}
