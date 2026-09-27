import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import QRCode from 'qrcode';
import sharp from 'sharp';

// All QR codes and exports use the same contact data as the page.
const bundle = await build({ entryPoints: ['lib/business-card.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const { businessCard: card } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const dir = 'public/business-card';
await mkdir(dir, { recursive: true });
const logo = `data:image/png;base64,${(await readFile('public/brand/monogram.png')).toString('base64')}`;
const esc = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const qrOptions = { errorCorrectionLevel: 'M', margin: 4, color: { dark: '#11110f', light: '#ffffff' } };
const qr = await QRCode.toString(card.qrUrl, { ...qrOptions, type: 'svg' });
const whatsappQR = await QRCode.toString(card.whatsappUrl, { ...qrOptions, type: 'svg' });
const qrImage = (svg, x, y, size) => `<image x="${x}" y="${y}" width="${size}" height="${size}" href="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"/>`;
const defs = `<defs><pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse"><path d="M64 0H0V64" fill="none" stroke="#eeece5" stroke-opacity=".035" stroke-width="1"/></pattern><filter id="invert" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="table" tableValues="1 0"/><feFuncG type="table" tableValues="1 0"/><feFuncB type="table" tableValues="1 0"/></feComponentTransfer></filter></defs>`;
const wrap = (width, height, content) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${defs}<rect width="100%" height="100%" fill="#11110f"/><g font-family="Arial, Helvetica, sans-serif" fill="#eeece5">${content}</g></svg>`;
const background = `<rect x="2" y="2" width="1796" height="1026" rx="48" fill="#11110f" stroke="#30302a" stroke-width="4"/><rect x="45" y="45" width="1710" height="940" fill="url(#grid)"/>`;
const mark = (x, y, width, height) => `<image x="${x}" y="${y}" width="${width}" height="${height}" href="${logo}" filter="url(#invert)" style="mix-blend-mode:screen"/>`;
const front = wrap(1800, 1030, `${background}${mark(295, 238, 325, 400)}
  <text x="695" y="426" font-size="66" font-weight="700">REMARCABLE LIVING</text>
  <text x="697" y="490" font-size="28" fill="#a6a299">MARK YOUR PLACE.</text>
  <text x="697" y="559" font-size="57" fill="#c6a66a" font-style="italic">Find your space.</text>
  <path d="M1115 875v-36h36" fill="none" stroke="#c6a66a" stroke-width="5"/>
  <text x="1115" y="920" font-size="32" font-style="italic">13° 44′ 12.1812″ N 100° 31′ 23.4696″ E.</text>`);
const back = wrap(1800, 1030, `${background}
  <text x="130" y="284" font-size="69">${esc(card.name.toUpperCase())}</text>
  <text x="133" y="350" font-size="30" fill="#c6a66a">FOUNDER</text>
  <g fill="none" stroke="#d6d3ca" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M170 487l-10 10c-6 20 28 55 48 49l10-10-16-17-10 8c-7-3-13-10-16-17l9-8z"/>
    <rect x="155" y="610" width="53" height="38" rx="2"/><path d="M157 613l25 21 24-21m-49 33l17-17m31 17l-17-17"/>
  </g>
  <text x="227" y="531" font-size="36">${esc(card.phone)}</text>
  <text x="227" y="641" font-size="36">${esc(card.email)}</text>
  ${qrImage(whatsappQR, 1280, 220, 355)}
  <text x="1457" y="626" text-anchor="middle" font-size="26" fill="#b0ada4">WHATSAPP</text>
  <text x="1635" y="911" text-anchor="end" font-size="41" fill="#c6a66a" font-style="italic">${esc(card.website)}</text>`);
const phone = wrap(1290, 2796, `
  <rect x="68" y="350" width="1154" height="2070" rx="58" fill="url(#grid)" stroke="#35352d" stroke-width="3"/>
  ${mark(140, 446, 115, 140)}
  <text x="300" y="530" font-size="50" font-weight="700" letter-spacing="2">REMARCABLE LIVING</text>
  <text x="145" y="722" font-size="35" fill="#c6a66a" letter-spacing="7">FOUNDER</text>
  <text x="140" y="830" font-size="80">MARK</text>
  <text x="140" y="930" font-size="76">KUNTHWAKHUMLUE</text>
  ${qrImage(qr, 145, 1050, 1000)}
  <text x="645" y="2152" text-anchor="middle" font-size="46" letter-spacing="2">Scan to connect</text>
  <path d="M145 2230h1000" stroke="#393932" stroke-width="2"/>
  <text x="645" y="2332" text-anchor="middle" font-size="38" fill="#c6a66a" font-style="italic">Mark your place. Find your space.</text>`);

for (const [name, svg] of [['mark-front', front], ['mark-back', back], ['mark-iphone', phone]]) {
  await writeFile(`${dir}/${name}.svg`, svg);
  await sharp(Buffer.from(svg), { density: name === 'mark-iphone' ? 72 : 144 }).png().toFile(`${dir}/${name}.png`);
}
await writeFile(`${dir}/mark-qr.svg`, qr);
await QRCode.toFile(`${dir}/mark-qr.png`, card.qrUrl, { ...qrOptions, width: 1600 });
// Use the supplied brand mark as the Home Screen icon without changing the logo.
await sharp('public/brand/monogram.png').resize(180, 180, { fit: 'contain', background: '#ffffff' }).png().toFile(`${dir}/apple-touch-icon.png`);
await writeFile(`${dir}/manifest.webmanifest`, JSON.stringify({
  name: "Mark · REMARCABLE LIVING", short_name: "Mark's card", id: `${card.path}/qr`,
  start_url: `${card.path}/qr`, scope: `${card.path}/`, display: 'standalone',
  background_color: '#11110f', theme_color: '#11110f',
  icons: [{ src: '/business-card/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
}, null, 2));
console.log(`Generated business cards and iPhone image. QR destination: ${card.qrUrl}; WhatsApp: ${card.whatsappUrl}`);
