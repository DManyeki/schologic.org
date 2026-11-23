import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const RAW_JSON_PATH = path.join(ROOT, 'public/assets/aistudio/institutions_dbd53042.json');
const MAP_PATHS_TS = path.join(ROOT, 'src/data/kenyaMapPaths.ts');
const OUT_FULL_PATH = path.join(ROOT, 'src/data/institutionsFull.json');
const OUT_CURATED_PATH = path.join(ROOT, 'src/data/institutionsCurated.json');
const OUT_PUBLIC_INDEX_PATH = path.join(ROOT, 'public/data/institutions-index.json');

// Parse KENYA_COUNTY_PATHS & KENYA_MAP_BOUNDS from src/data/kenyaMapPaths.ts
const mapTs = fs.readFileSync(MAP_PATHS_TS, 'utf8');
const pathsMatch = mapTs.match(/export const KENYA_COUNTY_PATHS[^=]*=\s*(\[[\s\S]*?\]);/);
if (!pathsMatch) throw new Error('Could not parse KENYA_COUNTY_PATHS');
const COUNTY_PATHS = JSON.parse(pathsMatch[1]);

const MAP_BOUNDS = {
  minLon: 33.91089392948316,
  maxLat: 5.411669175320751,
  scale: 66.58212264562906,
  offsetX: 33.809680305487575,
  offsetY: 20,
};

function projectLatLng(lat, lng) {
  return {
    x: Number((MAP_BOUNDS.offsetX + (lng - MAP_BOUNDS.minLon) * MAP_BOUNDS.scale).toFixed(1)),
    y: Number((MAP_BOUNDS.offsetY + (MAP_BOUNDS.maxLat - lat) * MAP_BOUNDS.scale).toFixed(1)),
  };
}

// Parse SVG polygon paths into vertex rings for point-in-polygon checks & bounding boxes
function parseSvgPolygons(d) {
  const rings = [];
  const subpaths = d.split(/Z/i).map((s) => s.trim()).filter(Boolean);
  for (const sp of subpaths) {
    const coords = [];
    const tokens = sp.replace(/^[ML]/i, '').split(/[ML]/i);
    for (const tok of tokens) {
      const parts = tok.trim().split(/[\s,]+/);
      if (parts.length >= 2) {
        const x = Number(parts[0]);
        const y = Number(parts[1]);
        if (Number.isFinite(x) && Number.isFinite(y)) coords.push([x, y]);
      }
    }
    if (coords.length >= 3) rings.push(coords);
  }
  return rings;
}

function pointInRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInCounty(x, y, rings) {
  return rings.some((ring) => pointInRing(x, y, ring));
}

const countyMeta = new Map();
for (const c of COUNTY_PATHS) {
  const rings = parseSvgPolygons(c.d);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const ring of rings) {
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  countyMeta.set(c.county, {
    county: c.county,
    cx: c.cx,
    cy: c.cy,
    rings,
    bbox: { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY },
  });
}

