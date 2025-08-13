# cse135-hw1

# names of all members
Angel Chavez, Yunshan Li

# droplet info 
Host name: ubuntu-cse135

root password: frogfrogFr0g

ip address: 143.198.140.58

# password for user grader

password frogfrog

# link to site
https://404turtle.site/

# Details of Github auto deploy setup
Step up using git hooks

# Username/password info for logging into the site
user: grader

password frogfrog

# Summary of changes to HTML file in DevTools after compression

# Summary of removing 'server' header
After first trying the common mod_headers approach (Header always set Server "CSE135 Server") and not getting consistent results, we switched to ModSecurity. We enabled security2 and set SecServerSignature "CSE135 Server", loading the directive via Apache’s main configuration (/etc/apache2/apache2.conf). After reloading Apache and clearing the browser cache (older responses had cached headers), DevTools confirmed the Server header now reads CSE135 Server

# Compression Setup
Enabled Gzip compression via mod_deflate (Apache). Verified that HTML, CSS, and JS are now being sent compressed to reduce file size. After enabling, Chrome DevTools showed `content-encoding: gzip` for HTML files, indicating successful compression. This reduces transfer size, improving page load time.

# Attachments



