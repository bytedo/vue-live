//
const MIME_TYPES = {
  html: 'text/html;charset=utf-8',
  txt: 'text/plain;charset=utf-8',
  css: 'text/css;charset=utf-8',
  xml: 'text/xml;charset=utf-8',
  gif: 'image/gif',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  tiff: 'image/tiff',
  png: 'image/png',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  bmp: 'image/x-ms-bmp',
  js: 'application/javascript;charset=utf-8',
  json: 'application/json;charset=utf-8',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
  m4a: 'audio/x-m4a',
  mp4: 'video/mp4',
  webm: 'video/webm',
  ttf: 'font/font-ttf',
  woff: 'font/font-woff',
  woff2: 'font/font-woff2',
  other: 'application/octet-stream'
}

MIME_TYPES.vue = MIME_TYPES.js
MIME_TYPES.scss = MIME_TYPES.css
MIME_TYPES.htm = MIME_TYPES.html
MIME_TYPES.jpeg = MIME_TYPES.jpg
MIME_TYPES.tif = MIME_TYPES.tiff

export default MIME_TYPES
