#!/usr/bin/env python3
from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import urlparse, urlunparse

try:
    import openpyxl
except ImportError as exc:  # pragma: no cover - runtime dependency guard
    print("Missing dependency: openpyxl", file=sys.stderr)
    raise SystemExit(2) from exc


ROOT = Path(__file__).resolve().parents[1]
WORKBOOK_DEFAULT = ROOT.parent / "FPV_RAG_Web_List_CLEAN.xlsx"
MANIFEST_DEFAULT = ROOT / "data" / "fpv-rag-seeds.manifest.json"
FAILED_DEFAULT = ROOT / "data" / "fpv-rag-seeds.failed.json"
LAST_RUN_DEFAULT = ROOT / "data" / "fpv-rag-seeds.last-run.json"
BACKLOG_DEFAULT = ROOT / "data" / "fpv-rag-source-backlog.json"
BACKLOG_PACK_DEFAULT = ROOT / "data" / "fpv-rag-source-pack.json"
DEFERRED_PACK_DEFAULT = ROOT / "data" / "fpv-rag-deferred-pack.json"
REPO_PACK_DEFAULT = ROOT / "data" / "fpv-rag-repo-pack.json"


def load_env_file(path: Path) -> None:
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[len("export ") :].strip()
        if "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if value and value[0] in {'"', "'"} and value[-1:] == value[0]:
            value = value[1:-1]
        os.environ.setdefault(key, value)


def bootstrap_env() -> None:
    load_env_file(ROOT / ".env.local")
    load_env_file(ROOT / ".env")


def split_multi(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, (int, float)):
        return [str(value)]

    text = str(value).strip()
    if not text:
        return []

    parts: list[str] = []
    for chunk in text.replace("\n", ",").split(","):
        item = chunk.strip()
        if item:
            parts.append(item)
    return parts


def as_int(value: Any) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def as_float(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def normalize_seed_row(row: dict[str, Any]) -> dict[str, Any]:
    job_id = row.get("Job_ID")
    http_error = row.get("http_error")
    final_url = row.get("final_url")
    return {
        "seed_url": str(row.get("Seed_URL", "")).strip(),
        "tag": str(row.get("Tag", "")).strip(),
        "job_tag": str(row.get("Tag.1", "")).strip(),
        "max_depth": as_int(row.get("Max_Depth")),
        "include_paths": split_multi(row.get("Include_Paths")),
        "exclude_paths": split_multi(row.get("Exclude_Paths")),
        "status": str(row.get("Status", "")).strip(),
        "last_crawled": row.get("Last_Crawled"),
        "job_id": None if job_id in (None, "") else str(job_id).strip(),
        "http_status": as_int(row.get("http_status")),
        "http_error": None if http_error in (None, "") else str(http_error).strip(),
        "final_url": None if final_url in (None, "") else str(final_url).strip(),
        "response_time_ms": as_float(row.get("response_time_ms")),
        "check_result": str(row.get("check_result", "")).strip(),
    }


def read_workbook(workbook_path: Path) -> list[dict[str, Any]]:
    workbook = openpyxl.load_workbook(workbook_path, read_only=True, data_only=True)
    worksheet = workbook.active
    rows = list(worksheet.iter_rows(values_only=True))
    if not rows:
        return []

    headers = [str(cell).strip() if cell is not None else "" for cell in rows[0]]
    seed_rows: list[dict[str, Any]] = []
    for row in rows[1:]:
        raw = {headers[i]: row[i] for i in range(min(len(headers), len(row))) if headers[i]}
        normalized = normalize_seed_row(raw)
        if normalized["seed_url"]:
            seed_rows.append(normalized)
    return seed_rows


def select_rows(
    rows: list[dict[str, Any]],
    limit: int | None,
    offset: int,
    status: str,
    require_check_ok: bool,
) -> list[dict[str, Any]]:
    selected = [
        row
        for row in rows
        if row["status"].lower() == status.lower()
        and (not require_check_ok or row["check_result"].upper() == "OK")
    ]
    if offset > 0:
        selected = selected[offset:]
    if limit is not None:
        return selected[:limit]
    return selected


def manifest_payload(workbook_path: Path, rows: list[dict[str, Any]], filters: dict[str, Any]) -> dict[str, Any]:
    tags: dict[str, int] = {}
    for row in rows:
        tag = row["tag"] or "Unknown"
        tags[tag] = tags.get(tag, 0) + 1

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_workbook": str(workbook_path),
        "row_count": len(rows),
        "filters": filters,
        "tags": tags,
        "rows": rows,
    }


