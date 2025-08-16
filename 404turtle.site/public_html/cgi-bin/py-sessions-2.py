#!/usr/bin/env python3
import os, html

print("Cache-Control: no-cache")
print("Content-type: text/html"); print()

cookie = os.environ.get("HTTP_COOKIE","")
name = next((p.split("=",1)[1] for p in cookie.split(";") if p.strip().startswith("username=")), "")


print(f"""<html>
<head><title>Python Sessions Page 2</title></head>
<body>
<h1>Python Sessions Page 2</h1>
<p><b>Name:</b> {html.escape(name)}</p>

<p><a href="/cgi-bin/py-sessions-1.py">Session Page 1</a></p>
<p><a href="/python-cgiform.html">Python CGI Form</a></p>

<form action="/cgi-bin/py-destroy-session.py" method="get">
  <button type="submit">Destroy Session</button>
</form>
</body></html>""")
