#!/usr/bin/env python3
import os, datetime
print("Content-Type: text/html\r\n\r\n")
ip = os.environ.get("REMOTE_ADDR", "unknown")
now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
print(f"""<!doctype html><html><head><title>Hello</title></head>
<body><h1>Hello, World!</h1>
<p>Time: {now}</p><p>Your IP: {ip}</p></body></html>""")