def save_manifest(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def save_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def load_json(path: Path, fallback: dict[str, Any]) -> dict[str, Any]:
    if not path.exists():
        return fallback
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return fallback


def load_admin_auth() -> tuple[str, str]:
    user = os.environ.get("ADMIN_USER", "").strip()
    password = os.environ.get("ADMIN_PASS", "").strip()
    if not user or not password:
        raise RuntimeError("ADMIN_USER and ADMIN_PASS must be present in the environment or .env.local")
    return user, password


def auth_header(user: str, password: str) -> str:
    token = base64.b64encode(f"{user}:{password}".encode("utf-8")).decode("ascii")
    return f"Basic {token}"


def post_json(url: str, payload: dict[str, Any], authorization: str) -> tuple[int, dict[str, Any]]:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": authorization,
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
      with urllib.request.urlopen(request, timeout=120) as response:
            body = response.read().decode("utf-8")
            return response.status, json.loads(body or "{}")
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8")
        try:
            parsed = json.loads(body) if body else {}
        except json.JSONDecodeError:
            parsed = {"raw": body}
        return exc.code, parsed


def batch_items(items: list[dict[str, Any]], size: int) -> Iterable[list[dict[str, Any]]]:
    for index in range(0, len(items), size):
        yield items[index : index + size]


def canonical_origin(url: str) -> str:
    parsed = urlparse(url)
    return urlunparse((parsed.scheme, parsed.netloc, "", "", "", ""))


def is_github_repo_url(url: str) -> bool:
    parsed = urlparse(url)
    host = parsed.netloc.lower()
    if host not in {"github.com", "www.github.com"}:
        return False
    parts = [part for part in parsed.path.split("/") if part]
    return len(parts) >= 2


def github_repo_root(url: str) -> str | None:
    if not is_github_repo_url(url):
        return None
    parsed = urlparse(url)
    parts = [part for part in parsed.path.split("/") if part]
    owner, repo = parts[0], parts[1]
    return urlunparse((parsed.scheme or "https", "github.com", f"/{owner}/{repo}", "", "", ""))


def github_repo_family_urls(url: str) -> list[str]:
    root = github_repo_root(url)
    if not root:
        return []

    candidates = [
        root,
        f"{root}/wiki",
        f"{root}/releases",
        f"{root}/blob/main/README.md",
        f"{root}/blob/master/README.md",
        f"{root}/tree/main/docs",
        f"{root}/tree/master/docs",
        f"{root}/blob/main/docs/README.md",
        f"{root}/blob/master/docs/README.md",
    ]
    seen: set[str] = set()
    ordered: list[str] = []
    for candidate in candidates:
        if candidate not in seen:
            seen.add(candidate)
            ordered.append(candidate)
    return ordered


def augment_repo_alternates(source: dict[str, Any]) -> None:
    existing = source.setdefault("alternate_urls", [])
    if not isinstance(existing, list):
        existing = []
        source["alternate_urls"] = existing

    candidates = [source.get("url", "")] + [str(url) for url in existing]
    additions: list[str] = []
    for candidate in candidates:
        for repo_url in github_repo_family_urls(candidate):
            if repo_url not in existing and repo_url not in additions:
                additions.append(repo_url)
    existing.extend(additions)


def build_retry_candidates(row: dict[str, Any]) -> list[str]:
    seed_url = str(row.get("seed_url") or "").strip()
    if not seed_url:
        return []

    candidates = [seed_url]
    origin = canonical_origin(seed_url)
    if origin and origin not in candidates:
        candidates.append(origin)
    return candidates


def run_manifest_mode(workbook_path: Path, limit: int | None, offset: int, status: str, require_check_ok: bool) -> None:
    rows = read_workbook(workbook_path)
    selected = select_rows(rows, limit, offset=offset, status=status, require_check_ok=require_check_ok)
    payload = manifest_payload(
        workbook_path,
        selected,
        {
            "status": status,
            "require_check_ok": require_check_ok,
            "limit": limit,
            "offset": offset,
        },
    )
    save_manifest(MANIFEST_DEFAULT, payload)

    print(f"Workbook: {workbook_path}")
    print(f"Selected rows: {len(selected)}")
    print(f"Manifest written: {MANIFEST_DEFAULT.relative_to(ROOT)}")


def run_ingest_mode(workbook_path: Path, limit: int | None, offset: int, status: str, require_check_ok: bool, batch_size: int, endpoint: str) -> None:
    bootstrap_env()
    user, password = load_admin_auth()
    rows = read_workbook(workbook_path)
    selected = select_rows(rows, limit, offset=offset, status=status, require_check_ok=require_check_ok)
    save_manifest(
        MANIFEST_DEFAULT,
        manifest_payload(
            workbook_path,
            selected,
            {
                "status": status,
                "require_check_ok": require_check_ok,
                "limit": limit,
                "offset": offset,
                "batch_size": batch_size,
                "mode": "ingest",
            },
        ),
    )

    urls = [row["seed_url"] for row in selected]
    if not urls:
        print("No rows selected for ingest.")
        return

    auth = auth_header(user, password)
    total_success = 0
    total_failed = 0
    failed_rows: list[dict[str, Any]] = []
    run_results: list[dict[str, Any]] = []

    for batch in batch_items(selected, batch_size):
        batch_urls = [row["seed_url"] for row in batch]
        status_code, response = post_json(endpoint, {"urls": batch_urls, "dataset": ""}, auth)
        print(f"Batch {batch_urls[0]} -> {batch_urls[-1]} | HTTP {status_code}")
        results = response.get("results", [])
        for index, result in enumerate(results):
            source_row = batch[index] if index < len(batch) else {}
            enriched = {**result, "seed_url": source_row.get("seed_url"), "tag": source_row.get("tag"), "job_tag": source_row.get("job_tag")}
            run_results.append(enriched)
            if result.get("status") == "success":
                total_success += 1
            else:
                total_failed += 1
                failed_rows.append(enriched)
        if response.get("results"):
            print(json.dumps(response.get("results"), ensure_ascii=False, indent=2)[:3000])

    existing_failed = load_json(
        FAILED_DEFAULT,
        {
            "generated_at": None,
            "source_workbook": str(workbook_path),
            "failed_count": 0,
            "failed_rows": [],
        },
    )
    failed_by_url: dict[str, dict[str, Any]] = {}
    for row in existing_failed.get("failed_rows", []):
        seed_url = row.get("seed_url")
        if seed_url:
            failed_by_url[seed_url] = row
    for row in failed_rows:
        seed_url = row.get("seed_url")
        if seed_url:
            failed_by_url[seed_url] = row
    merged_failed_rows = list(failed_by_url.values())
    save_json(
        FAILED_DEFAULT,
        {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "source_workbook": str(workbook_path),
            "offset": offset,
            "limit": limit,
            "batch_size": batch_size,
            "failed_count": len(merged_failed_rows),
            "failed_rows": merged_failed_rows,
        },
    )
    save_json(
        LAST_RUN_DEFAULT,
        {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "source_workbook": str(workbook_path),
            "offset": offset,
            "limit": limit,
            "batch_size": batch_size,
            "success_count": total_success,
            "failed_count": total_failed,
            "results": run_results,
        },
    )

    print(f"Pilot batch: {len(urls)} URLs")
    print(f"Success count: {total_success}")
    print(f"Failure count: {total_failed}")
    print(f"Manifest written: {MANIFEST_DEFAULT.relative_to(ROOT)}")
    print(f"Failures written: {FAILED_DEFAULT.relative_to(ROOT)}")
    print(f"Run summary written: {LAST_RUN_DEFAULT.relative_to(ROOT)}")


def run_queue_mode(workbook_path: Path, limit: int | None, offset: int, status: str, require_check_ok: bool, batch_size: int, endpoint: str) -> None:
    bootstrap_env()
    user, password = load_admin_auth()
    rows = read_workbook(workbook_path)
    selected = select_rows(rows, limit, offset=offset, status=status, require_check_ok=require_check_ok)
    urls = [row["seed_url"] for row in selected]
    if not urls:
        print("No rows selected for queueing.")
        return

    auth = auth_header(user, password)
    total_enqueued = 0
    for batch in batch_items(selected, batch_size):
        batch_urls = [row["seed_url"] for row in batch]
        status_code, response = post_json(endpoint, {"action": "enqueue", "urls": batch_urls, "dataset": ""}, auth)
        enqueued = int(response.get("enqueued", 0) or 0)
        total_enqueued += enqueued
        print(f"Queued {len(batch_urls)} URLs | HTTP {status_code} | enqueued {enqueued}")

    print(f"Total queued: {total_enqueued}")
    save_json(
        LAST_RUN_DEFAULT,
        {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "source_workbook": str(workbook_path),
            "offset": offset,
            "limit": limit,
            "batch_size": batch_size,
            "queued_count": total_enqueued,
            "mode": "queue",
        },
    )


def run_retry_failed_mode(batch_size: int, endpoint: str) -> None:
    bootstrap_env()
    user, password = load_admin_auth()
    auth = auth_header(user, password)

    failed_data = load_json(
        FAILED_DEFAULT,
        {
            "failed_rows": [],
        },
    )
    failed_rows = failed_data.get("failed_rows", [])
    if not failed_rows:
        print("No failed rows to retry.")
        return

    candidates: list[dict[str, Any]] = []
    for row in failed_rows:
        for candidate_url in build_retry_candidates(row):
            candidates.append({**row, "retry_url": candidate_url})

    if not candidates:
        print("No retry candidates found.")
        return

    retry_success = 0
    retry_failed: list[dict[str, Any]] = []
    retry_results: list[dict[str, Any]] = []

    for batch in batch_items(candidates, batch_size):
        batch_urls = [item["retry_url"] for item in batch]
        status_code, response = post_json(endpoint, {"urls": batch_urls, "dataset": ""}, auth)
        print(f"Retry batch {batch_urls[0]} -> {batch_urls[-1]} | HTTP {status_code}")
        results = response.get("results", [])
        for index, result in enumerate(results):
            source_row = batch[index] if index < len(batch) else {}
            enriched = {
                **result,
                "seed_url": source_row.get("seed_url"),
                "retry_url": source_row.get("retry_url"),
                "tag": source_row.get("tag"),
                "job_tag": source_row.get("job_tag"),
                "original_status": source_row.get("status"),
            }
            retry_results.append(enriched)
            if result.get("status") == "success":
                retry_success += 1
            else:
                retry_failed.append(enriched)

        if results:
            print(json.dumps(results, ensure_ascii=False, indent=2)[:3000])

    remaining_by_url: dict[str, dict[str, Any]] = {}
    for row in retry_failed:
        seed_url = row.get("seed_url")
        if seed_url:
            remaining_by_url[seed_url] = row

    save_json(
        FAILED_DEFAULT,
        {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "source": "retry_failed",
            "failed_count": len(remaining_by_url),
            "failed_rows": list(remaining_by_url.values()),
        },
    )
    save_json(
        LAST_RUN_DEFAULT,
        {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "source": "retry_failed",
            "success_count": retry_success,
            "failed_count": len(retry_failed),
            "results": retry_results,
        },
    )

    print(f"Retry candidates: {len(candidates)}")
    print(f"Retry success count: {retry_success}")
    print(f"Retry failure count: {len(retry_failed)}")
    print(f"Failures written: {FAILED_DEFAULT.relative_to(ROOT)}")
    print(f"Run summary written: {LAST_RUN_DEFAULT.relative_to(ROOT)}")


def run_backlog_mode() -> None:
    backlog = load_json(
        BACKLOG_DEFAULT,
        {
            "generated_at": None,
            "purpose": "Pending FPV source candidates",
            "sources": [],
        },
    )
    sources = backlog.get("sources", [])
    by_status: dict[str, int] = {}
    for item in sources:
        status = str(item.get("status", "unknown")).lower()
        by_status[status] = by_status.get(status, 0) + 1

    print(f"Backlog file: {BACKLOG_DEFAULT.relative_to(ROOT)}")
    print(f"Pending sources: {len(sources)}")
    print(json.dumps(by_status, ensure_ascii=False, indent=2))
    for item in sources:
        print(f"- {item.get('name')} | {item.get('status')} | {item.get('desired_dataset')} | {item.get('url')}")


def run_backlog_pack_mode(limit: int) -> None:
    backlog = load_json(
        BACKLOG_DEFAULT,
        {
            "generated_at": None,
            "purpose": "Pending FPV source candidates",
            "sources": [],
        },
    )
    sources = backlog.get("sources", [])
    priority_order = {"high": 0, "medium": 1, "low": 2}
    missing = [
        item for item in sources
        if str(item.get("status", "")).lower() == "missing"
    ]
    missing.sort(key=lambda item: (
        priority_order.get(str(item.get("priority", "")).lower(), 9),
        str(item.get("desired_dataset", "")),
        str(item.get("name", "")),
    ))
    selected = missing[:limit]
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_backlog": str(BACKLOG_DEFAULT.relative_to(ROOT)),
        "limit": limit,
        "selected_count": len(selected),
        "selected": selected,
    }
    save_json(BACKLOG_PACK_DEFAULT, payload)
    print(f"Backlog pack written: {BACKLOG_PACK_DEFAULT.relative_to(ROOT)}")
    print(f"Selected sources: {len(selected)}")
    for item in selected:
        print(f"- {item.get('name')} | {item.get('desired_dataset')} | {item.get('url')}")


