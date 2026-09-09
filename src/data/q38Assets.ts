/**
 * Asset Visual & Data Default untuk Soal No. 38 (Pengelompokan Tunai vs Non-Tunai)
 */

export const SVG_UANG_KERTAS_100K = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="100%" height="100%">
  <defs>
    <linearGradient id="bg_100k" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e11d48"/>
      <stop offset="50%" stop-color="#be123c"/>
      <stop offset="100%" stop-color="#881337"/>
    </linearGradient>
    <pattern id="guilloche" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="10" cy="10" r="8" fill="none" stroke="#fecdd3" stroke-width="0.5" stroke-opacity="0.25"/>
    </pattern>
  </defs>
  <rect width="400" height="200" rx="12" fill="url(#bg_100k)" stroke="#fda4af" stroke-width="2"/>
  <rect width="400" height="200" rx="12" fill="url(#guilloche)"/>
  <rect x="15" y="15" width="370" height="170" rx="8" fill="none" stroke="#ffe4e6" stroke-width="1.5" stroke-opacity="0.4"/>
  <text x="30" y="48" font-family="sans-serif" font-size="20" font-weight="900" fill="#fff">BANK INDONESIA</text>
  <text x="30" y="70" font-family="sans-serif" font-size="11" font-weight="700" fill="#fecdd3" letter-spacing="1">NEGARA KESATUAN REPUBLIK INDONESIA</text>
  <text x="30" y="160" font-family="sans-serif" font-size="38" font-weight="900" fill="#fff" letter-spacing="-1">100000</text>
  <text x="180" y="155" font-family="sans-serif" font-size="14" font-weight="700" fill="#ffe4e6">SERATUS RIBU RUPIAH</text>
  <circle cx="310" cy="95" r="45" fill="#9f1239" stroke="#fda4af" stroke-width="1.5"/>
  <circle cx="295" cy="85" r="16" fill="#fecdd3" opacity="0.8"/>
  <path d="M275,115 C275,100 315,100 315,115 Z" fill="#fecdd3" opacity="0.8"/>
  <circle cx="325" cy="90" r="14" fill="#ffe4e6" opacity="0.9"/>
  <path d="M308,120 C308,106 342,106 342,120 Z" fill="#ffe4e6" opacity="0.9"/>
  <rect x="235" y="15" width="12" height="170" fill="#facc15" opacity="0.75"/>
  <rect x="270" y="25" width="100" height="24" rx="6" fill="#1e293b" opacity="0.85"/>
  <text x="320" y="41" font-family="sans-serif" font-size="10" font-weight="900" fill="#fbbf24" text-anchor="middle">UANG KERTAS</text>
</svg>
`)}`;

export const SVG_KARTU_DEBIT_GPN = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
  <defs>
    <linearGradient id="bg_card_red" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#dc2626"/>
      <stop offset="100%" stop-color="#991b1b"/>
    </linearGradient>
    <linearGradient id="chip" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#ca8a04"/>
    </linearGradient>
  </defs>
  <rect x="25" y="15" width="350" height="210" rx="16" fill="url(#bg_card_red)" stroke="#f87171" stroke-width="2"/>
  <text x="50" y="52" font-family="sans-serif" font-size="18" font-weight="900" fill="#fff" letter-spacing="1">KARTU DEBIT</text>
  <text x="50" y="70" font-family="sans-serif" font-size="10" font-weight="600" fill="#fecaca">PASPOR / TABUNGAN BANK</text>
  <rect x="50" y="90" width="46" height="36" rx="6" fill="url(#chip)" stroke="#a16207" stroke-width="1.5"/>
  <path d="M50,108 L96,108 M73,90 L73,126" stroke="#854d0e" stroke-width="1.5"/>
  <path d="M110,100 A12,12 0 0,1 110,116 M116,95 A18,18 0 0,1 116,121 M122,90 A24,24 0 0,1 122,126" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
  <text x="50" y="160" font-family="monospace" font-size="16" font-weight="700" fill="#fff" letter-spacing="3">5326 •••• •••• 8892</text>
  <text x="50" y="195" font-family="sans-serif" font-size="12" font-weight="700" fill="#fef08a">NAMA NASABAH</text>
  <rect x="285" y="155" width="70" height="48" rx="8" fill="#ffffff" stroke="#ef4444" stroke-width="1.5"/>
  <path d="M300,165 L340,165 C345,165 345,178 335,178 L310,178 L310,195" fill="none" stroke="#dc2626" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="320" y="192" font-family="sans-serif" font-size="11" font-weight="900" fill="#b91c1c" text-anchor="middle">GPN</text>
