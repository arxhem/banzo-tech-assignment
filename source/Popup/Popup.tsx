import * as React from 'react';
import browser from 'webextension-polyfill';

const Popup: React.FC = () => {
  const [result, setResult] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);

  const fetchUserData = async (platform: 'github' | 'reddit'): Promise<void> => {
    setLoading(true);
    setResult(null);
    try {
      const response: any = await browser.runtime.sendMessage({ action: `fetch${platform}User` });

      if (response && response.success) {
        setResult(JSON.stringify(response.data, null, 2));
      } else {
        setResult(`Error: ${response?.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setResult(`Unexpected Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ padding: '1rem', width: '300px' }}>
      <h2>WEB-EXTENSION-STARTER</h2>
      <button
        id="options__button"
        type="button"
        onClick={() => {
          browser.tabs.create({ url: '/Options/options.html' });
        }}
      >
        Open Options Page
      </button>

      <div style={{ marginTop: '1rem' }}>
        <button onClick={() => fetchUserData('github')}>Fetch GitHub User</button>
        <button style={{ marginLeft: '0.5rem' }} onClick={() => fetchUserData('reddit')}>
          Fetch Reddit User
        </button>
      </div>

      <div style={{ marginTop: '1rem', whiteSpace: 'pre-wrap', fontSize: '12px' }}>
        {loading ? 'Loading...' : result}
      </div>
    </section>
  );
};

export default Popup;
