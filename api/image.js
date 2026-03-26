module.exports = async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
  };

  try {
    // First try fetching as a direct image
    const response = await fetch(url, { headers, redirect: 'follow' });

    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.startsWith('image/')) {
        const buffer = Buffer.from(await response.arrayBuffer());
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(buffer);
      }
    }

    // If not a direct image, try to extract og:image from the page
    const pageResponse = await fetch(url, {
      headers: { ...headers, 'Accept': 'text/html' },
      redirect: 'follow',
    });

    if (!pageResponse.ok) {
      return res.status(404).json({ error: 'Could not fetch URL' });
    }

    const html = await pageResponse.text();
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

    if (!ogMatch) {
      return res.status(404).json({ error: 'No image found' });
    }

    let imageUrl = ogMatch[1];
    // Handle relative URLs
    if (imageUrl.startsWith('//')) {
      imageUrl = 'https:' + imageUrl;
    } else if (imageUrl.startsWith('/')) {
      imageUrl = new URL(url).origin + imageUrl;
    }

    const imgResponse = await fetch(imageUrl, { headers, redirect: 'follow' });
    if (!imgResponse.ok) {
      return res.status(404).json({ error: 'Image fetch failed' });
    }

    const imgContentType = imgResponse.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await imgResponse.arrayBuffer());
    res.setHeader('Content-Type', imgContentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (error) {
    console.error('Image proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
};

module.exports.config = {
  maxDuration: 15,
};
