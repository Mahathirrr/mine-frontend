#!/usr/bin/env python3
"""Generate problem -> PDF page mapping from ModuleLeetCodeRoadmap build output."""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUILD = Path("/home/neonnex/dev/leetcode/ModuleLeetCodeRoadmap/build")
MATERI = Path("/home/neonnex/dev/leetcode/ModuleLeetCodeRoadmap/materi")
OUT = ROOT / "src/routes/(main)/dashboard/leetcode/-components/problem-material-pages.json"
MIGRATIONS = ROOT / "backend/migrations"

CATEGORY_MODULES: dict[str, list[int]] = {
    "Arrays & Hashing": [2, 3, 4],
    "Two Pointers": [5],
    "Sliding Window": [6, 7],
    "Stack": [8],
    "Binary Search": [9],
    "Linked List": [10, 11, 12],
    "Trees": [13, 14, 15, 16, 17],
    "Tries": [18],
    "Backtracking": [19],
    "Heap / Priority Queue": [20],
    "Greedy": [28],
    "Intervals": [27],
    "Math & Geometry": [29],
    "Bit Manipulation": [29],
    "1-D Dynamic Programming": [24, 26],
    "2-D Dynamic Programming": [25],
    "Graphs": [21, 22, 23],
    "Advanced Graphs": [21, 22, 23],
}


def pdf_pages(pdf: Path) -> int:
    out = subprocess.check_output(["pdfinfo", str(pdf)], text=True)
    return int(re.search(r"Pages:\s+(\d+)", out).group(1))


def page_text(pdf: Path, page: int) -> str:
    return subprocess.check_output(
        ["pdftotext", "-f", str(page), "-l", str(page), str(pdf), "-"],
        text=True,
        stderr=subprocess.DEVNULL,
    )


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", s.lower())


def clean_tex(s: str) -> str:
    return s.replace("\\&", "&").strip()


def load_problems() -> list[dict]:
    rows: dict[int, dict] = {}
    for mig in ["000002_leetcode.up.sql", "000003_neetcode150.up.sql"]:
        path = MIGRATIONS / mig
        if not path.exists():
            continue
        for m in re.finditer(r"\((\d+),\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'", path.read_text()):
            lc_id = int(m.group(1))
            rows[lc_id] = {
                "leetcode_id": lc_id,
                "slug": m.group(2),
                "title": m.group(3),
                "category": m.group(4),
            }
    return list(rows.values())


def extract_sections(tex: str) -> list[str]:
    titles: list[str] = []
    for m in re.finditer(r"\\section\*\{(?i:masalah[^:]*:\s*)([^}]+)\}", tex):
        titles.append(m.group(1).strip())
    for m in re.finditer(r"\\section\*\{(?i:masalah:\s*)([^}]+)\}", tex):
        titles.append(m.group(1).strip())
    return titles


def match_title_to_problem(title: str, by_norm: dict[str, dict]) -> dict | None:
    key = norm(title.split("(")[0])
    if key in by_norm:
        return by_norm[key]
    for k, p in by_norm.items():
        if len(key) >= 8 and (key in k or k in key):
            return p
    return None


def find_title_page(pdf: Path, title: str) -> int | None:
    needle = norm(title.split("(")[0])
    if len(needle) < 6:
        return None
    pages = pdf_pages(pdf)
    for p in range(1, pages + 1):
        if needle[: min(len(needle), 16)] in norm(page_text(pdf, p)):
            return p
    return None


def module_meta(mod: int, tex: str) -> tuple[str, str]:
    mod_m = re.search(r"\\Large Modul \d+: ([^\}]+)", tex)
    mod_title = clean_tex(mod_m.group(1)) if mod_m else f"Modul {mod}"
    short = mod_title.split(" - ")[0]
    if mod == 1:
        return "Materi Dasar", "Python Fundamentals & Big-O Notation"
    return short, mod_title


def main() -> None:
    problems_list = load_problems()
    by_norm = {norm(p["title"]): p for p in problems_list}

    full = BUILD / "full.pdf"
    if not full.exists():
        raise SystemExit(f"Missing {full}")

    start = 2
    for p in range(1, pdf_pages(full) + 1):
        t = page_text(full, p)
        if "Python Fundamentals" in t and "Big-O" in t:
            start = p
            break

    mod_pages = {
        mod: pdf_pages(BUILD / f"pertemuan{mod}.pdf")
        for mod in range(1, 30)
        if (BUILD / f"pertemuan{mod}.pdf").exists()
    }

    mod_start: dict[int, int] = {}
    cur = start
    for mod in sorted(mod_pages):
        mod_start[mod] = cur
        cur += mod_pages[mod]

    mod_short: dict[int, str] = {}
    archive = [
        {
            "slug": "full",
            "title": "Modul Lengkap",
            "subtitle": "Referensi lengkap roadmap LeetCode",
            "file": "full.pdf",
            "pages": pdf_pages(full),
        }
    ]

    for mod in sorted(mod_pages):
        tex_path = MATERI / f"pertemuan{mod}.tex"
        if not tex_path.exists():
            continue
        tex = tex_path.read_text()
        short, subtitle = module_meta(mod, tex)
        mod_short[mod] = short
        archive.append(
            {
                "slug": f"modul-{mod}",
                "title": short,
                "subtitle": subtitle,
                "file": f"pertemuan{mod}.pdf",
                "pages": mod_pages[mod],
            }
        )

    mapped: dict[str, dict] = {}

    def store(prob: dict, mod: int, page_mod: int) -> None:
        lid = str(prob["leetcode_id"])
        if lid in mapped:
            return
        mapped[lid] = {
            "pageFull": mod_start[mod] + page_mod - 1,
            "pageModule": page_mod,
            "moduleTitle": mod_short.get(mod, f"Modul {mod}"),
            "archiveSlug": f"modul-{mod}",
        }

    # Pass 1: explicit Masalah sections in tex
    for mod in sorted(mod_pages):
        tex_path = MATERI / f"pertemuan{mod}.tex"
        pdf_path = BUILD / f"pertemuan{mod}.pdf"
        if not tex_path.exists():
            continue
        for sec_title in extract_sections(tex_path.read_text()):
            prob = match_title_to_problem(sec_title, by_norm)
            if not prob:
                continue
            page_mod = find_title_page(pdf_path, sec_title) or find_title_page(pdf_path, prob["title"])
            if page_mod:
                store(prob, mod, page_mod)

    # Pass 2: search problem title inside category modules
    for prob in problems_list:
        lid = str(prob["leetcode_id"])
        if lid in mapped:
            continue
        mods = CATEGORY_MODULES.get(prob["category"], [])
        for mod in mods:
            pdf_path = BUILD / f"pertemuan{mod}.pdf"
            if not pdf_path.exists():
                continue
            page_mod = find_title_page(pdf_path, prob["title"])
            if page_mod:
                store(prob, mod, page_mod)
                break

    OUT.write_text(json.dumps({"archive": archive, "problems": mapped}, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {OUT.name}: archive={len(archive)}, problems={len(mapped)}")


if __name__ == "__main__":
    main()
