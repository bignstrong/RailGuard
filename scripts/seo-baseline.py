#!/usr/bin/env python3
"""Недельный замер SEO railguard.ru: ИКС, страницы в поиске, проблемы, запросы.

Запуск:
    PYTHONPATH=~/.claude/plugins/marketplaces/nozikov/src python3 scripts/seo-baseline.py

Каждый запуск дописывает снимок в docs/seo/baseline/snapshots.jsonl и печатает
дельту к предыдущему. Это внешний судья: цифры берёт Яндекс, не мы.
"""

import datetime
import glob
import json
import pathlib
import subprocess
import sys
import urllib.parse

from yandex_mcp.auth.tokens import service_token
from yandex_mcp.httpclient import http_get

WEBMASTER = "https://api.webmaster.yandex.net/v4"
HOST = "railguard.ru"
OUT = pathlib.Path(__file__).resolve().parent.parent / "docs" / "seo" / "baseline" / "snapshots.jsonl"


def gsc_totals(days=90):
    """Google Search Console через claude-seo. None, если плагина или токена нет."""
    launchers = glob.glob(str(pathlib.Path.home() / ".claude/plugins/cache/*/claude-seo/*/scripts/claude-seo"))
    if not launchers:
        return None
    try:
        out = subprocess.run(
            [sorted(launchers)[-1], "run", "gsc_query.py", "--property", f"sc-domain:{HOST}",
             "--days", str(days), "--dimensions", "query", "--json"],
            capture_output=True, text=True, timeout=120,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    if out.returncode != 0:
        return None
    data = json.loads(out.stdout)
    return {
        "days": days,
        "totals": data.get("totals"),
        "queries_top": [
            {"q": r.get("query"), "clicks": r.get("clicks"), "impressions": r.get("impressions"), "position": r.get("position")}
            for r in data.get("rows", [])[:10]
        ],
    }


def snapshot(token):
    user_id = http_get(f"{WEBMASTER}/user", token)["user_id"]
    hosts = http_get(f"{WEBMASTER}/user/{user_id}/hosts", token).get("hosts", [])
    host = next(
        (h for h in hosts
         if urllib.parse.urlsplit(h.get("ascii_host_url") or "").netloc.lower() == HOST),
        None,
    )
    if not host:
        raise SystemExit(f"в Вебмастере нет {HOST}")
    hid = host["host_id"]
    summary = http_get(f"{WEBMASTER}/user/{user_id}/hosts/{hid}/summary", token)
    diagnostics = http_get(f"{WEBMASTER}/user/{user_id}/hosts/{hid}/diagnostics", token)
    problems = sorted(
        name for name, info in diagnostics.get("problems", {}).items()
        if isinstance(info, dict) and info.get("state") != "ABSENT"
    )
    queries = http_get(
        f"{WEBMASTER}/user/{user_id}/hosts/{hid}/search-queries/popular",
        token,
        {"order_by": "TOTAL_SHOWS", "limit": 100,
         "query_indicator": ["TOTAL_SHOWS", "TOTAL_CLICKS", "AVG_SHOW_POSITION"]},
    ).get("queries", [])
    history = http_get(
        f"{WEBMASTER}/user/{user_id}/hosts/{hid}/search-urls/in-search/history",
        token,
    ).get("history", [])

    return {
        "ts": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "host": host.get("ascii_host_url"),
        "sqi": summary.get("sqi"),
        "searchable_pages_count": summary.get("searchable_pages_count"),
        "excluded_pages_count": summary.get("excluded_pages_count"),
        "problems": problems,
        # Сколько запросов вернул API (до 100): ноль здесь — ноль показов в поиске.
        "queries_seen": len(queries),
        "queries_top": [
            {"q": q.get("query_text"), **q.get("indicators", {})} for q in queries[:20]
        ],
        "indexed_last": history[-1] if history else None,
        "gsc": gsc_totals(),
    }


def main():
    snap = snapshot(service_token("webmaster"))
    OUT.parent.mkdir(parents=True, exist_ok=True)

    previous = None
    if OUT.exists():
        rows = [json.loads(line) for line in OUT.read_text().splitlines() if line.strip()]
        previous = rows[-1] if rows else None

    with OUT.open("a") as f:
        f.write(json.dumps(snap, ensure_ascii=False) + "\n")

    print(f"{snap['host']}: ИКС {snap['sqi']}, в поиске {snap['searchable_pages_count']}, "
          f"исключено {snap['excluded_pages_count']}, запросов {snap['queries_seen']}")
    if snap["problems"]:
        print("проблемы: " + ", ".join(snap["problems"]))
    gsc = snap.get("gsc")
    if gsc and gsc.get("totals"):
        t = gsc["totals"]
        print(f"Google {gsc['days']}д: клики {t.get('clicks')}, показы {t.get('impressions')}, "
              f"позиция {t.get('position')}, запросов {len(gsc['queries_top'])}")
    if previous:
        fields = ("sqi", "searchable_pages_count", "queries_seen")
        delta = ", ".join(
            f"{k} {previous.get(k)} -> {snap[k]}" for k in fields if previous.get(k) != snap[k]
        )
        print("дельта к прошлому снимку: " + (delta or "без изменений"))
    print(f"снимок дописан: {OUT}")


if __name__ == "__main__":
    sys.exit(main())
