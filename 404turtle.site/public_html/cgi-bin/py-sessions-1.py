#!/usr/bin/env python3
import os, sys, html
from urllib.parse import parse_qs

print("Cache-Control: no-cache")
# read POST body (or accept ?username=…)
length = int(os.environ.get("CONTENT_LENGTH","0") or 0)
body = sys.stdin.read(length) if length else os.environ.get("QUERY_STRING","")
params = parse_qs(body, keep_blank_values=True)
new_name = (params.get("username") or [""])[0]

# set cookie if provided
if new_name:
    print(f"Set-Cookie: username={new_name}; Path=/; HttpOnly")
print("Content-type: text/html"); print()

# show name: new value → cookie → default
cookie = os.environ.get("HTTP_COOKIE","")
name = new_name or next((p.split("=",1)[1] for p in cookie.split(";") if p.strip().startswith("username=")), "")


print(f"""<html>
<head><title>Python Sessions Page 1</title></head>
<body>
<h1>Python Sessions Page 1</h1>
<p><b>Name:</b> {html.escape(name)}</p>

<p><a href="/cgi-bin/py-sessions-2.py">Session Page 2</a></p>
<p><a href="/python-cgiform.html">Python CGI Form</a></p>

<form action="/cgi-bin/py-destroy-session.py" method="get">
  <button type="submit">Destroy Session</button>
</form>
</body></html>""")
