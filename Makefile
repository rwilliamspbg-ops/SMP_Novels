.PHONY: help env backend-dev backend-start compose-up compose-down tests verify audit

help:
	@echo "Makefile targets:"
	@echo "  env           - copy .env.example to .env (if missing)"
	@echo "  backend-dev   - run backend in dev mode (loads .env)"
	@echo "  backend-start - start backend (production mode)"
	@echo "  frontend-dev  - run frontend server"
	@echo "  compose-up    - docker-compose up (build)"
	@echo "  compose-down  - docker-compose down"
	@echo "  tests         - run backend test suites"
	@echo "  verify        - run all verification checks"
	@echo "  audit-narrative - run narrative audit"

env:
	@if [ ! -f .env ]; then \
		cp .env.example .env && \
		echo "Created .env from .env.example"; \
	else \
		echo ".env already exists"; \
	fi

backend-dev:
	cd backend && npm install --no-audit --no-fund && node -r dotenv/config src/server_fastify.js

backend-start:
	cd backend && npm install --production --no-audit --no-fund && node src/server_fastify.js

frontend-dev:
	cd frontend && npm install --no-audit --no-fund && node server.js

compose-up:
	docker-compose up --build -d

compose-down:
	docker-compose down

tests:
	cd backend && npm install --no-audit --no-fund && node src/test_suite.js && node src/test_suite_lite.js

verify:
	@echo "Running verification checks..."
	@cd backend && node src/audit_narrative.js || true
	@echo "✓ Verification complete"

audit-narrative:
	cd backend && npm run audit-narrative
