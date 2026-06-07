# ReplyGiver

Self-hosted documentation chat widget. Index your docs, embed a chat bubble on your site.

## One-Click Start

**Mac / Linux:**
```bash
chmod +x start.sh && ./start.sh
```

**Windows:**
Double-click `start.bat`

That's it. Opens your browser at http://localhost:3000.

---

## Requirements

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (only requirement)

---

## Configuration (`.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | *(empty)* | Claude API key for AI responses. Without it, widget runs in demo mode. |
| `ADMIN_KEY` | `replygiver123` | Dashboard login password |

Edit `.env` before running, or restart after changes:
```bash
docker compose down && ./start.sh
```

---

## Usage

1. **Add a site** → Dashboard → Sites → Enter your docs URL → Index Site
2. **Embed the widget** → Dashboard → Widget → Copy the snippet → Paste before `</body>`
3. **Watch conversations** → Dashboard → Chat History (auto-refreshes every 5s)

### Widget snippet (example)
```html
<script>
window.REPLYGIVER_SITE_ID = 1;
window.REPLYGIVER_API_URL = 'http://localhost:8000';
</script>
<script src="http://localhost:8000/api/widget.js"></script>
```

---

## Stopping

```bash
docker compose down        # stop
docker compose down -v     # stop + delete data
```

## Logs

```bash
docker compose logs -f backend    # backend logs
docker compose logs -f dashboard  # dashboard logs
```

---

## API

Full interactive docs at http://localhost:8000/docs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sites` | GET | List indexed sites |
| `/api/index` | POST | Index a new site |
| `/api/chat` | POST | Send a chat message |
| `/api/history` | GET | Get message history |
| `/api/widget.js` | GET | Embeddable widget script |

---

## Architecture

```
replygiver/
├── backend/        FastAPI (Python) — crawler, search, chat, API
├── dashboard/      Next.js — admin UI
├── docker-compose.yml
├── .env            Configuration
├── start.sh        Mac/Linux one-click start
└── start.bat       Windows one-click start
```

Data is stored in a SQLite database persisted via Docker volume.

---

MIT License
