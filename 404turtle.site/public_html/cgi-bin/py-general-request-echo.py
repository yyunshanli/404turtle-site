#!/usr/bin/env python3
import os, sys, html

# headers
print("Content-Type: text/html")
print("Cache-Control: no-cache")
print()

proto  = os.environ.get("SERVER_PROTOCOL", "")
method = os.environ.get("REQUEST_METHOD", "")
qs     = os.environ.get("QUERY_STRING", "")
length = int(os.environ.get("CONTENT_LENGTH", "0") or 0)
body   = sys.stdin.read(length) if length else ""

print(f"""<!doctype html>
<html>
<head>
  <title>General Request Echo</title>
</head>
<body>
  <h1>General Request Echo</h1>
  <hr/>
  <p><span class="label">HTTP Protocol:</span> {html.escape(proto)}</p>
  <p><span class="label">HTTP Method:</span> {html.escape(method)}</p>
  <p><span class="label">Query String:</span> {html.escape(qs)}</p>
  <p><span class="label">Message Body:</span> {html.escape(body)}</p>
</body>
</html>""")
