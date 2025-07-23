

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
