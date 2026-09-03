.PHONY: venv verify build up down logs

VENV := scripts/.venv
PYTHON := $(VENV)/bin/python3

venv:
	python3 -m venv $(VENV)
	$(VENV)/bin/pip install -q -r scripts/requirements.txt

verify: venv
	$(PYTHON) scripts/verify_sandbox_env.py

build: verify
	docker compose build

up: verify
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f
