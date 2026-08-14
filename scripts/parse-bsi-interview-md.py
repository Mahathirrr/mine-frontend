#!/usr/bin/env python3
"""Parse BSI interview markdown files into structured seed JSON."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "backend" / "internal" / "seeds" / "packs" / "bsi-junior-it-aceh.json"

FILES = {
    "company-knowledge": Path("/home/neonnex/Downloads/materi-penting-wawancara-bsi-junior-it.md"),
    "hrd": Path("/home/neonnex/Downloads/jawaban-hrd-wawancara-magang-bsi.md"),
    "technical": Path("/home/neonnex/Downloads/jawaban-teknis-software-engineer-wawancara.md"),
}

GUIDE_META = {
    "company-knowledge": {
        "title": "Pengetahuan Perusahaan",
        "subtitle": "12 soal inti + istilah penting BSI",
        "guide_type": "company",
    },
    "hrd": {
        "title": "HRD & Non-Teknis",
        "subtitle": "Perkenalan, motivasi, sikap kerja, ekspektasi",
        "guide_type": "hrd",
    },
    "technical": {
        "title": "Teknis Software Engineer",
        "subtitle": "Frontend, backend, database, deployment, mobile, AI",
        "guide_type": "technical",
    },
}

CATEGORY_MAP = {
    "company-knowledge": "company",
    "hrd": "behavioral",
    "technical": "technical",
}


def clean(text: str) -> str:
    text = re.sub(r"^>\s?", "", text, flags=re.MULTILINE)
    text = text.replace("\r\n", "\n").strip()
    return text


def split_sections(body: str) -> list[tuple[str, str]]:
    parts = re.split(r"\n(?=## )", body)
    out: list[tuple[str, str]] = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        if part.startswith("## "):
            first, _, rest = part.partition("\n")
            title = first[3:].strip()
            out.append((title, rest.strip()))
        else:
            out.append(("Pendahuluan", part))
    return out


def parse_glossary(content: str) -> list[dict[str, str]]:
    entries: list[dict[str, str]] = []
    chunks = re.split(r"\n\*\*(.+?)\*\*\s*\n", content)
    if chunks and not chunks[0].strip():
        chunks = chunks[1:]
    i = 0
    while i < len(chunks) - 1:
        term = chunks[i].strip()
        definition = clean(chunks[i + 1])
        if term and definition:
            entries.append({"term": term, "definition": definition})
        i += 2
    return entries


def parse_numbered_qa(content: str) -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    pattern = re.compile(r"\*\*(\d+)\.\s*(.+?)\*\*\s*\n", re.DOTALL)
    matches = list(pattern.finditer(content))
    for idx, match in enumerate(matches):
        num = int(match.group(1))
        question = match.group(2).strip()
        start = match.end()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(content)
        answer = clean(content[start:end])
        if question and answer:
            items.append({"number": num, "question": question, "answer": answer})
    return items


def parse_script_blocks(content: str) -> list[dict[str, str]]:
    blocks: list[dict[str, str]] = []
    for match in re.finditer(r"### (.+?)\n\n([\s\S]*?)(?=\n### |\n## |\Z)", content):
        title = match.group(1).strip()
        body = clean(match.group(2))
        if body:
            blocks.append({"title": title, "body": body})
    return blocks


def parse_h2_numbered_qa(content: str) -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    pattern = re.compile(r"^## (\d+)\.\s*(.+?)\s*$", re.MULTILINE)
    matches = list(pattern.finditer(content))
    for idx, match in enumerate(matches):
        num = int(match.group(1))
        question = match.group(2).strip()
        start = match.end()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(content)
        answer = clean(content[start:end])
        answer = re.sub(r"^---+\s*$", "", answer, flags=re.MULTILINE).strip()
        if question and answer:
            items.append({"number": num, "question": question, "answer": answer})
    return items


def parse_file(slug: str, path: Path) -> dict:
    raw = path.read_text(encoding="utf-8")
    body = re.sub(r"^# .+\n", "", raw, count=1)
    body = re.sub(r"^> .+\n", "", body, flags=re.MULTILINE)

    sections: list[dict] = []
    questions: list[dict] = []
    sort = 0

    for section_title, section_body in split_sections(body):
        lower = section_title.lower()
        if slug == "company-knowledge" and "istilah" in lower:
            entries = parse_glossary(section_body)
            sections.append(
                {
                    "id": "glossary",
                    "title": section_title,
                    "kind": "glossary",
                    "entries": entries,
                }
            )
            continue

        if slug == "hrd" and "pembuka" in lower:
            scripts = parse_script_blocks(section_body)
            sections.append(
                {
                    "id": "scripts",
                    "title": section_title,
                    "kind": "scripts",
                    "scripts": scripts,
                }
            )
            continue

        qa_items: list[dict[str, str]] = []
        if slug == "company-knowledge" and re.match(r"^\d+\.", section_title):
            num = int(section_title.split(".", 1)[0])
            question = section_title.split(".", 1)[1].strip()
            answer = clean(re.sub(r"^---+\s*$", "", section_body, flags=re.MULTILINE))
            if question and answer:
                qa_items = [{"number": num, "question": question, "answer": answer}]
                section_title = "12 Soal Inti"
        else:
            qa_items = parse_numbered_qa(section_body)

        if qa_items:
            section_id = re.sub(r"[^a-z0-9]+", "-", section_title.lower()).strip("-")
            existing = next((s for s in sections if s["id"] == section_id and s["kind"] == "qa"), None)
            if existing:
                existing["items"].extend(qa_items)
            else:
                sections.append(
                    {
                        "id": section_id or f"section-{len(sections)}",
                        "title": section_title,
                        "kind": "qa",
                        "items": qa_items,
                    }
                )
            for item in qa_items:
                sort += 1
                questions.append(
                    {
                        "guide": slug,
                        "number": item["number"],
                        "section_label": section_title,
                        "sort_order": sort,
                        "category": CATEGORY_MAP[slug],
                        "question": item["question"],
                        "answer_notes": item["answer"],
                    }
                )

    meta = GUIDE_META[slug]
    return {
        "slug": slug,
        "title": meta["title"],
        "subtitle": meta["subtitle"],
        "guide_type": meta["guide_type"],
        "sections": sections,
        "question_count": len(questions),
        "_questions": questions,
    }


def main() -> None:
    guides = []
    all_questions: list[dict] = []
    for slug, path in FILES.items():
        parsed = parse_file(slug, path)
        all_questions.extend(parsed.pop("_questions"))
        guides.append(parsed)

    payload = {
        "slug": "bsi-junior-it-aceh",
        "company": "PT Bank Syariah Indonesia (Persero) Tbk",
        "role_title": "Junior IT Intern — Regional Office I Aceh",
        "location": "Landmark BSI Aceh, Banda Aceh",
        "work_type": "onsite",
        "status": "interviewing",
        "priority": 1,
        "notes": "Magang Junior IT di Regional Office 1 Aceh. Materi persiapan wawancara diimpor dari catatan pribadi.",
        "guides": guides,
        "questions": all_questions,
        "stats": {
            "guides": len(guides),
            "questions": len(all_questions),
            "glossary_terms": sum(
                len(s.get("entries", []))
                for g in guides
                for s in g["sections"]
                if s["kind"] == "glossary"
            ),
        },
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT}")
    print(json.dumps(payload["stats"], indent=2))


if __name__ == "__main__":
    main()
