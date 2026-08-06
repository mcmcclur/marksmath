#!/usr/bin/env python3
"""Convert a SageMath Jupyter notebook into a SageCell-powered Quarto page."""

from __future__ import annotations

import argparse
import base64
import json
import re
import shutil
import sys
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlsplit, urlunsplit


TITLE_RE = re.compile(r"^\s*#\s+(.+?)\s*$")
SCRIPT_CLOSE_RE = re.compile(r"</script", re.IGNORECASE)
MARKDOWN_LINK_RE = re.compile(r"(!?\[[^\]]*\]\()(<[^>\n]+>|[^)\s]+)([^)]*\))")


def source_text(cell: dict[str, Any]) -> str:
    source = cell.get("source", "")
    if isinstance(source, list):
        return "".join(source)
    return str(source)


def yaml_string(value: str) -> str:
    return json.dumps(value)


def js_object(options: dict[str, Any]) -> str:
    return json.dumps(options, separators=(", ", ": "))


def sagecell_header(options: dict[str, Any], server: str) -> list[str]:
    server = server.rstrip("/")
    return [
        f'<script src="{server}/static/embedded_sagecell.js"></script>',
        f"<script>sagecell.makeSagecell({js_object(options)});</script>",
        f'<link rel="stylesheet" type="text/css" href="{server}/static/sagecell_embed.css">',
    ]


def front_matter(
    title: str,
    resources: list[str],
    margin_header: str | None,
    css: str | None,
    toc: bool,
    page_layout: str,
    header_lines: list[str] | None,
) -> str:
    lines = [
        "---",
        f"title: {yaml_string(title)}",
    ]

    if resources:
        lines.append("resources:")
        lines.extend(f"  - {yaml_string(resource)}" for resource in resources)

    if margin_header:
        lines.extend(["margin-header: |", f"  {margin_header}"])

    lines.extend(
        [
            "format:",
            "  html:",
            f"    page-layout: {page_layout}",
            f"    toc: {str(toc).lower()}",
        ]
    )

    if css:
        lines.append(f"    css: {css}")

    if header_lines:
        lines.extend(
            [
                "    include-in-header:",
                "      text: |",
            ]
        )
        lines.extend(f"        {line}" for line in header_lines)

    lines.append("---")
    return "\n".join(lines)


def extract_title(cells: list[dict[str, Any]], fallback: str) -> tuple[str, list[dict[str, Any]]]:
    if not cells or cells[0].get("cell_type") != "markdown":
        return fallback, cells

    text = source_text(cells[0])
    lines = text.splitlines(keepends=True)
    if not lines:
        return fallback, cells

    match = TITLE_RE.match(lines[0])
    if not match:
        return fallback, cells

    title = match.group(1)
    remaining_text = "".join(lines[1:]).lstrip("\n")
    remaining_cells = cells[1:]

    if remaining_text.strip():
        first_cell = dict(cells[0])
        first_cell["source"] = remaining_text
        remaining_cells = [first_cell] + remaining_cells

    return title, remaining_cells


def first_markdown_title(cells: list[dict[str, Any]], fallback: str) -> str:
    if not cells or cells[0].get("cell_type") != "markdown":
        return fallback

    lines = source_text(cells[0]).splitlines()
    if not lines:
        return fallback

    match = TITLE_RE.match(lines[0])
    if match:
        return match.group(1)

    return fallback


def raw_sage_block(code: str, input_class: str) -> str:
    code = SCRIPT_CLOSE_RE.sub(r"<\\/script", code.rstrip())
    return "\n".join(
        [
            f'<div class="{input_class}">',
            '  <script type="text/x-sage">',
            code,
            "  </script>",
            "</div>",
        ]
    )


def is_external_reference(href: str) -> bool:
    if not href or href.startswith("#") or href.startswith("/"):
        return True

    parsed = urlsplit(href)
    return bool(parsed.scheme and parsed.scheme != "attachment") or bool(parsed.netloc)


def is_local_file_reference(href: str) -> bool:
    return not is_external_reference(href) and urlsplit(href).scheme != "attachment"


