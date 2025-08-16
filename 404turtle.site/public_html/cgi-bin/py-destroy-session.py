#!/usr/bin/env python3
print("Cache-Control: no-cache")
# expire the cookie
print("Set-Cookie: username=; Path=/; Max-Age=0")
print("Content-type: text/html"); print()

print("""<html>
<head><title>Session Destroyed</title></head>
<body>
<h1>Session Destroyed</h1>
<p><a href="/python-cgiform.html">Back to the Python CGI Form</a></p>
<p><a href="/cgi-bin/py-sessions-1.py">Back to Page 1</a></p>
<p><a href="/cgi-bin/py-sessions-2.py">Back to Page 2</a></p>
</body></html>""")
