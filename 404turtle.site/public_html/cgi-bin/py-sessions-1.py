#!/usr/bin/env python3
import os, sys, html, secrets
from urllib.parse import parse_qs

SESS_DIR = "/tmp/py_sessions" # store session files
os.makedirs(SESS_DIR, exist_ok=True)

def get_cookie(name): # reads HTTP_COOKIE env var
    c = os.environ.get("HTTP_COOKIE", "")
    for part in c.split(";"):
        part = part.strip()
        if part.startswith(name + "="):
            return part.split("=", 1)[1]
    return ""

def sess_path(sid): return os.path.join(SESS_DIR, sid)

# get or create session ID
sid = get_cookie("SID")
if not sid or not os.path.exists(sess_path(sid)):
    sid = secrets.token_hex(16)  # opaque session id

# read POST, save to server-side session
length = int(os.environ.get("CONTENT_LENGTH", "0") or 0)
raw = sys.stdin.read(length) if length else os.environ.get("QUERY_STRING", "")
name = (parse_qs(raw).get("username") or [""])[0]
if name:
    with open(sess_path(sid), "w") as f:
        f.write(name)

# load current value from session
if os.path.exists(sess_path(sid)):
    with open(sess_path(sid)) as f:
        name = f.read()
else:
    name = ""

# reponse

# HTTP headers
print("Cache-Control: no-cache")
print("Content-Type: text/html; charset=utf-8")
print(f"Set-Cookie: SID={sid}; Path=/; HttpOnly; SameSite=Lax")
print()

# form 
print(f"""<!doctype html><html><head><title>Python Sessions Page 2</title></head>
<body>
<h1>Python Sessions Page 1</h1>
<p><b>Name:</b> {html.escape(name)}</p>

<p><a href="/cgi-bin/py-sessions-2.py">Session Page 2</a></p>
<p><a href="/python-state-demo.html">Python CGI Form</a></p>

<form method="post" action="/cgi-bin/py-destroy-session.py">
  <button type="submit">Destroy Session</button>
</form>
</body></html>""")