def unique_asset_name(asset_name: str, used_asset_names: set[str]) -> str:
    candidate = Path(asset_name).name
    stem = Path(candidate).stem
    suffix = Path(candidate).suffix
    index = 2

    while candidate in used_asset_names:
        candidate = f"{stem}-{index}{suffix}"
        index += 1

    used_asset_names.add(candidate)
    return candidate


class AssetCollector:
    def __init__(self, notebook_dir: Path, output_dir: Path) -> None:
        self.notebook_dir = notebook_dir
        self.output_dir = output_dir
        self.used_asset_names: set[str] = set()
        self.copied_files: dict[Path, str] = {}
        self.resources: list[str] = []

    def add_resource(self, name: str) -> None:
        if name not in self.resources:
            self.resources.append(name)
        self.used_asset_names.add(name)

    def copy_file(self, source_path: Path) -> str | None:
        source_path = source_path.resolve()
        if not source_path.is_file():
            return None

        if source_path in self.copied_files:
            return self.copied_files[source_path]

        asset_name = unique_asset_name(source_path.name, self.used_asset_names)
        destination_path = (self.output_dir / asset_name).resolve()
        if source_path != destination_path:
            shutil.copy2(source_path, destination_path)
        self.copied_files[source_path] = asset_name
        self.add_resource(asset_name)
        return asset_name

    def write_attachment(self, attachment_name: str, attachment_data: dict[str, str]) -> str | None:
        if not attachment_data:
            return None

        payload = next(iter(attachment_data.values()))
        asset_name = unique_asset_name(Path(attachment_name).name, self.used_asset_names)
        (self.output_dir / asset_name).write_bytes(base64.b64decode(payload))
        self.add_resource(asset_name)
        return asset_name

    def rewrite_markdown_references(self, text: str, cell: dict[str, Any]) -> str:
        attachments = cell.get("metadata", {}).get("attachments", {})

        def rewrite(match: re.Match[str]) -> str:
            prefix, href, suffix = match.groups()
            wrapped = href.startswith("<") and href.endswith(">")
            raw_href = href[1:-1] if wrapped else href

            if is_external_reference(raw_href):
                return match.group(0)

            parsed = urlsplit(raw_href)
            if parsed.scheme == "attachment":
                attachment_name = unquote(parsed.path)
                asset_name = self.write_attachment(attachment_name, attachments.get(attachment_name, {}))
                if not asset_name:
                    return match.group(0)
                new_href = asset_name
            else:
                asset_path = self.notebook_dir / unquote(parsed.path)
                asset_name = self.copy_file(asset_path)
                if not asset_name:
                    return match.group(0)
                new_href = urlunsplit(("", "", asset_name, parsed.query, parsed.fragment))

            if wrapped:
                new_href = f"<{new_href}>"

            return f"{prefix}{new_href}{suffix}"

        return MARKDOWN_LINK_RE.sub(rewrite, text)


def notebook_link_html(notebook_name: str) -> str:
    notebook_href = f"{notebook_name}?download=1"
    return f'<p class="notebook-version"><a href="{notebook_href}">Notebook version</a></p>'


