#!/usr/bin/env python3
import os, html
SESS_DIR = "/tmp/py_sessions"

def get_cookie(n):
    c = os.environ.get("HTTP_COOKIE","")
    for p in c.split(";"):
        if "=" in p and p.strip().startswith(n + "="):
            return p.split("=",1)[1].strip()
    return ""

sid = get_cookie("SID")
name = ""
p = os.path.join(SESS_DIR, sid) if sid else ""
if p and os.path.exists(p):
    with open(p) as f: name = f.read()

print("Cache-Control: no-cache")
print("Content-Type: text/html; charset=utf-8")
print()
print(f"""<!doctype html><html><head><title>Python Sessions Page 2</title></head>
<body>
<h1>Python Sessions Page 2</h1>
<p><b>Name:</b> {html.escape(name)}</p>

<p><a href="/cgi-bin/py-sessions-1.py">Session Page 1</a></p>
<p><a href="/python-state-demo.html">Python CGI Form</a></p>

<form method="post" action="/cgi-bin/py-destroy-session.py">
  <button type="submit">Destroy Session</button>
</form>
</body></html>""")
