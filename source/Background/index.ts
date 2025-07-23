import browser from 'webextension-polyfill';

browser.runtime.onMessage.addListener(
  async (message: unknown): Promise<any> => {
    const msg = message as { action: string };

    if (msg.action === 'fetchgithubUser') {
      try {
        const res = await fetch('https://api.github.com/users/octocat');
        const data = await res.json();
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }

    if (msg.action === 'fetchredditUser') {
      try {
        // Use a proxy for Reddit (for development only)
        const proxyUrl = 'https://corsproxy.io/?https://www.reddit.com/user/spez/about.json';
        const res = await fetch(proxyUrl);
        const data = await res.json();
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }

    return { success: false, error: 'Unknown action' };
  }
);
