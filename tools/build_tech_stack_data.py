import json
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]

YAML_PATH = ROOT / "lib" / "tech_stack.yaml"
OUT_PATH  = ROOT / "lib" / "tech_stack_data.js"

def main() -> None:
    if not YAML_PATH.exists():
        raise SystemExit(f"[build_tech_stack_data] Missing: {YAML_PATH}")

    data = yaml.safe_load(YAML_PATH.read_text(encoding="utf-8")) or {}

    # JS file (vanilla): no YAML parsing needed in the extension
    js = (
        "// AUTO-GENERATED. Edit lib/__tech_stack.yaml, not this file.\n"
        "window.TECH_STACK_DATA = "
        + json.dumps(data, ensure_ascii=False, indent=2)
        + ";\n"
    )

    OUT_PATH.write_text(js, encoding="utf-8")
    print(f"[build_tech_stack_data] Wrote: {OUT_PATH}")

if __name__ == "__main__":
    main()
