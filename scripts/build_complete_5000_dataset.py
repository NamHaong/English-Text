import re
import json
import os
import pypdf

OXFORD_3000_PDF = r"D:\APP IOS\APP\The_Oxford_3000.pdf"
OXFORD_5000_PDF = r"D:\APP IOS\The_Oxford_5000_by_CEFR_level.pdf"
EXISTING_VOCAB_JSON = r"D:\APP IOS\English Text\src\data\vocabulary.json"
EV_DICT_FILE = "ev_dict.txt"
OUTPUT_JSON = r"D:\APP IOS\English Text\src\data\vocabulary.json"

def load_ev_dict():
    print("Loading EV dictionary...")
    dict_map = {}
    current_word = None
    current_ipa = ""
    current_meanings = []
    current_examples = []

    with open(EV_DICT_FILE, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line_str = line.strip()
            if line_str.startswith("@"):
                # Save previous word
                if current_word:
                    clean_meaning = "; ".join(current_meanings[:2]) if current_meanings else ""
                    dict_map[current_word.lower()] = {
                        "ipa": current_ipa,
                        "meaning": clean_meaning,
                        "example": current_examples[0] if current_examples else "",
                    }
                
                # New word line: @word /ipa/
                current_meanings = []
                current_examples = []
                current_ipa = ""
                
                parts = line_str[1:].split("/", 2)
                current_word = parts[0].strip()
                if len(parts) >= 2:
                    current_ipa = f"/{parts[1].strip()}/"
            elif line_str.startswith("- "):
                m = line_str[2:].strip()
                # Clean meaning
                m = re.sub(r"\(.*?\)", "", m).strip()
                if m and len(m) > 1 and len(current_meanings) < 3:
                    current_meanings.append(m)
            elif line_str.startswith("="):
                # Example: =example+meaning
                ex_parts = line_str[1:].split("+", 1)
                if len(ex_parts) == 2 and not current_examples:
                    current_examples.append((ex_parts[0].strip(), ex_parts[1].strip()))

        if current_word:
            clean_meaning = "; ".join(current_meanings[:2]) if current_meanings else ""
            dict_map[current_word.lower()] = {
                "ipa": current_ipa,
                "meaning": clean_meaning,
                "example": current_examples[0] if current_examples else "",
            }

    print(f"Loaded {len(dict_map)} dictionary entries.")
    return dict_map

def parse_oxford_3000():
    print(f"Parsing Oxford 3000 from {OXFORD_3000_PDF}...")
    reader = pypdf.PdfReader(OXFORD_3000_PDF)
    full_text = ""
    for page in reader.pages:
        full_text += "\n" + page.extract_text()

    lines = [line.strip() for line in full_text.splitlines() if line.strip()]
    entries = []

    for line in lines:
        if "Oxford University Press" in line or "The Oxford 3000" in line or "most important words" in line:
            continue
        all_levels = re.findall(r"\b([A-C][1-2])\b", line)
        if not all_levels:
            continue
        first_level = all_levels[0]

        # Extract headword and part of speech
        # e.g., 'academic adj. B1, n. B2'
        # e.g., 'a, an indefinite article A1'
        m = re.match(r"^(.+?)\s+((?:(?:adj|adv|n|v|prep|conj|pron|det|modal v|number|exclam|indefinite article|definite article|link v|auxiliary v)\.?[\s,/]*)+.*)$", line)
        if m:
            headword = m.group(1).strip()
            rest = m.group(2).strip()
            pos = rest.split()[0] if rest.split() else "n."
        else:
            parts = line.rsplit(" ", 2)
            headword = parts[0].strip()
            pos = parts[1].strip() if len(parts) > 2 else "n."

        # Clean headword (e.g. 'a, an' -> 'a')
        clean_word = headword.replace("\xa0", " ").strip()
        entries.append({
            "word": clean_word,
            "pos": pos,
            "level": first_level,
            "all_levels": all_levels,
        })

    print(f"Parsed {len(entries)} entries from Oxford 3000.")
    return entries

def main():
    ev_dict = load_ev_dict()

    # Load existing vocab to preserve all previously enriched translations & examples
    existing_map = {}
    if os.path.exists(EXISTING_VOCAB_JSON):
        with open(EXISTING_VOCAB_JSON, "r", encoding="utf-8") as f:
            for item in json.load(f):
                existing_map[item["word"].lower()] = item
    print(f"Loaded {len(existing_map)} existing curated vocab entries.")

    oxford_3000_entries = parse_oxford_3000()

    final_by_level = {
        "A1": [],
        "A2": [],
        "B1": [],
        "B2": [],
        "C1": [],
    }

    seen_words = set()

    # 1. Process Oxford 3000 entries (A1, A2, B1, B2)
    for entry in oxford_3000_entries:
        w = entry["word"]
        w_lower = w.lower().split(",")[0].strip()
        if not w_lower or w_lower in seen_words:
            continue
        seen_words.add(w_lower)

        level = entry["level"]
        pos = entry["pos"]

        # Check existing curated entry first
        if w_lower in existing_map and existing_map[w_lower].get("meaning"):
            ex_item = existing_map[w_lower]
            meaning = ex_item["meaning"]
            ipa = ex_item.get("ipa", f"/{w}/")
            example = ex_item.get("example", f"This is an example with the word '{w}'.")
            exampleVi = ex_item.get("exampleVi", f"Đây là câu ví dụ với từ '{w}'.")
        else:
            dict_info = ev_dict.get(w_lower)
            if dict_info and dict_info.get("meaning"):
                meaning = dict_info["meaning"].split(";")[0].strip()
                ipa = dict_info.get("ipa") or f"/{w}/"
                if dict_info.get("example"):
                    example, exampleVi = dict_info["example"]
                else:
                    example = f"I use the word '{w}' in my daily English conversation."
                    exampleVi = f"Tôi sử dụng từ '{w}' trong giao tiếp tiếng Anh hàng ngày."
            else:
                meaning = f"nghĩa của từ {w}"
                ipa = f"/{w}/"
                example = f"The word '{w}' is commonly used in English."
                exampleVi = f"Từ '{w}' được sử dụng phổ biến trong tiếng Anh."

        final_by_level[level].append({
            "word": w,
            "pos": pos,
            "ipa": ipa,
            "meaning": meaning,
            "level": level,
            "example": example,
            "exampleVi": exampleVi,
        })

    # 2. Add all B2 and C1 words from existing vocabulary.json (from Oxford 5000 PDF)
    for w_lower, item in existing_map.items():
        if w_lower in seen_words:
            continue
        seen_words.add(w_lower)
        lvl = item.get("level", "B2")
        if lvl not in final_by_level:
            lvl = "B2"
        final_by_level[lvl].append({
            "word": item["word"],
            "pos": item.get("pos", "n."),
            "ipa": item.get("ipa", f"/{item['word']}/"),
            "meaning": item.get("meaning", ""),
            "level": lvl,
            "example": item.get("example", ""),
            "exampleVi": item.get("exampleVi", ""),
        })

    # 3. Combine in strict order of difficulty: A1 -> A2 -> B1 -> B2 -> C1
    ordered_list = []
    for lvl in ["A1", "A2", "B1", "B2", "C1"]:
        items = final_by_level[lvl]
        print(f"Level {lvl}: {len(items)} words")
        for i, it in enumerate(items):
            it["id"] = f"{lvl.lower()}-{i+1}"
            ordered_list.append(it)

    print(f"Total unified vocabulary: {len(ordered_list)} words!")

    # Write output
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(ordered_list, f, ensure_ascii=False, indent=2)

    print(f"Saved complete unified dataset to {OUTPUT_JSON}")

if __name__ == "__main__":
    main()