</svg>
`)}`;

export const SVG_EWALLET_SERVER = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
  <rect width="400" height="240" rx="16" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
  <text x="30" y="42" font-family="sans-serif" font-size="16" font-weight="900" fill="#38bdf8">DOMPET DIGITAL (E-WALLET)</text>
  <text x="30" y="62" font-family="sans-serif" font-size="11" font-weight="500" fill="#94a3b8">Uang Elektronik Berbasis Server / Aplikasi Smartphone</text>
  <rect x="30" y="80" width="160" height="56" rx="10" fill="#00aed6"/>
  <text x="110" y="114" font-family="sans-serif" font-size="16" font-weight="900" fill="#fff" text-anchor="middle">GoPay</text>
  <rect x="210" y="80" width="160" height="56" rx="10" fill="#4c2a86"/>
  <text x="290" y="114" font-family="sans-serif" font-size="16" font-weight="900" fill="#fff" text-anchor="middle">OVO</text>
  <rect x="30" y="150" width="105" height="56" rx="10" fill="#118eea"/>
  <text x="82" y="184" font-family="sans-serif" font-size="14" font-weight="900" fill="#fff" text-anchor="middle">DANA</text>
  <rect x="147" y="150" width="105" height="56" rx="10" fill="#ee4d2d"/>
  <text x="200" y="184" font-family="sans-serif" font-size="13" font-weight="900" fill="#fff" text-anchor="middle">ShopeePay</text>
  <rect x="264" y="150" width="105" height="56" rx="10" fill="#dc2626"/>
  <text x="316" y="184" font-family="sans-serif" font-size="14" font-weight="900" fill="#fff" text-anchor="middle">QRIS</text>
</svg>
`)}`;

export const SVG_EMONEY_KARTU = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">
  <defs>
    <linearGradient id="card_flazz" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
    <linearGradient id="card_mandiri" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
  </defs>
  <rect width="400" height="240" rx="16" fill="#0f172a" stroke="#34d399" stroke-width="2"/>
  <text x="30" y="38" font-family="sans-serif" font-size="15" font-weight="900" fill="#34d399">UANG ELEKTRONIK BERBASIS KARTU</text>
  <text x="30" y="56" font-family="sans-serif" font-size="11" font-weight="500" fill="#94a3b8">Smartcard Uang Elektronik (Chip Tap &amp; Go)</text>
  <rect x="30" y="75" width="160" height="100" rx="10" fill="url(#card_mandiri)" stroke="#fde68a" stroke-width="1.5"/>
  <text x="45" y="105" font-family="sans-serif" font-size="14" font-weight="900" fill="#fff">e-money</text>
  <text x="45" y="125" font-family="sans-serif" font-size="10" font-weight="700" fill="#fef3c7">e-Toll Card</text>
  <path d="M150,95 A8,8 0 0,1 150,115 M155,90 A14,14 0 0,1 155,120" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
  <rect x="210" y="75" width="160" height="100" rx="10" fill="url(#card_flazz)" stroke="#93c5fd" stroke-width="1.5"/>
  <text x="225" y="105" font-family="sans-serif" font-size="16" font-weight="900" fill="#fff" font-style="italic">Flazz</text>
  <text x="225" y="125" font-family="sans-serif" font-size="10" font-weight="700" fill="#dbeafe">Tap &amp; Pay</text>
  <path d="M330,95 A8,8 0 0,1 330,115 M335,90 A14,14 0 0,1 335,120" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
  <rect x="30" y="188" width="160" height="36" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1"/>
  <text x="110" y="211" font-family="sans-serif" font-size="12" font-weight="800" fill="#38bdf8" text-anchor="middle">BRIZZI</text>
  <rect x="210" y="188" width="160" height="36" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1"/>
  <text x="290" y="211" font-family="sans-serif" font-size="12" font-weight="800" fill="#fb923c" text-anchor="middle">TapCash BNI</text>
