### Compression Setup
Enabled Gzip compression via mod_deflate (Apache). Verified that HTML, CSS, and JS are now being sent compressed to reduce file size. After enabling, Chrome DevTools showed `content-encoding: gzip` for HTML files, indicating successful compression. This reduces transfer size, improving page load time.
