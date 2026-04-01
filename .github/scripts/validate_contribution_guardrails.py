#!/usr/bin/env python3
"""Validate repository contribution operating-system guardrails."""

from __future__ import annotations

from pathlib import Path
import re
import sys


ROOT = Path(__file__).resolve().parents[2]


REQUIRED_FILES = [
    "README.md",
    "CONTRIBUTING.md",
    "AGENTS.md",
    "CLAUDE.md",
    "GEMINI.md",
    ".github/copilot-instructions.md",
    ".github/pull_request_template.md",
    ".github/CODEOWNERS",
    ".github/ISSUE_TEMPLATE/bug-report.yml",
    ".github/ISSUE_TEMPLATE/feature-request.yml",
    ".github/ISSUE_TEMPLATE/chore-or-governance.yml",
    ".github/ISSUE_TEMPLATE/config.yml",
    ".github/workflows/contribution-guardrails.yml",
    ".github/workflows/quality.yml",
]


def require_file(path: str, failures: list[str]) -> Path:
    file_path = ROOT / path
    if not file_path.exists():
        failures.append(f"Missing required file: {path}")
    return file_path


def require_contains(path: str, required_text: str, failures: list[str]) -> None:
    file_path = ROOT / path
    if not file_path.exists():
        return
    text = file_path.read_text(encoding="utf-8")
    if required_text not in text:
        failures.append(f"{path} must contain: {required_text}")


def main() -> int:
    failures: list[str] = []

    for required in REQUIRED_FILES:
        require_file(required, failures)

    require_contains("README.md", "GitHub is the live source of truth", failures)
    require_contains("README.md", "CONTRIBUTING.md", failures)

    require_contains("CONTRIBUTING.md", "GitHub is the live source of truth", failures)
    require_contains("CONTRIBUTING.md", "<actor>/<type>/<scope>/<task>-<id>", failures)
    require_contains("CONTRIBUTING.md", "start <task>", failures)
    require_contains("CONTRIBUTING.md", "finish it for #<id>", failures)
    require_contains("CONTRIBUTING.md", "Backlog", failures)

    adapters = ["AGENTS.md", "CLAUDE.md", "GEMINI.md", ".github/copilot-instructions.md"]
    for adapter in adapters:
        file_path = ROOT / adapter
        if not file_path.exists():
            continue
        text = file_path.read_text(encoding="utf-8")
        if "CONTRIBUTING.md" not in text:
            failures.append(f"{adapter} must direct contributors to CONTRIBUTING.md")

    issue_files = [
        ".github/ISSUE_TEMPLATE/bug-report.yml",
        ".github/ISSUE_TEMPLATE/feature-request.yml",
        ".github/ISSUE_TEMPLATE/chore-or-governance.yml",
    ]
    for issue_file in issue_files:
        file_path = ROOT / issue_file
        if not file_path.exists():
            continue
        text = file_path.read_text(encoding="utf-8")
        if not re.search(r"(?m)^name:\s+\S+", text):
            failures.append(f"{issue_file} must define a name")
        if "Backlog" not in text:
            failures.append(f"{issue_file} must mention Backlog milestone usage")

    workflow_path = ROOT / ".github/workflows/contribution-guardrails.yml"
    if workflow_path.exists():
        workflow_text = workflow_path.read_text(encoding="utf-8")
        if ".github/scripts/validate_contribution_guardrails.py" not in workflow_text:
            failures.append(
                "contribution-guardrails workflow must execute validate_contribution_guardrails.py"
            )

    quality_path = ROOT / ".github/workflows/quality.yml"
    if quality_path.exists():
        quality_text = quality_path.read_text(encoding="utf-8")
        if "npm run build" not in quality_text:
            failures.append("quality workflow must run npm run build")

    if failures:
        print("Contribution guardrails validation failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("Contribution guardrails validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