def run_deferred_pack_mode(limit: int) -> None:
    backlog = load_json(
        BACKLOG_DEFAULT,
        {
            "generated_at": None,
            "purpose": "Pending FPV source candidates",
            "sources": [],
        },
    )
    sources = backlog.get("sources", [])
    priority_order = {"high": 0, "medium": 1, "low": 2}
    deferred = [
        item for item in sources
        if str(item.get("status", "")).lower() == "deferred"
        and item.get("alternate_urls")
    ]
    deferred.sort(key=lambda item: (
        priority_order.get(str(item.get("priority", "")).lower(), 9),
        str(item.get("desired_dataset", "")),
        str(item.get("name", "")),
    ))
    selected = deferred[:limit]
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_backlog": str(BACKLOG_DEFAULT.relative_to(ROOT)),
        "limit": limit,
        "selected_count": len(selected),
        "selected": selected,
    }
    save_json(DEFERRED_PACK_DEFAULT, payload)
    print(f"Deferred pack written: {DEFERRED_PACK_DEFAULT.relative_to(ROOT)}")
    print(f"Selected sources: {len(selected)}")
    for item in selected:
        alts = item.get("alternate_urls", [])
        alt_count = len(alts) if isinstance(alts, list) else 0
        print(f"- {item.get('name')} | {item.get('desired_dataset')} | {item.get('url')} | alts={alt_count}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import FPV RAG seed URLs from the workbook.")
    parser.add_argument("--xlsx", default=str(WORKBOOK_DEFAULT), help="Path to the Excel workbook.")
    parser.add_argument("--mode", choices=("manifest", "ingest", "queue", "retry-failed", "backlog", "backlog-pack", "deferred-pack"), default="manifest", help="What to do with the selected rows.")
    parser.add_argument("--pack-limit", type=int, default=3, help="How many missing backlog sources to include in backlog-pack mode.")
    parser.add_argument("--limit", type=int, default=None, help="Max number of rows to process.")
    parser.add_argument("--offset", type=int, default=0, help="Skip the first N matching rows.")
    parser.add_argument("--status", default="Active", help="Only include rows with this Status value.")
    parser.add_argument("--allow-unchecked", action="store_true", help="Include rows even when check_result is not OK.")
    parser.add_argument("--batch-size", type=int, default=5, help="Batch size for ingest or queue mode.")
    parser.add_argument("--endpoint", default="http://127.0.0.1:3000/api/admin/ingest", help="Admin ingest endpoint.")
    parser.add_argument("--queue-endpoint", default="http://127.0.0.1:3000/api/admin/crawl-queue", help="Admin queue endpoint.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if args.mode == "backlog":
        run_backlog_mode()
        return
    if args.mode == "backlog-pack":
        run_backlog_pack_mode(args.pack_limit)
        return
    if args.mode == "deferred-pack":
        run_deferred_pack_mode(args.pack_limit)
        return

    workbook_path = Path(args.xlsx).expanduser().resolve()
    if not workbook_path.exists():
        raise SystemExit(f"Workbook not found: {workbook_path}")

    if args.mode == "manifest":
        run_manifest_mode(workbook_path, args.limit, args.offset, args.status, not args.allow_unchecked)
    elif args.mode == "ingest":
        run_ingest_mode(workbook_path, args.limit, args.offset, args.status, not args.allow_unchecked, args.batch_size, args.endpoint)
    elif args.mode == "retry-failed":
        run_retry_failed_mode(args.batch_size, args.endpoint)
    else:
        run_queue_mode(workbook_path, args.limit, args.offset, args.status, not args.allow_unchecked, args.batch_size, args.queue_endpoint)


if __name__ == "__main__":
    main()
