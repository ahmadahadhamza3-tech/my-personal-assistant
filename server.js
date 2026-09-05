const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// Serve static files from root directory
app.use(express.static(__dirname));

// YouTube Search API to retrieve direct playable video ID
app.get('/api/youtube-search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter q' });
  }

  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const html = await response.text();

    // Match first video ID
    const videoMatch = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
    const videoId = videoMatch ? videoMatch[1] : null;

    let title = null;
    const titleMatch = html.match(/"title":\{"runs":\[\{"text":"([^"]+)"/);
    if (titleMatch) {
      try {
        title = JSON.parse(`"${titleMatch[1]}"`);
      } catch (e) {
        title = titleMatch[1];
      }
    }

    if (videoId) {
      return res.json({
        success: true,
        videoId,
        title: title || query,
        watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`
      });
    } else {
      return res.json({
        success: false,
        query,
        watchUrl: searchUrl,
        embedUrl: `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}&autoplay=1`
      });
    }
  } catch (err) {
    console.error('YouTube search error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to search YouTube',
      watchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