// Major Kenyan town/campus coordinates for accurate pin placement
const TOWN_COORDS = {
  nairobi: [-1.2864, 36.8172],
  westlands: [-1.2673, 36.811],
  kasarani: [-1.2219, 36.8965],
  karen: [-1.3192, 36.706],
  langata: [-1.3514, 36.7536],
  embakasi: [-1.3204, 36.9016],
  donholm: [-1.2981, 36.8855],
  kahawa: [-1.1806, 36.9345],
  ruiru: [-1.1489, 36.9605],
  thika: [-1.0332, 37.0693],
  juja: [-1.1026, 37.0132],
  kiambu: [-1.1714, 36.8356],
  kikuyu: [-1.2469, 36.6634],
  limuru: [-1.1069, 36.6426],
  gatundu: [-1.0156, 36.9061],
  mombasa: [-4.0435, 39.6682],
  nyali: [-4.0355, 39.7087],
  likoni: [-4.0846, 39.6619],
  kilifi: [-3.6305, 39.8499],
  malindi: [-3.2192, 40.1169],
  watamu: [-3.3547, 40.0221],
  kwale: [-4.1737, 39.4521],
  ukunda: [-4.2875, 39.5661],
  voi: [-3.3961, 38.5561],
  wundanyi: [-3.3983, 38.3603],
  taveta: [-3.3988, 37.6834],
  lamu: [-2.2717, 40.902],
  hola: [-1.4998, 40.0331],
  garissa: [-0.4532, 39.646],
  wajir: [1.7471, 40.0573],
  mandera: [3.9373, 41.8569],
  marsabit: [2.3347, 37.9909],
  isiolo: [0.3546, 37.5822],
  meru: [0.0463, 37.6559],
  maua: [0.2333, 37.9333],
  chuka: [-0.3332, 37.6459],
  embu: [-0.5311, 37.4506],
  kitui: [-1.367, 38.0106],
  mwingi: [-0.9344, 38.0596],
  machakos: [-1.5177, 37.2634],
  'athi river': [-1.4563, 36.9783],
  kangundo: [-1.2981, 37.3469],
  wote: [-1.7808, 37.6288],
  nyeri: [-0.4169, 36.951],
  karatina: [-0.4833, 37.1333],
  othaya: [-0.5567, 36.9547],
  kerugoya: [-0.4989, 37.2803],
  kutus: [-0.5698, 37.326],
  "murang'a": [-0.721, 37.1526],
  muranga: [-0.721, 37.1526],
  kenol: [-0.9462, 37.1257],
  'ol kalou': [-0.267, 36.3788],
  nanyuki: [0.0062, 37.072],
  nyahururu: [0.0369, 36.3645],
  nakuru: [-0.3031, 36.08],
  naivasha: [-0.7172, 36.431],
  njoro: [-0.3333, 35.9333],
  gilgil: [-0.4992, 36.3183],
  molo: [-0.2485, 35.7319],
  eldoret: [0.5143, 35.2698],
  kesses: [0.2856, 35.2917],
  iten: [0.6732, 35.5082],
  kabarnet: [0.4919, 35.743],
  eldama: [0.0493, 35.7243],
  kapsabet: [0.2039, 35.105],
  nandi: [0.1833, 35.1833],
  kitale: [1.0157, 35.0062],
  kapenguria: [1.2389, 35.1119],
  lodwar: [3.1191, 35.5973],
  kakuma: [3.7119, 34.8628],
  maralal: [1.0968, 36.698],
  kericho: [-0.3677, 35.2831],
  sotik: [-0.6799, 35.1114],
  bomet: [-0.7813, 35.3416],
  narok: [-1.0808, 35.8711],
  kilgoris: [-1.0044, 34.8736],
  kajiado: [-1.8524, 36.7768],
  ongata: [-1.3965, 36.7575],
  rongai: [-1.3965, 36.7575],
  ngong: [-1.3618, 36.6565],
  kitengela: [-1.4744, 36.9609],
  kakamega: [0.2827, 34.7519],
  mumias: [0.3347, 34.4879],
  vihiga: [0.0833, 34.7167],
  mbale: [0.0825, 34.7219],
  bungoma: [0.5635, 34.5606],
  webuye: [0.6167, 34.7667],
  busia: [0.4608, 34.1115],
  siaya: [0.0607, 34.2881],
  bondo: [0.2367, 34.2806],
  kisumu: [-0.0917, 34.768],
  maseno: [-0.0056, 34.5992],
  ahero: [-0.1753, 34.9189],
  'homa bay': [-0.5273, 34.4571],
  mbita: [-0.4227, 34.2054],
  migori: [-1.0634, 34.4731],
  awendo: [-0.9031, 34.5297],
  rongo: [-0.7611, 34.5989],
  kisii: [-0.6817, 34.7667],
  nyamira: [-0.5633, 34.9358],
};