</svg>
`)}`;

export const SVG_UANG_LOGAM_RUPIAH = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="100%" height="100%">
  <defs>
    <radialGradient id="silver_coin" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="60%" stop-color="#cbd5e1"/>
      <stop offset="100%" stop-color="#64748b"/>
    </radialGradient>
    <radialGradient id="gold_coin" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="60%" stop-color="#eab308"/>
      <stop offset="100%" stop-color="#854d0e"/>
    </radialGradient>
  </defs>
  <rect width="400" height="200" rx="12" fill="#0f172a" stroke="#cbd5e1" stroke-width="1.5"/>
  <circle cx="125" cy="100" r="70" fill="url(#silver_coin)" stroke="#475569" stroke-width="4"/>
  <circle cx="125" cy="100" r="60" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4,4"/>
  <text x="125" y="90" font-family="sans-serif" font-size="10" font-weight="900" fill="#334155" text-anchor="middle">BANK INDONESIA</text>
  <text x="125" y="122" font-family="sans-serif" font-size="28" font-weight="900" fill="#1e293b" text-anchor="middle">1000</text>
  <text x="125" y="140" font-family="sans-serif" font-size="10" font-weight="800" fill="#334155" text-anchor="middle">RUPIAH</text>
  <circle cx="275" cy="100" r="65" fill="url(#gold_coin)" stroke="#713f12" stroke-width="4"/>
  <circle cx="275" cy="100" r="55" fill="none" stroke="#ca8a04" stroke-width="2" stroke-dasharray="4,4"/>
  <text x="275" y="90" font-family="sans-serif" font-size="10" font-weight="900" fill="#713f12" text-anchor="middle">BANK INDONESIA</text>
  <text x="275" y="122" font-family="sans-serif" font-size="28" font-weight="900" fill="#451a03" text-anchor="middle">500</text>
  <text x="275" y="140" font-family="sans-serif" font-size="10" font-weight="800" fill="#713f12" text-anchor="middle">RUPIAH</text>
  <rect x="140" y="12" width="120" height="24" rx="6" fill="#1e293b" stroke="#64748b" stroke-width="1"/>
  <text x="200" y="28" font-family="sans-serif" font-size="11" font-weight="900" fill="#f8fafc" text-anchor="middle">UANG LOGAM</text>
</svg>
`)}`;

export function getDefaultQ38ItemImage(item: any): string {
  if (!item) return '';
  const id = String(item.id || '').toLowerCase();
  const text = String(item.text || item.label || '').toLowerCase();
  const fileName = String(item.imageFileName || '').toLowerCase();

  if (
    id.includes('item_1') ||
    fileName.includes('kertas') ||
    text.includes('kertas') ||
    text.includes('100.000') ||
    text.includes('100000')
  ) {
    return SVG_UANG_KERTAS_100K;
  }
  if (
    id.includes('item_2') ||
    fileName.includes('debit') ||
    text.includes('debit') ||
    text.includes('gpn')
  ) {
    return SVG_KARTU_DEBIT_GPN;
  }
  if (
    id.includes('item_3') ||
    fileName.includes('wallet') ||
    text.includes('dompet digital') ||
    text.includes('gopay') ||
    text.includes('ovo') ||
    text.includes('dana')
  ) {
    return SVG_EWALLET_SERVER;
  }
  if (
    id.includes('item_4') ||
    fileName.includes('flazz') ||
    fileName.includes('emoney') ||
    text.includes('flazz') ||
    text.includes('brizzi') ||
    text.includes('kartu elektronik')
  ) {
    return SVG_EMONEY_KARTU;
  }
  if (
    id.includes('item_5') ||
    fileName.includes('logam') ||
    text.includes('logam') ||
    text.includes('koin')
  ) {
    return SVG_UANG_LOGAM_RUPIAH;
  }

  return '';
}

