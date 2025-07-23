

Run the following:

- `npm install` to install dependencies.
- `npm run dev:chrome` to start the development server for chrome extension


- **Load extension in browser**

- ### Chrome

  - Go to the browser address bar and type `chrome://extensions`
  - Check the `Developer Mode` button to enable it.
  - Click on the `Load Unpacked Extension…` button.
  - Select your browsers folder in `extension/`.

- ### Which endpoints you chose and why
   - Endpoint: https://api.github.com/users/octocat
     - Reason:
     - This is a simple and public endpoint provided by GitHub that returns JSON data for a GitHub user.

  - Reddit API
    - Endpoint: https://www.reddit.com/user/spez/about.json
    - Reason:
    - This Reddit API endpoint returns public information about a Reddit user in JSON format. It's suitable for browser extension testing

- ### How your extension intercepts the requests
-  +--------------------+
   |   Popup UI (React) |
   +--------------------+
           |
           | [User Clicks "Fetch GitHub/Reddit"]
           v
+--------------------------------+
| browser.runtime.sendMessage() |
+--------------------------------+
           |
           v
+-------------------------------+
| Background Service Worker     |
| - Listens for messages        |
| - Makes Fetch API call        |
|   to GitHub or Reddit         |
+-------------------------------+
           |
           v
+-----------------------------+
| External API (GitHub/Reddit)|
+-----------------------------+
           |
           v
+-------------------------------+
| Background receives response  |
| Parses JSON / handles errors  |
| Sends response back to popup  |
+-------------------------------+
           |
           v
+--------------------------+
| Popup receives message   |
| and updates UI           |
+--------------------------+
  

- ###Any Challenges Faced and How They Were Solved
While building the extension, I encountered several challenges:

- Manifest Version Conflict:
  - The repository initially used Manifest V2, but Chrome now supports only Manifest V3. Being new to web extensions, I wasn't aware of this until I explored the vite-rewrite branch, which had the updated setup.

 - Initial Runtime Errors:
   -After loading the extension in Chrome, several errors appeared due to incorrect configurations and deprecated APIs. These were fixed by carefully updating the background script and properly registering the service worker.

 - Losing Changes During Development:
I mistakenly made edits inside the /chrome folder, which is regenerated every time npm run dev:chrome is executed. This caused my work to be lost. I learned to make all source code changes in the /source folder instead.

 - Popup Not Displaying Data:
   - I had to modify index.ts, Popup.tsx, and popup.html to correctly wire the frontend and backend logic. After syncing the message passing and content fetching flow, the extension UI started displaying results properly.

 - CORS and Permissions Issue:
   -Initially, requests were blocked due to CORS. This was resolved by adding the respective API domains (GitHub and Reddit) to the permissions and host_permissions sections in the manifest.json.

 - GitHub vs Reddit API:
  - While the GitHub API returned valid JSON and worked seamlessly, the Reddit API sometimes returned HTML instead of JSON (likely due to missing headers or unauthenticated access). As a workaround, I tried to parse only when JSON was received and added error handling to catch and report format issues gracefully.



