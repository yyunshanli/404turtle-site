#!/usr/bin/env python3
import os, html
from urllib.parse import parse_qsl

# headers
print("Content-Type: text/html")
print("Cache-Control: no-cache")
print()

qs_raw = os.environ.get("QUERY_STRING", "")
pairs = parse_qsl(qs_raw, keep_blank_values=True)

print(f"""<html><head><title>GET query string</title></head>
<body><h1 align=center>GET query string</h1>
<hr/>
Raw query string: {html.escape(qs_raw)}<br/><br/>
<table> Formatted Query String:""")

if pairs:
    for k, v in pairs:
        print(f"<tr><td>{html.escape(k)}:</td><td>{html.escape(v)}</td></tr>")
else:
    print('<tr><td colspan="2">(empty)</td></tr>')

print("""</table>
</body></html>""")
