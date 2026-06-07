"""
ReplyGiver Backend — FastAPI
Serves: /api/sites, /api/index, /api/chat, /api/history, /api/widget.js
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel
from typing import Optional
import sqlite3, uuid, json, httpx, re, os, asyncio
from datetime import datetime

app = FastAPI(title="ReplyGiver API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB = os.getenv("DB_PATH", "replygiver.db")

def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS sites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            status TEXT DEFAULT 'indexing',
            pages INTEGER DEFAULT 0,
            chunks INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            site_id INTEGER,
            url TEXT,
            title TEXT,
            content TEXT,
            FOREIGN KEY(site_id) REFERENCES sites(id)
        );
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            site_id INTEGER,
            role TEXT,
            content TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );
        """)

init_db()

# ── Models ──────────────────────────────────────────────────────────────────
class IndexRequest(BaseModel):
    url: str
    name: Optional[str] = None
    max_pages: int = 30

class ChatRequest(BaseModel):
    message: str
    site_id: int = 1
    session_id: Optional[str] = None

# ── Helpers ──────────────────────────────────────────────────────────────────
async def crawl_site(url: str, max_pages: int = 30) -> list[dict]:
    """Simple crawler — fetches pages and extracts text."""
    visited, queue, pages = set(), [url], []
    base = re.match(r'https?://[^/]+', url)
    base_domain = base.group(0) if base else url

    async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
        while queue and len(visited) < max_pages:
            current = queue.pop(0)
            if current in visited:
                continue
            visited.add(current)
            try:
                r = await client.get(current, headers={"User-Agent": "ReplyGiver/1.0"})
                html = r.text
                # Extract title
                title_m = re.search(r'<title[^>]*>(.*?)</title>', html, re.I | re.S)
                title = re.sub(r'<[^>]+>', '', title_m.group(1)).strip() if title_m else current
                # Strip scripts/styles then tags
                html_clean = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', html, flags=re.S | re.I)
                text = re.sub(r'<[^>]+>', ' ', html_clean)
                text = re.sub(r'\s+', ' ', text).strip()
                if len(text) > 100:
                    pages.append({"url": current, "title": title, "content": text[:4000]})
                # Find links
                links = re.findall(r'href=["\']([^"\']+)["\']', html)
                for link in links:
                    if link.startswith('/'):
                        link = base_domain + link
                    if link.startswith(base_domain) and link not in visited and '?' not in link:
                        queue.append(link)
            except Exception:
                pass
    return pages

def chunk_text(text: str, size: int = 500) -> list[str]:
    words = text.split()
    chunks, cur = [], []
    for w in words:
        cur.append(w)
        if len(' '.join(cur)) >= size:
            chunks.append(' '.join(cur))
            cur = cur[-20:]  # overlap
    if cur:
        chunks.append(' '.join(cur))
    return chunks

def simple_search(site_id: int, query: str, limit: int = 5) -> list[dict]:
    """Keyword-based search (no embeddings needed)."""
    with get_db() as conn:
        words = [w.lower() for w in query.split() if len(w) > 2]
        if not words:
            rows = conn.execute("SELECT * FROM chunks WHERE site_id=? LIMIT ?", (site_id, limit)).fetchall()
            return [dict(r) for r in rows]
        # Score by keyword hits
        rows = conn.execute("SELECT * FROM chunks WHERE site_id=?", (site_id,)).fetchall()
        scored = []
        for row in rows:
            content = (row['content'] or '').lower()
            score = sum(content.count(w) for w in words)
            if score > 0:
                scored.append((score, dict(row)))
        scored.sort(reverse=True, key=lambda x: x[0])
        return [r for _, r in scored[:limit]]

# ── Routes ───────────────────────────────────────────────────────────────────
@app.get("/api/sites")
def list_sites():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM sites ORDER BY id DESC").fetchall()
    return [dict(r) for r in rows]

@app.post("/api/index")
async def index_site(req: IndexRequest):
    name = req.name or req.url
    with get_db() as conn:
        cur = conn.execute("INSERT INTO sites (name, url, status) VALUES (?,?,?)", (name, req.url, 'indexing'))
        site_id = cur.lastrowid
        conn.commit()

    try:
        pages = await crawl_site(req.url, req.max_pages)
        total_chunks = 0
        with get_db() as conn:
            for page in pages:
                for chunk in chunk_text(page['content']):
                    conn.execute("INSERT INTO chunks (site_id, url, title, content) VALUES (?,?,?,?)",
                                 (site_id, page['url'], page['title'], chunk))
                    total_chunks += 1
            conn.execute("UPDATE sites SET status='ready', pages=?, chunks=? WHERE id=?",
                         (len(pages), total_chunks, site_id))
            conn.commit()
        return {"status": "indexed", "site_id": site_id, "pages": len(pages), "chunks": total_chunks}
    except Exception as e:
        with get_db() as conn:
            conn.execute("UPDATE sites SET status='error' WHERE id=?", (site_id,))
            conn.commit()
        raise HTTPException(500, str(e))