function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function normalizeCounty(rawCounty, rawRegion) {
  if (!rawCounty) return 'Nairobi';
  let c = rawCounty.replace(/\s+County$/i, '').trim();
  if (/^Elgeyo[\s-]*Marakwet$/i.test(c)) return 'Elgeyo-Marakwet';
  if (/^Taita[\s-]*Taveta$/i.test(c)) return 'Taita-Taveta';
  if (/^Tharaka[\s-]*Nithi$/i.test(c)) return 'Tharaka-Nithi';
  if (/^Murang['’]?a$/i.test(c)) return "Murang'a";
  if (/^Trans[\s-]*Nzoia$/i.test(c)) return 'Trans Nzoia';
  if (/^Homa[\s-]*Bay$/i.test(c)) return 'Homa Bay';
  if (/^Uasin[\s-]*Gishu$/i.test(c)) return 'Uasin Gishu';
  if (/^West[\s-]*Pokot$/i.test(c)) return 'West Pokot';
  if (/^Tana[\s-]*River$/i.test(c)) return 'Tana River';
  if (countyMeta.has(c)) return c;
  // fuzzy fallback
  for (const key of countyMeta.keys()) {
    if (key.toLowerCase() === c.toLowerCase()) return key;
  }
  return c;
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractGoogleMapsUrl(row) {
  const str = JSON.stringify({
    geo: row.geo,
    sources: row.sources,
    basic_info_sources: row.research_data?.basic_info?.sources,
    other_sources: row.other_sources,
  });
  const matches = str.match(
    /https?:\/\/(?:www\.)?(?:google\.com\/maps|maps\.google\.com|maps\.app\.goo\.gl|goo\.gl\/maps)[^"\\,\s\]\}]+/gi
  );
  if (matches && matches.length > 0) {
    // Prefer maps.google.com/?cid=... or google.com/maps/place or search
    let best = matches[0];
    for (const u of matches) {
      if (/cid=\d+/.test(u) || /\/place\//.test(u)) {
        best = u;
        break;
      }
    }
    // Strip noisy g_mp parameter if cid= is present
    if (best.includes('cid=')) {
      const cidMatch = best.match(/cid=(\d+)/);
      if (cidMatch) {
        return { url: `https://maps.google.com/?cid=${cidMatch[1]}`, verified: true };
      }
    }
    return { url: best, verified: true };
  }
  const queryParts = [row.name, row.town, row.county, 'Kenya'].filter(Boolean).join(', ');
  return {
    url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryParts)}`,
    verified: false,
  };
}

function extractCoords(row, county, mapsUrl) {
  // 1. Explicit geo.latitude/longitude
  if (row.geo && typeof row.geo === 'object') {
    const lat = Number(row.geo.latitude ?? row.geo.lat);
    const lng = Number(row.geo.longitude ?? row.geo.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat > -5.5 && lat < 5.6 && lng > 33.5 && lng < 42.5) {
      const pt = projectLatLng(lat, lng);
      return { lat, lng, x: pt.x, y: pt.y, isExact: true };
    }
  }
  // 2. Query coords in maps URL
  const qm = mapsUrl.match(/query=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qm) {
    const lat = Number(qm[1]);
    const lng = Number(qm[2]);
    if (lat > -5.5 && lat < 5.6 && lng > 33.5 && lng < 42.5) {
      const pt = projectLatLng(lat, lng);
      return { lat, lng, x: pt.x, y: pt.y, isExact: true };
    }
  }

  // 3. Match known town/suburb inside county
  const meta = countyMeta.get(county);
  const seed = hashStr(row.id || row.name);
  const townBlob = `${row.town || ''} ${row.location || ''} ${row.name || ''}`.toLowerCase();
  for (const [townKey, [tLat, tLng]] of Object.entries(TOWN_COORDS)) {
    if (townBlob.includes(townKey)) {
      const pt = projectLatLng(tLat, tLng);
      if (!meta || pointInCounty(pt.x, pt.y, meta.rings)) {
        // tiny deterministic jitter so pins in same town don't sit on exact same pixel
        const angle = (seed % 360) * (Math.PI / 180);
        const rad = 1.2 + ((seed >> 8) % 25) * 0.14;
        const jx = Number((pt.x + Math.cos(angle) * rad).toFixed(1));
        const jy = Number((pt.y + Math.sin(angle) * rad).toFixed(1));
        if (!meta || pointInCounty(jx, jy, meta.rings)) {
          return { lat: tLat, lng: tLng, x: jx, y: jy, isExact: false };
        }
        return { lat: tLat, lng: tLng, x: pt.x, y: pt.y, isExact: false };
      }
    }
  }

  // 4. Deterministic placement inside county polygon around centroid
  if (meta) {
    const { cx, cy, bbox, rings } = meta;
    const maxSpread = Math.min(bbox.w, bbox.h) * 0.38;
    for (let attempt = 0; attempt < 24; attempt++) {
      const s = hashStr(`${row.id}-${attempt}`);
      const angle = (s % 360) * (Math.PI / 180);
      const frac = (((s >> 9) % 100) / 100) * maxSpread;
      const px = Number((cx + Math.cos(angle) * frac).toFixed(1));
      const py = Number((cy + Math.sin(angle) * frac).toFixed(1));
      if (pointInCounty(px, py, rings)) {
        return { lat: null, lng: null, x: px, y: py, isExact: false };
      }
    }
    return { lat: null, lng: null, x: Number(cx.toFixed(1)), y: Number(cy.toFixed(1)), isExact: false };
  }

  return { lat: -1.2864, lng: 36.8172, x: 234.1, y: 465.0, isExact: false };
}

function normalizeCourse(c) {
  if (!c) return null;
  if (typeof c === 'string') {
    return { code: 'PROG', title: c.trim(), level: 'Certificate', duration: '—', modality: 'Full-Time', exam_body: 'KNEC / Internal' };
  }
  if (typeof c === 'object') {
    const title = String(c.name || c.title || '').trim();
    if (!title) return null;
    const rawLevel = String(c.level || 'Certificate');
    let level = 'Certificate';
    if (/doc|phd/i.test(rawLevel)) level = 'Doctorate';
    else if (/master/i.test(rawLevel)) level = 'Masters';
    else if (/bachelor|degree/i.test(rawLevel)) level = 'Bachelors';
    else if (/higher\s*dip/i.test(rawLevel)) level = 'Higher Diploma';
    else if (/diploma/i.test(rawLevel)) level = 'Diploma';
    else if (/artisan|trade/i.test(rawLevel)) level = 'Artisan';
    else if (/cert/i.test(rawLevel)) level = 'Certificate';

    const examBody = c.exam_body ? String(c.exam_body) : undefined;
    const code = examBody ? examBody.toUpperCase().slice(0, 12) : level.slice(0, 4).toUpperCase();
    return {
      code,
      title,
      level,
      duration: level === 'Bachelors' ? '4 Years' : level === 'Diploma' ? '2–3 Years' : level === 'Masters' ? '2 Years' : '1–2 Years',
      modality: 'Full-Time',
      exam_body: examBody,
    };
  }
  return null;
}

function parseModality(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return { status: 'none', notes: '' };
  const flag = String(arr[0]).toLowerCase();
  const notes = arr[1] ? String(arr[1]) : '';
  if (flag === 'verified' || flag === 'true') return { status: 'verified', notes };
  if (flag === 'implied') return { status: 'implied', notes };
  return { status: 'none', notes };
}

function extractRegNumber(accreditations, sources) {
  const text = `${(accreditations || []).join(' ')} ${JSON.stringify(sources || {})}`;
  const m = text.match(/(?:TVETA|CUE|KMTC)\/[A-Z0-9\/-]{4,}/i);
  return m ? m[0].toUpperCase() : null;
}

const PORTAL_OVERRIDES = {
  'kenyatta-university': 'ku.schologic.org',
  'jomo-kenyatta-university-of-agriculture-and-technology': 'jkuat.schologic.org',
  'moi-university': 'moi.schologic.org',
  'egerton-university': 'egerton.schologic.org',
  'dedan-kimathi-university-of-technology': 'dekut.schologic.org',
  'technical-university-of-kenya': 'tuk.schologic.org',
  'maseno-university': 'maseno.schologic.org',
  'mount-kenya-university': 'mku.schologic.org',
  'the-eldoret-national-polytechnic': 'tenp.schologic.org',
  'the-kenya-coast-national-polytechnic': 'kcnp.schologic.org',
  'nairobi-national-polytechnic': 'nairobinp.schologic.org',
  'kabete-national-polytechnic': 'kabete.schologic.org',
  'kisumu-national-polytechnic': 'kismupoly.schologic.org',
  'kmtc-nairobi-campus': 'kmtc.schologic.org',
};

function computeRankingScores(rec) {
  const courses = rec.courses || [];
  const levels = new Set(courses.map((c) => c.level));

  // 1. Registry & Verification Standing (0-100)
  const verBonus = rec.verification_status === 'verified' ? 35 : rec.verification_status === 'flagged' ? 14 : 6;
  const hScore = Number(rec.health_score) || 20;
  const rScore = Number(rec.research_score) || 0;
  const accredBonus = Math.min(20, (rec.accreditations?.length || 0) * 6);
  const registry_standing = Math.min(
    100,
    Math.round(verBonus * 0.4 + hScore * 0.35 + rScore * 0.25 + accredBonus * 0.45)
  );

  // 2. Curriculum & Programme Depth (0-100)
  const courseScore = Math.min(65, Math.round(Math.sqrt(courses.length) * 9.2));
  const tierScore = Math.min(35, levels.size * 7 + (levels.has('Doctorate') ? 6 : 0) + (levels.has('Bachelors') ? 4 : 0));
  const curriculum_depth = courses.length === 0 ? 12 : Math.min(100, courseScore + tierScore);

  // 3. Digital & ODeL Readiness (0-100)
  let digital = 10;
  if (rec.website) digital += 22;
  if (rec.elearning_status === 'verified') digital += 34;
  else if (rec.elearning_status === 'implied') digital += 18;
  if (rec.distance_status === 'verified') digital += 20;
  else if (rec.distance_status === 'implied') digital += 10;
  if (rec.portal_subdomain || rec.custom_portal_domain) digital += 14;
  if (rec.logo_url) digital += 4;
  const digital_readiness = Math.min(100, digital);

  // 4. Facilities & Campus Footprint (0-100)
  const facCount = rec.facilities?.length || 0;
  const campCount = Math.max(1, rec.campuses?.length || 0);
  const affCount = rec.affiliation?.length || 0;
  const facilities_footprint = Math.min(
    100,
    Math.round(14 + Math.min(54, facCount * 9) + Math.min(22, (campCount - 1) * 7 + 6) + Math.min(10, affCount * 5))
  );

  // 5. Practicum & Clinical Alignment (0-100)
  let prac = 18;
  if (rec.teaching_enabled) prac += 28;
  if (rec.type === 'kmtc') prac += 48;
  else if (rec.type === 'tvet') prac += rec.category === 'NP' ? 42 : 34;
  else prac += 16;
  const hasPracCourse = courses.some((c) => /clinical|nursing|engineering|practicum|education|automotive|electrical|hospitality/i.test(c.title));
  if (hasPracCourse) prac += 14;
  const practicum_alignment = Math.min(100, prac);

  const composite = Math.round(
    registry_standing * 0.24 +
    curriculum_depth * 0.24 +
    digital_readiness * 0.20 +
    facilities_footprint * 0.16 +
    practicum_alignment * 0.16
  );

  return {
    registry_standing,
    curriculum_depth,
    digital_readiness,
    facilities_footprint,
    practicum_alignment,
    composite,
  };
}

// Load raw JSON
const raw = JSON.parse(fs.readFileSync(RAW_JSON_PATH, 'utf8'));
const activeRaw = raw.filter((r) => r.operational_status === 'active' && !r.duplicate_of);

// Sort richest records first so slug allocation prefers higher-quality duplicate names
activeRaw.sort((a, b) => {
  const scoreA = (a.verification_status === 'verified' ? 100 : 0) + (Number(a.health_score) || 0) + (a.courses?.length || 0);
  const scoreB = (b.verification_status === 'verified' ? 100 : 0) + (Number(b.health_score) || 0) + (b.courses?.length || 0);
  return scoreB - scoreA;
});

const usedSlugs = new Set();
const seenNameCounty = new Map();
const fullRecords = [];
const indexRecords = [];

for (const row of activeRaw) {
  const name = String(row.name || '').trim();
  if (!name) continue;
  const county = normalizeCounty(row.county, row.region);
  const dedupKey = `${name.toLowerCase()}::${county.toLowerCase()}`;
  // Skip exact same name+county duplicate rows (e.g. duplicate Moi University entry)
  if (seenNameCounty.has(dedupKey)) continue;
  seenNameCounty.set(dedupKey, true);

  let baseSlug = slugify(name) || `inst-${row.id.slice(0, 8)}`;
  let slug = baseSlug;
  if (usedSlugs.has(slug)) {
    const countySuffix = slugify(county);
    slug = countySuffix ? `${baseSlug}-${countySuffix}` : `${baseSlug}-${row.id.slice(0, 6)}`;
    if (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${row.id.slice(0, 6)}`;
    }
  }
  usedSlugs.add(slug);

  const rawType = String(row.type || 'TVET').toUpperCase();
  const type = rawType === 'UNIVERSITY' ? 'university' : rawType === 'KMTC' ? 'kmtc' : 'tvet';
  const category = row.category && ['NP', 'TVC', 'VTC'].includes(String(row.category).toUpperCase())
    ? String(row.category).toUpperCase()
    : null;
  const ownership = String(row.ownership || 'public').toLowerCase() === 'private' ? 'private' : 'public';
  const region = String(row.region || 'Kenya').trim();
  const town = String(row.town || county).trim();
  const location = String(row.location || `${town}, ${county} County`).trim();

  const mapsInfo = extractGoogleMapsUrl(row);
  const coords = extractCoords(row, county, mapsInfo.url);

  const courses = Array.isArray(row.courses)
    ? row.courses.map(normalizeCourse).filter(Boolean)
    : [];

  const facilities = Array.isArray(row.facilities)
    ? row.facilities.map((f) => String(f).trim()).filter(Boolean)
    : [];

  const accreditations = Array.isArray(row.accreditations)
    ? row.accreditations.map((a) => String(a).trim()).filter(Boolean)
    : [];

  const campuses = Array.isArray(row.campuses) && row.campuses.length > 0
    ? row.campuses.map((c, idx) =>
        typeof c === 'string'
          ? { name: c, town, county, is_main: idx === 0 }
          : { name: c.name || `${name} Campus`, town: c.town || town, county: normalizeCounty(c.county || county), is_main: Boolean(c.is_main || idx === 0) }
      )
    : [{ name: `${name} — Main Campus`, town, county, is_main: true }];

  const affiliation = Array.isArray(row.affiliation)
    ? row.affiliation.map((a) =>
        typeof a === 'string'
          ? { body: a, role: 'Affiliated / Accredited Body' }
          : { body: String(a.body || ''), role: String(a.role || 'Member') }
      ).filter((a) => a.body)
    : [];

  const social_media = Array.isArray(row.social_media)
    ? row.social_media
        .map((s) => {
          if (typeof s === 'string' && s.startsWith('http')) {
            const platform = /twitter|x\.com/i.test(s) ? 'X' : /linkedin/i.test(s) ? 'LinkedIn' : /facebook/i.test(s) ? 'Facebook' : /youtube/i.test(s) ? 'YouTube' : 'Instagram';
            return { platform, handle: name, url: s };
          }
          if (s && typeof s === 'object' && s.url) {
            return { platform: s.platform || 'X', handle: s.handle || name, url: s.url };
          }
          return null;
        })
        .filter(Boolean)
    : [];

  const eInfo = parseModality(row.has_elearning);
  const dInfo = parseModality(row.has_distance_learning);
  const tInfo = parseModality(row.has_teaching_courses);

  const verification_status =
    row.verification_status === 'verified'
      ? 'verified'
      : row.verification_status === 'flagged'
        ? 'flagged'
        : 'unverified';

  const portal_subdomain = PORTAL_OVERRIDES[slug] ?? null;
  const regNo = extractRegNumber(accreditations, row.sources);

  const estimated_student_count =
    Number(row.estimated_student_count) > 0
      ? Number(row.estimated_student_count)
      : type === 'university'
        ? ownership === 'public' ? 14500 : 4800
        : type === 'kmtc'
          ? 1250
          : category === 'NP'
            ? 6800
            : category === 'TVC'
              ? 1450
              : 420;

  const shortDesc =
    String(row.description || row.about || '').trim() ||
    `${name} is a ${ownership} ${type === 'university' ? 'university' : type === 'kmtc' ? 'Kenya Medical Training College campus' : category === 'NP' ? 'National Polytechnic' : 'technical and vocational college'} located in ${town}, ${county} County (${region} Region).`;

  const aboutText = String(row.about || row.description || shortDesc).trim();

  const ranking_scores = computeRankingScores({
    verification_status,
    health_score: row.health_score,
    research_score: row.research_score,
    accreditations,
    courses,
    website: row.website,
    elearning_status: eInfo.status,
    distance_status: dInfo.status,
    portal_subdomain,
    custom_portal_domain: null,
    logo_url: row.logo_url,
    facilities,
    campuses,
    affiliation,
    teaching_enabled: tInfo.status === 'verified',
    type,
    category,
  });

  const fullRec = {
    id: row.id,
    slug,
    portal_subdomain,
    custom_portal_domain: null,
    name,
    aliases: [],
    registration_number: regNo,
    type,
    category,
    ownership,
    county,
    region,
    town,
    location,
    geo: coords.lat && coords.lng ? { lat: coords.lat, lng: coords.lng, place_name: name } : null,
    map_x: coords.x,
    map_y: coords.y,
    has_exact_geo: coords.isExact,
    google_maps_url: mapsInfo.url,
    has_verified_maps_url: mapsInfo.verified,
    website: row.website || null,
    email: row.email || null,
    phone: row.phone || null,
    logo_url: row.logo_url || null,
    description: shortDesc.slice(0, 420),
    about: aboutText,
    founded_year: null,
    charter_year: null,
    faculty_student_ratio: null,
    estimated_student_count,
    flagship_disciplines: courses.slice(0, 4).map((c) => c.title),
    facilities,
    accreditations,
    courses: courses.slice(0, 60),
    total_courses_count: courses.length,
    campuses,
    affiliation,
    elearning_status: eInfo.status,
    elearning_notes: eInfo.notes,
    distance_status: dInfo.status,
    distance_notes: dInfo.notes,
    teaching_enabled: tInfo.status === 'verified',
    teaching_notes: tInfo.notes,
    social_media,
    is_verified: verification_status === 'verified',
    verification_status,
    research_score: Number(row.research_score) || 0,
    health_score: Number(row.health_score) || 0,
    ranking_scores,
  };

  fullRecords.push(fullRec);

  indexRecords.push({
    id: fullRec.id,
    slug: fullRec.slug,
    name: fullRec.name,
    type: fullRec.type,
    category: fullRec.category,
    ownership: fullRec.ownership,
    county: fullRec.county,
    region: fullRec.region,
    town: fullRec.town,
    location: fullRec.location.slice(0, 140),
    logo_url: fullRec.logo_url,
    website: fullRec.website,
    portal_subdomain: fullRec.portal_subdomain,
    google_maps_url: fullRec.google_maps_url,
    has_verified_maps_url: fullRec.has_verified_maps_url,
    map_x: fullRec.map_x,
    map_y: fullRec.map_y,
    has_exact_geo: fullRec.has_exact_geo,
    registration_number: fullRec.registration_number,
    estimated_student_count: fullRec.estimated_student_count,
    course_count: fullRec.total_courses_count,
    facility_count: fullRec.facilities.length,
    accreditation_count: fullRec.accreditations.length,
    campus_count: fullRec.campuses.length,
    elearning_status: fullRec.elearning_status,
    distance_status: fullRec.distance_status,
    teaching_enabled: fullRec.teaching_enabled,
    is_verified: fullRec.is_verified,
    verification_status: fullRec.verification_status,
    research_score: fullRec.research_score,
    health_score: fullRec.health_score,
    ranking_scores: fullRec.ranking_scores,
    description: shortDesc.slice(0, 180),
    disciplines: fullRec.flagship_disciplines.slice(0, 3),
  });
}

// Sort index by composite score desc so top institutions come first
indexRecords.sort((a, b) => b.ranking_scores.composite - a.ranking_scores.composite);
fullRecords.sort((a, b) => b.ranking_scores.composite - a.ranking_scores.composite);

fs.mkdirSync(path.dirname(OUT_FULL_PATH), { recursive: true });
fs.mkdirSync(path.dirname(OUT_PUBLIC_INDEX_PATH), { recursive: true });

fs.writeFileSync(OUT_FULL_PATH, JSON.stringify(fullRecords));
fs.writeFileSync(OUT_CURATED_PATH, JSON.stringify(indexRecords.slice(0, 48)));
fs.writeFileSync(OUT_PUBLIC_INDEX_PATH, JSON.stringify(indexRecords));

console.log('Generated institutionsFull.json:', fullRecords.length, 'records,', (fs.statSync(OUT_FULL_PATH).size / 1024 / 1024).toFixed(2), 'MB');
console.log('Generated institutions-index.json:', indexRecords.length, 'records,', (fs.statSync(OUT_PUBLIC_INDEX_PATH).size / 1024).toFixed(1), 'KB');
console.log('Generated institutionsCurated.json:', 48, 'records,', (fs.statSync(OUT_CURATED_PATH).size / 1024).toFixed(1), 'KB');
console.log('Top 10 by composite score:', indexRecords.slice(0, 10).map(r => `${r.name} (${r.type}${r.category ? '/'+r.category : ''}, ${r.county}): ${r.ranking_scores.composite}`));
