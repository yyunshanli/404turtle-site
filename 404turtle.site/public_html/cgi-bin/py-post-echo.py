#!/usr/bin/env python3
import os, sys, html

print("Cache-Control: no-cache")
print("Content-type: text/html\r\n")

length = int(os.environ.get("CONTENT_LENGTH", "0") or 0)
body   = sys.stdin.read(length) if length else ""

print(f"""<html><head><title>POST Message Body</title></head>
<body><h1 align=center>POST Message Body</h1><hr/>
Message Body: {html.escape(body)}<br/>
</body></html>""")
