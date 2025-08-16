#!/usr/bin/env python3
import os, secrets
sid = None
cookie = os.environ.get("HTTP_COOKIE","")
for part in cookie.split(";"):
    if part.strip().startswith("SID="):
        sid = part.strip().split("=",1)[1]
if not sid:
    sid = secrets.token_hex(16)
    print(f"Set-Cookie: SID={sid}; Path=/; HttpOnly")
print("Content-Type: text/html\r\n\r\n")
print(f"""<!doctype html><html><body>
<h1>State Demo (Step 1)</h1>
<form action="/cgi-bin/py-state-demo-2.py" method="post">
  <label>Your name: <input name="name" required></label>
  <button type="submit">Save</button>
</form>
</body></html>""")
