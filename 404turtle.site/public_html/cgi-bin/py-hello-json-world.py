#!/usr/bin/env python3
import os, json, datetime
print("Content-Type: application/json\r\n\r\n")
out = {
  "title":"Hello, Python!", "heading":"Hello, Python!",
  "message":"This page was generated with Python (CGI).",
  "time": datetime.datetime.now().isoformat(sep=" ", timespec="seconds"),
  "IP": os.environ.get("REMOTE_ADDR","unknown")
}
print(json.dumps(out))
