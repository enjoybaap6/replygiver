#!/usr/bin/env bash
set -e

# ── Colors ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

echo -e "${BLUE}"
echo "  ╔══════════════════════════════════╗"
echo "  ║        ReplyGiver v1.0           ║"
echo "  ║   Self-hosted support chat       ║"
echo "  ╚══════════════════════════════════╝"
echo -e "${NC}"

# ── Check Docker ──────────────────────────────────────────────────────────────
if ! command -v docker &> /dev/null; then
  echo -e "${RED}✗ Docker not found.${NC}"
  echo "  Install Docker Desktop: https://www.docker.com/products/docker-desktop/"
  exit 1
fi

if ! docker info &> /dev/null; then
  echo -e "${RED}✗ Docker is not running. Please start Docker Desktop.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Docker is running${NC}"

# ── Check .env ────────────────────────────────────────────────────────────────
if [ ! -f .env ]; then
  cp .env.example .env 2>/dev/null || true
fi

if grep -q "ANTHROPIC_API_KEY=$" .env 2>/dev/null; then
  echo -e "${YELLOW}⚠  ANTHROPIC_API_KEY not set in .env${NC}"
  echo "   The widget will run in demo mode (returns raw doc text)."
  echo "   Add your key to .env for AI-powered responses."
fi

# ── Build & Start ─────────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}→ Building and starting services...${NC}"
docker compose up --build -d

# ── Wait for backend ──────────────────────────────────────────────────────────
echo -e "${BLUE}→ Waiting for backend to be ready...${NC}"
for i in {1..30}; do
  if curl -sf http://localhost:8000/health &>/dev/null; then
    break
  fi
  sleep 2
done

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ ReplyGiver is running!${NC}"
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo ""
echo -e "  📊 Dashboard:  ${BLUE}http://localhost:3000${NC}"
echo -e "  🔌 API:        ${BLUE}http://localhost:8000${NC}"
echo -e "  📖 API docs:   ${BLUE}http://localhost:8000/docs${NC}"
echo ""
echo -e "  🔑 Admin key:  ${YELLOW}replygiver123${NC} (change in .env)"
echo ""
echo -e "  To stop:  ${YELLOW}docker compose down${NC}"
echo -e "  Logs:     ${YELLOW}docker compose logs -f${NC}"
echo ""

# Open browser
if command -v open &>/dev/null; then
  open http://localhost:3000
elif command -v xdg-open &>/dev/null; then
  xdg-open http://localhost:3000
fi
