/* ===== KEYGENE SHARE UTILITIES ===== */

/**
 * Generate a share card image from a DOM element
 * Requires html2canvas to be loaded on the page
 * @param {HTMLElement} el - element to capture
 * @param {string} filename - download filename
 * @param {Object} opts - html2canvas options override
 * @returns {Promise<HTMLCanvasElement>}
 */
function generateShareCard(el, filename, opts) {
  var defaults = {
    backgroundColor: '#0a0a0a',
    scale: 2,
    useCORS: true,
    logging: false
  };
  var options = {};
  var k;
  for (k in defaults) options[k] = defaults[k];
  if (opts) { for (k in opts) options[k] = opts[k]; }

  return html2canvas(el, options).then(function(canvas) {
    var link = document.createElement('a');
    link.download = filename || 'keygene-share.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    return canvas;
  });
}

/**
 * Copy text to clipboard with fallback
 * @param {string} text
 * @returns {Promise<boolean>}
 */
function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(function() { return true; });
  }
  // Fallback
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  var ok = false;
  try { ok = document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(ta);
  return Promise.resolve(ok);
}
