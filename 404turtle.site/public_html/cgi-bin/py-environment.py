#!/usr/bin/env python3
import os, html
print("Content-Type: text/html\r\n\r\n")
print("<pre>")
for k,v in sorted(os.environ.items()):
    print(f"{k}={html.escape(v)}")
print("</pre>")
