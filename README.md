# cse135-hw1

# names of all members
Angel Chavez, Yunshan Li

# droplet info 
Host name: ubuntu-cse135

root password: frogfrogFr0g

ip address: 143.198.140.58

# site login
user: grader

password: frogfrog

# server login 
user: grader

password: frogfrog

# link to site
https://404turtle.site/

# Dashboard
We built the dashboard around two goals: what users are doing on our site/using our site for and whether the site feels healthy and fast while they do it. The page has a quick stats bar on top and the charts underneath.

## Stats bar
Up top we show Sessions, Pageviews (24h), Unique Pages, Errors (24h), and Median Load (ms). They’re kept as numbers on purpose to be easy to glance at. The 24-hour window keeps the activity numbers fresh, and using the median for load keeps weird outliers from messing it up.

# Charts: what we picked and why

## Errors per Minute — line chart

Here we count how many error events happen each minute and draw that as a line over time. Using “per minute” normalizes the rate for busy and quiet periods. The line also makes spikes jump out fast. It’s easy to line up a spike with something that happened (a deploy, a busy hour), and the timestamps make it useful when you’re digging into logs later. We tried fancier versions (stacked by type, heatmaps), but they were harder to read at a glance, so we kept it clean.

## Median Load by Page (Top 5) — bar chart

For performance, we look at the “typical” load time for each page and show just the worst five. We use the median on purpose so one weird, super-slow visit doesn’t sway the result. Bars are good here because you just want to see which pages are slower than the others without thinking too hard. We considered box plots to show spread, but that felt like overkill for a dashboard you skim.

## Session Duration Distribution (last 24h) — horizontal bars

This one groups sessions by how long they lasted in simple ranges: 0-10s, 10-30s, 30-60s, 1–3m, and so on. Ranges are easier to understand than exact seconds, and the horizontal layout keeps the labels readable. While the report is not perfect, as people leave tabs open and sessions can include a few visits, it’s great for seeing if most people bounce right away or actually hang around.

## Top Landing Pages (all-time) — bar chart

For each session, we grab the first page the person saw and count those up. That tells us where people are arriving from and which pages need to be made extra well because they make the first impression. We keep this “all-time” (within what we’ve loaded) so we can see a persistent trend, and bars keep the comparison straightforward. The motivation for this chart is learning about the site navigation, where there are entry points to the site and exit points.

## Top Exit Pages (all-time) — bar chart

Same idea as landings, but for the last page someone saw. If a page shows up here a lot, it might be a dead end… or it might be the place where people finish what they came to do. Reading this together with the duration chart helps: lots of exits plus lots of very short sessions usually mean a bounce; lots of exits after longer sessions can mean “mission accomplished.”

## Traffic Share by Page — donut with “Other”

This shows how the total pageviews are split across pages. We limit it to the top handful and roll the tiny ones into “Other” so the donut doesn’t turn hard to read. Each slice is labeled with a percent, so you don’t have to guess. We tried other shapes (stacked bars), but at this small size, the donut communicates “who’s biggest” the fastest.


# Homework 1
## Details of Github auto deploy setup
This deployment process uses Git hooks.  

1. **Create a bare repository on the server** to receive pushes from the local repository.  
2. **Edit the `post-receive` hook** in the bare repository to automatically deploy the latest code to production by checking it out into the `/var/www` directory.  
3. **Add the server repository as a remote** (`production`) in the local Git repository.  
4. **Deploy by pushing to the server**:  
   ```bash
   git push production main

## Username/password info for logging into the site
user: grader

password frogfrog

## Summary of changes to HTML file in DevTools after compression
After the HTML file has been compressed, I can see from DevTools that the Content-Encoding response header is gzip and the size of the HTML file transferred is significantly smaller than the uncompressed file.

## Summary of removing 'server' header
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










