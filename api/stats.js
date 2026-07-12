// ─── Stats Endpoint ────────────────────────────────────────────
// Returns current evolution state from Vercel Blob.
// Called by the client on page load to download the server-trained brain.
// Requires env: BLOB_READ_WRITE_TOKEN

const { head } = require('@vercel/blob');
const BLOB_NAME = 'vortex-state.json';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const blob = await head(BLOB_NAME);
    if (!blob || !blob.url) {
      return res.status(200).json({
        generation: 0,
        bestScore: 0,
        totalGenerations: 0,
        weights: null,
        lastActive: null,
      });
    }

    const response = await fetch(blob.url);
    if (!response.ok) {
      throw new Error(`Blob fetch failed: ${response.status}`);
    }

    const state = await response.json();

    // Return full state including weights for client brain download
    res.status(200).json({
      generation: state.generation || 0,
      bestScore: state.bestScore || 0,
      totalGenerations: state.totalGenerations || 0,
      weights: state.weights || null,
      lastActive: state.lastActive || null,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(200).json({
      generation: 0,
      bestScore: 0,
      totalGenerations: 0,
      weights: null,
      lastActive: null,
    });
  }
};
