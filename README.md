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
This deployment process uses Git hooks.  

1. **Create a bare repository on the server** to receive pushes from the local repository.  
2. **Edit the `post-receive` hook** in the bare repository to automatically deploy the latest code to production by checking it out into the `/var/www` directory.  
3. **Add the server repository as a remote** (`production`) in the local Git repository.  
4. **Deploy by pushing to the server**:  
   ```bash
   git push production main

# Username/password info for logging into the site
user: grader

password frogfrog

# Summary of changes to HTML file in DevTools after compression
Enabled Gzip compression via mod_deflate (Apache). Verified that HTML, CSS, and JS are now being sent compressed to reduce file size. After enabling, Chrome DevTools showed `content-encoding: gzip` for HTML files, indicating successful compression. This reduces transfer size, improving page load time.

# Summary of removing 'server' header
After first trying the common mod_headers approach (Header always set Server "CSE135 Server") and not getting consistent results, we switched to ModSecurity. We enabled security2 and set SecServerSignature "CSE135 Server", loading the directive via Apache’s main configuration (/etc/apache2/apache2.conf). After reloading Apache and clearing the browser cache (older responses had cached headers), DevTools confirmed the Server header now reads CSE135 Server

# Attachments

## initial-index.jpg
![initial-index](https://github.com/user-attachments/assets/9f4466a0-7622-4f9b-83a4-aaaf5f9a16ca)

## modified-index.jpg
![modified-index](https://github.com/user-attachments/assets/1f3187f6-78ff-4ff8-b0f7-e152b670897d)

## validator-initial.jpg
![validator-initial](https://github.com/user-attachments/assets/37769e74-1406-4043-9d1b-d0a46611a489)

## vhosts-verify.jpg
![vhosts-verify](https://github.com/user-attachments/assets/eeb37050-fe57-4b22-b272-f49d7d97573e)

## ssl-verify.jpg
![ssl-verify](https://github.com/user-attachments/assets/7189c057-01cc-4b4c-9f0c-2ad7ab399ba9)

## github-deploy.gif
![Github Deploy](Github-Deploy.gif)

## php-verification.jpg
![php-verification](https://github.com/user-attachments/assets/87e62d32-7961-4cc8-bdb7-2bc5df355f71)

## compress-verify.jpg
![compression-verify](https://github.com/user-attachments/assets/6341f481-0ee5-47f4-8a41-a2c7161cbeef)

## header-verify.jpg 
![header-verify](https://github.com/user-attachments/assets/d0290f5c-4c06-4100-b6ef-50283fd42c88)

## error-page.jpg
![error-page](https://github.com/user-attachments/assets/41a0ef75-dfec-4c69-84eb-662ceffd8226)

## log-verification.jpg
![log-verification](https://github.com/user-attachments/assets/521b5439-f2c8-4e07-8dcb-a3d12bc85aee)

## report-verification.jpg 
![report-verification](https://github.com/user-attachments/assets/c2478809-2c19-444d-8a0f-38ca4899e040)










