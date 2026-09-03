#!/usr/bin/env python3
"""Run before docker compose up: verifies .env.local before any container starts."""
import sys
from pathlib import Path
from dotenv import dotenv_values

REQUIRED = ["NAMECOM_USERNAME", "NAMECOM_API_TOKEN", "NAMECOM_API_BASE_URL", "ANTHROPIC_API_KEY", "LANDING_PAGE_HOST_IP"]
PROD_HOSTS = ["api.name.com"]

def fail(msg):
    print(f"[verify_sandbox_env] REFUSING TO PROCEED: {msg}", file=sys.stderr)
    sys.exit(1)

def main():
    env_path = Path(__file__).resolve().parent.parent / ".env.local"
    if not env_path.exists():
        fail(f"{env_path} not found. Copy .env.example to .env.local first.")

    values = dotenv_values(env_path)
    missing = [v for v in REQUIRED if not values.get(v)]
    if missing:
        fail(f"Missing env vars: {', '.join(missing)}")

    base_url = values.get("NAMECOM_API_BASE_URL", "")
    is_prod = any(h in base_url for h in PROD_HOSTS)
    allowed = values.get("ALLOW_NAMECOM_PRODUCTION", "").lower() == "true"
    if is_prod and not allowed:
        fail(f"NAMECOM_API_BASE_URL ({base_url}) looks like production. Set ALLOW_NAMECOM_PRODUCTION=true if intentional.")

    print("[verify_sandbox_env] OK — config looks sandboxed.")

if __name__ == "__main__":
    main()