def convert_notebook(
    notebook_path: Path,
    *,
    output_dir: Path,
    title: str | None,
    css: str | None,
    toc: bool,
    page_layout: str,
    input_class: str,
    include_header: bool,
    linked: bool,
    server: str,
    notebook_name: str | None,
    keep_title_heading: bool,
) -> tuple[str, list[str]]:
    with notebook_path.open(encoding="utf-8") as notebook_file:
        notebook = json.load(notebook_file)

    cells = notebook.get("cells", [])
    if not isinstance(cells, list):
        raise ValueError(f"{notebook_path} does not look like a valid notebook")

    fallback_title = notebook_path.stem.replace("-", " ").replace("_", " ")
    if title:
        document_title = title
    elif keep_title_heading:
        document_title = first_markdown_title(cells, fallback_title)
    else:
        document_title, cells = extract_title(cells, fallback_title)

    asset_collector = AssetCollector(notebook_path.parent, output_dir)
    if notebook_name:
        asset_collector.add_resource(notebook_name)

    if css and is_local_file_reference(css):
        parsed_css = urlsplit(css)
        copied_css = asset_collector.copy_file(notebook_path.parent / unquote(parsed_css.path))
        if copied_css:
            css = urlunsplit(("", "", copied_css, parsed_css.query, parsed_css.fragment))

    header_lines = None
    if include_header:
        options = {"inputLocation": f".{input_class}"}
        if linked:
            options["linked"] = True
        header_lines = sagecell_header(options, server)

    parts = []

    for cell in cells:
        cell_type = cell.get("cell_type")
        tags = set(cell.get("metadata", {}).get("tags", []))
        if "remove-cell" in tags:
            continue

        text = source_text(cell).rstrip()
        if not text:
            continue

        if cell_type == "markdown":
            parts.append(asset_collector.rewrite_markdown_references(text, cell))
        elif cell_type == "code":
            parts.append(raw_sage_block(text, input_class))
        elif cell_type == "raw":
            parts.append(text)

    qmd = "\n\n".join(
        [
            front_matter(
                document_title,
                resources=asset_collector.resources,
                margin_header=notebook_link_html(notebook_name) if notebook_name else None,
                css=css,
                toc=toc,
                page_layout=page_layout,
                header_lines=header_lines,
            ),
            *parts,
        ]
    )

    return qmd.rstrip() + "\n", asset_collector.resources


def output_path_for(notebook_path: Path) -> Path:
    return notebook_path.with_name(notebook_path.stem) / "index.qmd"


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert a SageMath .ipynb notebook into a Quarto .qmd file with embedded SageCell blocks."
    )
    parser.add_argument("notebook", type=Path, help="Path to the source .ipynb notebook")
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        help="Output .qmd path. Defaults to <notebook-stem>/index.qmd beside the notebook.",
    )
    parser.add_argument("--title", help="Override the generated Quarto title")
    parser.add_argument("--css", default="styles.css", help="CSS file to include in the HTML format metadata")
    parser.add_argument("--no-css", action="store_true", help="Do not include a CSS file in the output metadata")
    parser.add_argument("--no-toc", action="store_true", help="Disable the table of contents")
    parser.add_argument("--page-layout", default="article", help="Quarto HTML page layout")
    parser.add_argument("--input-class", default="sage", help="CSS class used for generated SageCell blocks")
    parser.add_argument("--no-header", action="store_true", help="Do not include SageCell scripts in the output metadata")
    parser.add_argument("--no-linked", action="store_true", help="Do not link Sage cells into a shared session")
    parser.add_argument(
        "--no-copy-notebook",
        action="store_true",
        help="Do not copy the source notebook beside the generated page.",
    )
    parser.add_argument(
        "--no-notebook-link",
        action="store_true",
        help="Do not add a right-margin link to the copied notebook.",
    )
    parser.add_argument(
        "--server",
        default="https://sagecell.sagemath.org",
        help="SageCell server root URL",
    )
    parser.add_argument(
        "--keep-title-heading",
        action="store_true",
        help="Keep an initial level-one Markdown heading in the document body",
    )
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    notebook_path = args.notebook

    if notebook_path.suffix != ".ipynb":
        print(f"Expected an .ipynb file: {notebook_path}", file=sys.stderr)
        return 2

    output_path = args.output or output_path_for(notebook_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    notebook_name = None
    if not args.no_copy_notebook:
        notebook_name = notebook_path.name
        notebook_destination = output_path.parent / notebook_name
        if notebook_path.resolve() != notebook_destination.resolve():
            shutil.copy2(notebook_path, notebook_destination)

    qmd, _ = convert_notebook(
        notebook_path,
        output_dir=output_path.parent,
        title=args.title,
        css=None if args.no_css else args.css,
        toc=not args.no_toc,
        page_layout=args.page_layout,
        input_class=args.input_class,
        include_header=not args.no_header,
        linked=not args.no_linked,
        server=args.server,
        notebook_name=None if args.no_notebook_link else notebook_name,
        keep_title_heading=args.keep_title_heading,
    )

    output_path.write_text(qmd, encoding="utf-8")
    print(f"Wrote {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