@app.post("/api/chat")
async def chat(req: ChatRequest):
    session_id = req.session_id or str(uuid.uuid4())
    # Save user message
    with get_db() as conn:
        conn.execute("INSERT INTO messages (session_id, site_id, role, content) VALUES (?,?,?,?)",
                     (session_id, req.site_id, 'user', req.message))
        conn.commit()

    # Retrieve context
    context_chunks = simple_search(req.site_id, req.message)
    context = "\n\n".join([f"[From: {c.get('title','?')}]\n{c['content']}" for c in context_chunks])

    # Build prompt (works without an LLM — returns a fallback if no key)
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
    if anthropic_key:
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                r = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={"x-api-key": anthropic_key, "anthropic-version": "2023-06-01", "content-type": "application/json"},
                    json={
                        "model": "claude-haiku-20240307",
                        "max_tokens": 512,
                        "system": f"You are a helpful support assistant. Use the following documentation to answer questions.\n\n{context}",
                        "messages": [{"role": "user", "content": req.message}]
                    }
                )
                reply = r.json()["content"][0]["text"]
        except Exception as e:
            reply = f"Sorry, I couldn't reach the AI service: {e}"
    else:
        # Demo mode — echo context
        if context_chunks:
            reply = f"Based on the documentation: {context_chunks[0]['content'][:300]}..."
        else:
            reply = "I don't have information about that in the indexed documentation. Please try rephrasing your question."

    with get_db() as conn:
        conn.execute("INSERT INTO messages (session_id, site_id, role, content) VALUES (?,?,?,?)",
                     (session_id, req.site_id, 'assistant', reply))
        conn.commit()

    return {"reply": reply, "session_id": session_id}

@app.get("/api/history")
def get_history(limit: int = 100, site_id: Optional[int] = None):
    with get_db() as conn:
        if site_id:
            rows = conn.execute("SELECT * FROM messages WHERE site_id=? ORDER BY id DESC LIMIT ?", (site_id, limit)).fetchall()
        else:
            rows = conn.execute("SELECT * FROM messages ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
    return [dict(r) for r in rows]

@app.get("/api/widget.js")
def widget_js():
    js = r"""
(function(){
  var s=window.REPLYGIVER_SITE_ID||1;
  var api=window.REPLYGIVER_API_URL||'http://localhost:8000';
  var sid=Math.random().toString(36).slice(2);

  // Inject styles
  var style=document.createElement('style');
  style.textContent='#rg-btn{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:#11181c;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,.2);z-index:9999;transition:.2s}#rg-btn:hover{transform:scale(1.08)}#rg-box{position:fixed;bottom:92px;right:24px;width:360px;height:480px;background:#fff;border:1px solid #e4e8ec;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.12);display:none;flex-direction:column;z-index:9998;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow:hidden}#rg-box.open{display:flex}#rg-head{padding:16px 20px;background:#11181c;color:#fff;font-weight:700;font-size:15px;display:flex;justify-content:space-between;align-items:center}#rg-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px}#rg-msg-u,#rg-msg-a{max-width:80%;padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.5;word-break:break-word}.rg-u{align-self:flex-end;background:#11181c;color:#fff;border-radius:12px 12px 4px 12px}.rg-a{align-self:flex-start;background:#f1f3f5;color:#11181c;border-radius:12px 12px 12px 4px}#rg-foot{padding:12px;border-top:1px solid #e4e8ec;display:flex;gap:8px}#rg-input{flex:1;padding:10px 14px;border:1px solid #e4e8ec;border-radius:8px;font-size:13px;outline:none}#rg-input:focus{border-color:#0066cc}#rg-send{padding:10px 16px;background:#11181c;color:#fff;border:none;border-radius:8px;font-weight:600;font-size:13px;cursor:pointer}';
  document.head.appendChild(style);

  // Build widget HTML
  var btn=document.createElement('button');btn.id='rg-btn';
  btn.innerHTML='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>';
  document.body.appendChild(btn);

  var box=document.createElement('div');box.id='rg-box';
  box.innerHTML='<div id="rg-head"><span>💬 Support Chat</span><span id="rg-close" style="cursor:pointer;font-size:18px;opacity:.7">✕</span></div><div id="rg-msgs"><div class="rg-a" style="max-width:80%;padding:10px 14px;border-radius:12px;font-size:13px;background:#f1f3f5">Hi! How can I help you today?</div></div><div id="rg-foot"><input id="rg-input" placeholder="Ask a question..." /><button id="rg-send">Send</button></div>';
  document.body.appendChild(box);

  btn.onclick=function(){box.classList.toggle('open')};
  document.getElementById('rg-close').onclick=function(){box.classList.remove('open')};

  function addMsg(content,role){
    var d=document.createElement('div');
    d.className=role==='user'?'rg-u':'rg-a';
    d.style.cssText='max-width:80%;padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.5;word-break:break-word;'+(role==='user'?'align-self:flex-end;background:#11181c;color:#fff;border-radius:12px 12px 4px 12px':'align-self:flex-start;background:#f1f3f5;color:#11181c;border-radius:12px 12px 12px 4px');
    d.textContent=content;
    document.getElementById('rg-msgs').appendChild(d);
    document.getElementById('rg-msgs').scrollTop=9999;
  }

  function send(){
    var inp=document.getElementById('rg-input');
    var msg=inp.value.trim();if(!msg)return;
    addMsg(msg,'user');inp.value='';
    var thinking=document.createElement('div');
    thinking.style.cssText='align-self:flex-start;background:#f1f3f5;color:#687076;padding:10px 14px;border-radius:12px;font-size:13px';
    thinking.textContent='Thinking...';
    document.getElementById('rg-msgs').appendChild(thinking);
    fetch(api+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg,site_id:s,session_id:sid})})
      .then(function(r){return r.json()})
      .then(function(d){thinking.remove();addMsg(d.reply||'Sorry, no answer found.','assistant')})
      .catch(function(){thinking.remove();addMsg('Error connecting to support server.','assistant')});
  }

  document.getElementById('rg-send').onclick=send;
  document.getElementById('rg-input').onkeydown=function(e){if(e.key==='Enter')send()};
})();
"""
    return Response(content=js, media_type="application/javascript")

@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}
