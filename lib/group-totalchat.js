const sharp = require('sharp');

async function generateLeaderboardImage(data = {}) {
  const WIDTH = 1000;
  const HEIGHT = 1120;

  const d = {
    totalMembers: data.totalMembers || 0,
    pernahChat: data.pernahChat || 0,
    belumChat: data.belumChat || 0,
    totalPesan: data.totalPesan || 0,
    membersScanned: data.membersScanned || 0,
    topMembers: data.topMembers || Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      phone: '-',
      username: '-',
      messageCount: 0
    }))
  };

  const percPernah = d.totalMembers > 0 ? Math.round((d.pernahChat / d.totalMembers) * 100) : 0;
  const percBelum = d.totalMembers > 0 ? Math.round((d.belumChat / d.totalMembers) * 100) : 0;
  const maxCount = Math.max(...d.topMembers.map(m => m.messageCount), 1);
  const maxBarWidth = 320;

  const barColors = ['#facc15', '#38bdf8', '#f472b6', '#4ade80', '#a78bfa', '#fb923c', '#60a5fa', '#fde047', '#f472b6', '#67e8f9'];
  const avatarColors = ['#f472b6', '#60a5fa', '#facc15', '#4ade80', '#c084fc', '#fb923c', '#38bdf8', '#a3e635', '#f472b6', '#22d3ee'];
  const skinTones = ['#ffdbac', '#f5d0c5', '#e8c39e', '#d4a574', '#c68642', '#8d5524', '#ffdbac', '#f5d0c5', '#e8c39e', '#d4a574'];

  function createAvatar(x, y, size, variant, color, skin) {
    const s = size;
    const r = s * 0.48;
    const expressions = ['M -6 4 Q 0 10 6 4','M -5 3 Q 0 8 5 3','M -6 5 Q 0 9 6 5','M -4 6 Q 0 4 4 6','M -5 4 Q 0 7 5 4','M -6 3 Q 0 9 6 3','M -5 5 Q 0 8 5 5','M -6 4 Q 0 11 6 4','M -4 4 Q 0 6 4 4','M -5 3 Q 0 10 5 3'];
    const mouth = expressions[variant % 10];
    const hairPaths = [`M ${-r*0.7} ${-r*0.3} Q 0 ${-r*1.1} ${r*0.7} ${-r*0.3}`,`M ${-r*0.8} ${-r*0.2} L 0 ${-r*1.0} L ${r*0.8} ${-r*0.2}`,`M ${-r*0.75} ${-r*0.25} Q 0 ${-r*0.95} ${r*0.75} ${-r*0.25}`,`M ${-r*0.65} ${-r*0.4} Q 0 ${-r*1.05} ${r*0.65} ${-r*0.4}`,`M ${-r*0.7} \( {-r*0.35} Q - \){r*0.2} ${-r*0.9} 0 ${-r*1.0} Q ${r*0.2} ${-r*0.9} ${r*0.7} ${-r*0.35}`];
    const hairPath = hairPaths[variant % 5];

    return `<g transform="translate(${x}, ${y})">
      <circle cx="\( {s/2 + 2}" cy=" \){s/2 + 3}" r="${r}" fill="#00000020"/>
      <circle cx="\( {s/2}" cy=" \){s/2}" r="\( {r}" fill=" \){color}"/>
      <circle cx="\( {s/2}" cy=" \){s/2 + 2}" r="\( {r * 0.82}" fill=" \){skin}"/>
      <path d="\( {hairPath}" fill=" \){color}" stroke="${color}" stroke-width="2"/>
      <circle cx="\( {s/2 - 7}" cy=" \){s/2 - 1}" r="2.5" fill="#1f2937"/>
      <circle cx="\( {s/2 + 7}" cy=" \){s/2 - 1}" r="2.5" fill="#1f2937"/>
      <circle cx="\( {s/2 - 6.2}" cy=" \){s/2 - 2}" r="1" fill="#fff"/>
      <circle cx="\( {s/2 + 7.8}" cy=" \){s/2 - 2}" r="1" fill="#fff"/>
      <path d="M ${s/2 - 6} ${s/2 + 8} ${mouth}" fill="none" stroke="#1f2937" stroke-width="1.8" stroke-linecap="round"/>
      \( {variant % 3 === 0 ? `<circle cx=" \){s/2 - 7}" cy="\( {s/2 - 1}" r="4.5" fill="none" stroke="#1f2937" stroke-width="1.5"/><circle cx=" \){s/2 + 7}" cy="\( {s/2 - 1}" r="4.5" fill="none" stroke="#1f2937" stroke-width="1.5"/><line x1=" \){s/2 - 2.5}" y1="\( {s/2 - 1}" x2=" \){s/2 + 2.5}" y2="${s/2 - 1}" stroke="#1f2937" stroke-width="1.5"/>` : ''}
    </g>`;
  }

  let svgContent = `<svg width="\( {WIDTH}" height=" \){HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="stripes" patternUnits="userSpaceOnUse" width="40" height="40" patternTransform="rotate(45)">
        <rect width="40" height="40" fill="#fdf2f8"/>
        <line x1="0" y1="20" x2="40" y2="20" stroke="#fce7f3" stroke-width="1.5"/>
      </pattern>
      <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#00000015"/>
      </filter>
    </defs>
    <rect width="\( {WIDTH}" height=" \){HEIGHT}" fill="#fdf2f8"/>
    <rect width="\( {WIDTH}" height=" \){HEIGHT}" fill="url(#stripes)"/>
    <rect x="8" y="8" width="\( {WIDTH-16}" height=" \){HEIGHT-16}" rx="20" ry="20" fill="none" stroke="#f9a8d4" stroke-width="14"/>
    <rect x="20" y="22" width="${WIDTH-40}" height="78" rx="16" ry="16" fill="#0f172a"/>
    <rect x="32" y="35" width="58" height="52" rx="8" ry="8" fill="#eab308"/>
    <text x="61" y="68" font-family="Arial Black" font-size="22" font-weight="900" fill="#0f172a" text-anchor="middle">TOP</text>
    <text x="105" y="62" font-family="Arial Black" font-size="28" font-weight="900" fill="#f1e7ff">CHAT LEADERBOARD</text>
    <rect x="${WIDTH-260}" y="38" width="220" height="46" rx="23" ry="23" fill="#1e2937"/>
    <text x="${WIDTH-150}" y="68" font-family="Arial" font-size="15" fill="#e0e7ff" text-anchor="middle">[ ${d.membersScanned} MEMBERS SCANNED ]</text>
    <g>
      <g filter="url(#cardShadow)">
        <rect x="25" y="115" width="225" height="105" rx="14" ry="14" fill="#fff"/>
        <rect x="25" y="115" width="225" height="32" rx="14" ry="14" fill="#3b82f6"/>
        <text x="40" y="138" font-family="Arial Black" font-size="13" fill="#fff">TOTAL MEMBER</text>
        <text x="40" y="175" font-family="Arial Black" font-size="32" fill="#1e2937">M ${d.totalMembers}</text>
        <circle cx="195" cy="155" r="22" fill="none" stroke="#e2e8f0" stroke-width="7"/>
        <circle cx="195" cy="155" r="22" fill="none" stroke="#3b82f6" stroke-width="7" stroke-dasharray="${2*Math.PI*22}" stroke-dashoffset="0" stroke-linecap="round" transform="rotate(-90 195 155)"/>
        <text x="195" y="160" font-family="Arial" font-size="11" fill="#1e2937" text-anchor="middle" font-weight="700">100%</text>
        <rect x="35" y="190" width="205" height="8" rx="4" fill="#3b82f6"/>
      </g>
      <g filter="url(#cardShadow)">
        <rect x="265" y="115" width="225" height="105" rx="14" ry="14" fill="#fff"/>
        <rect x="265" y="115" width="225" height="32" rx="14" ry="14" fill="#22c55e"/>
        <text x="280" y="138" font-family="Arial Black" font-size="13" fill="#fff">PERNAH CHAT</text>
        <text x="280" y="175" font-family="Arial Black" font-size="32" fill="#1e2937">C ${d.pernahChat}</text>
        <circle cx="435" cy="155" r="22" fill="none" stroke="#e2e8f0" stroke-width="7"/>
        <circle cx="435" cy="155" r="22" fill="none" stroke="#22c55e" stroke-width="7" stroke-dasharray="\( {2*Math.PI*22}" stroke-dashoffset=" \){2*Math.PI*22*(1-percPernah/100)}" stroke-linecap="round" transform="rotate(-90 435 155)"/>
        <text x="435" y="160" font-family="Arial" font-size="11" fill="#1e2937" text-anchor="middle" font-weight="700">${percPernah}%</text>
        <rect x="275" y="190" width="${205 * (percPernah/100)}" height="8" rx="4" fill="#22c55e"/>
      </g>
      <g filter="url(#cardShadow)">
        <rect x="505" y="115" width="225" height="105" rx="14" ry="14" fill="#fff"/>
        <rect x="505" y="115" width="225" height="32" rx="14" ry="14" fill="#ec4899"/>
        <text x="520" y="138" font-family="Arial Black" font-size="13" fill="#fff">BELUM CHAT</text>
        <text x="520" y="175" font-family="Arial Black" font-size="32" fill="#1e2937">X ${d.belumChat}</text>
        <circle cx="675" cy="155" r="22" fill="none" stroke="#e2e8f0" stroke-width="7"/>
        <circle cx="675" cy="155" r="22" fill="none" stroke="#ec4899" stroke-width="7" stroke-dasharray="\( {2*Math.PI*22}" stroke-dashoffset=" \){2*Math.PI*22*(1-percBelum/100)}" stroke-linecap="round" transform="rotate(-90 675 155)"/>
        <text x="675" y="160" font-family="Arial" font-size="11" fill="#1e2937" text-anchor="middle" font-weight="700">${percBelum}%</text>
        <rect x="515" y="190" width="${205 * (percBelum/100)}" height="8" rx="4" fill="#ec4899"/>
      </g>
      <g filter="url(#cardShadow)">
        <rect x="745" y="115" width="230" height="105" rx="14" ry="14" fill="#fff"/>
        <rect x="745" y="115" width="230" height="32" rx="14" ry="14" fill="#eab308"/>
        <text x="760" y="138" font-family="Arial Black" font-size="13" fill="#fff">TOTAL PESAN</text>
        <text x="760" y="175" font-family="Arial Black" font-size="26" fill="#1e2937">P ${d.totalPesan.toLocaleString('id-ID')}</text>
        <circle cx="920" cy="155" r="22" fill="none" stroke="#e2e8f0" stroke-width="7"/>
        <circle cx="920" cy="155" r="22" fill="none" stroke="#eab308" stroke-width="7" stroke-dasharray="${2*Math.PI*22}" stroke-dashoffset="0" stroke-linecap="round" transform="rotate(-90 920 155)"/>
        <text x="920" y="160" font-family="Arial" font-size="11" fill="#1e2937" text-anchor="middle" font-weight="700">100%</text>
        <rect x="755" y="190" width="210" height="8" rx="4" fill="#eab308"/>
      </g>
    </g>
    <rect x="20" y="235" width="${WIDTH-40}" height="820" rx="16" ry="16" fill="#fff" stroke="#f3e8ff" stroke-width="3"/>
    <rect x="25" y="242" width="${WIDTH-50}" height="42" rx="8" ry="8" fill="#0ea5e9"/>
    <text x="55" y="270" font-family="Arial Black" font-size="16" fill="#fff">#</text>
    <text x="95" y="270" font-family="Arial Black" font-size="16" fill="#fff">MEMBER NAME</text>
    <text x="620" y="270" font-family="Arial Black" font-size="16" fill="#fff">MESSAGE COUNT</text>`;

  const rowStartY = 290;
  const rowHeight = 58;
  const barStartX = 380;
  const nameX = 95;

  d.topMembers.forEach((member, i) => {
    const y = rowStartY + (i * rowHeight);
    const isEven = i % 2 === 0;
    const rowBg = isEven ? '#fefce8' : (i % 3 === 0 ? '#fce7f3' : '#f3e8ff');
    const barColor = barColors[i % barColors.length];
    const barWidth = Math.max(20, Math.round((member.messageCount / maxCount) * maxBarWidth));

    svgContent += `<rect x="28" y="\( {y-4}" width=" \){WIDTH-56}" height="\( {rowHeight-6}" rx="6" ry="6" fill=" \){rowBg}"/>
      <rect x="35" y="${y+8}" width="38" height="38" rx="8" ry="8" fill="#1e2937"/>
      <text x="54" y="\( {y+35}" font-family="Arial Black" font-size="16" fill="#f1e7ff" text-anchor="middle"> \){String(member.rank).padStart(2,'0')}</text>
      <text x="\( {nameX}" y=" \){y+22}" font-family="Arial" font-size="14" fill="#1e2937" font-weight="700">${member.phone}</text>
      <text x="\( {nameX}" y=" \){y+40}" font-family="Arial" font-size="12" fill="#64748b">${member.username}</text>
      <rect x="\( {barStartX}" y=" \){y+18}" width="${maxBarWidth}" height="18" rx="9" ry="9" fill="#e2e8f0"/>
      <rect x="\( {barStartX}" y=" \){y+18}" width="\( {barWidth}" height="18" rx="9" ry="9" fill=" \){barColor}"/>
      <text x="\( {barStartX + maxBarWidth + 25}" y=" \){y+34}" font-family="Arial Black" font-size="15" fill="#1e2937">${member.messageCount.toLocaleString('id-ID')}</text>`;
  });

  const avatarStartX = 820;
  const avatarStartY = 295;
  d.topMembers.forEach((member, i) => {
    const ax = avatarStartX;
    const ay = avatarStartY + (i * 55);
    svgContent += createAvatar(ax, ay, 42, i, avatarColors[i % avatarColors.length], skinTones[i % skinTones.length]);
  });

  svgContent += `<rect x="20" y="\( {HEIGHT-55}" width=" \){WIDTH-40}" height="42" rx="12" ry="12" fill="#0f172a"/>
    <text x="50" y="${HEIGHT-28}" font-family="Arial" font-size="12" fill="#64748b">POWERED BY TOTAL CHAT SYSTEM</text>
    <text x="\( {WIDTH-50}" y=" \){HEIGHT-28}" font-family="Arial" font-size="12" fill="#a5b4fc" text-anchor="end">// STAY ACTIVE, STAY ON TOP!</text>
    <circle cx="35" cy="${HEIGHT-35}" r="3" fill="#22c55e"/>
    <circle cx="45" cy="${HEIGHT-35}" r="3" fill="#eab308"/>
    <circle cx="55" cy="${HEIGHT-35}" r="3" fill="#ec4899"/>
  </svg>`;

  const imageBuffer = await sharp(Buffer.from(svgContent)).png().toBuffer();
  return imageBuffer;
}

module.exports = { generateLeaderboardImage };