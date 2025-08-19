#!/usr/bin/env python3
import os

SESS_DIR = "/tmp/py_sessions"
def get_cookie(n):
    c = os.environ.get("HTTP_COOKIE","")
    for p in c.split(";"):
        if "=" in p and p.strip().startswith(n + "="):
            return p.split("=",1)[1].strip()
    return ""

sid = get_cookie("SID")
if sid:
    p = os.path.join(SESS_DIR, sid)
    try: os.remove(p) # delete server-side id
    except FileNotFoundError: pass

print("Cache-Control: no-cache")
print("Content-Type: text/html; charset=utf-8")
print("Set-Cookie: SID=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax")
print()
print("""<!doctype html><html><head><title>Session Destroyed</title></head>
<body>
<h1>Session Destroyed</h1>
<p><a href="/python-cgiform.html">Back to the Python CGI Form</a></p>
<p><a href="/cgi-bin/py-sessions-1.py">Back to Page 1</a></p>
<p><a href="/cgi-bin/py-sessions-2.py">Back to Page 2</a></p>
</body></html>""")
