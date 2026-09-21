import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public/protein');
const STRUCTURES = join(OUT, 'structures');
const VENDOR = join(ROOT, 'public/protein/vendor/3dmol-2.5.5');
const PUBCHEM = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound';

const AMINO_ACIDS = [
  ['alanine', 'Alanine', 'Ala', 'A', 'L-alanine', 5950, 'C3H7NO2'],
  ['arginine', 'Arginine', 'Arg', 'R', 'L-arginine', 6322, 'C6H14N4O2'],
  ['asparagine', 'Asparagine', 'Asn', 'N', 'L-asparagine', 6267, 'C4H8N2O3'],
  ['aspartic-acid', 'Aspartic acid', 'Asp', 'D', 'L-aspartic acid', 5960, 'C4H7NO4'],
  ['cysteine', 'Cysteine', 'Cys', 'C', 'L-cysteine', 5862, 'C3H7NO2S'],
  ['glutamine', 'Glutamine', 'Gln', 'Q', 'L-glutamine', 5961, 'C5H10N2O3'],
  ['glutamic-acid', 'Glutamic acid', 'Glu', 'E', 'L-glutamic acid', 33032, 'C5H9NO4'],
  ['glycine', 'Glycine', 'Gly', 'G', 'glycine', 750, 'C2H5NO2'],
  ['histidine', 'Histidine', 'His', 'H', 'L-histidine', 6274, 'C6H9N3O2'],
  ['isoleucine', 'Isoleucine', 'Ile', 'I', 'L-isoleucine', 6306, 'C6H13NO2'],
  ['leucine', 'Leucine', 'Leu', 'L', 'L-leucine', 6106, 'C6H13NO2'],
  ['lysine', 'Lysine', 'Lys', 'K', 'L-lysine', 5962, 'C6H14N2O2'],
  ['methionine', 'Methionine', 'Met', 'M', 'L-methionine', 6137, 'C5H11NO2S'],
  ['phenylalanine', 'Phenylalanine', 'Phe', 'F', 'L-phenylalanine', 6140, 'C9H11NO2'],
  ['proline', 'Proline', 'Pro', 'P', 'L-proline', 145742, 'C5H9NO2'],
  ['serine', 'Serine', 'Ser', 'S', 'L-serine', 5951, 'C3H7NO3'],
  ['threonine', 'Threonine', 'Thr', 'T', 'L-threonine', 6288, 'C4H9NO3'],
  ['tryptophan', 'Tryptophan', 'Trp', 'W', 'L-tryptophan', 6305, 'C11H12N2O2'],
  ['tyrosine', 'Tyrosine', 'Tyr', 'Y', 'L-tyrosine', 6057, 'C9H11NO3'],
  ['valine', 'Valine', 'Val', 'V', 'L-valine', 6287, 'C5H11NO2'],
].map(([slug, name, threeLetterCode, oneLetterCode, pubchemQuery, cid, formula]) => ({
  slug, name, threeLetterCode, oneLetterCode, pubchemQuery, cid, formula,
  stereochemistry: slug === 'glycine' ? 'achiral' : 'L',
}));

const NATURAL_STEREO_EVIDENCE = {
  isoleucine: {
    inchiKey: 'AGPKZVBTJJNPAG-WHFBIAKZSA-N',
    isomericSmiles: 'CC[C@H](C)[C@@H](C(=O)O)N',
  },
  threonine: {
    inchiKey: 'AYFVYJQAPQTCCC-GBXIJSLDSA-N',
    isomericSmiles: 'C[C@H]([C@@H](C(=O)O)N)O',
  },
};

const sha256 = (data) => createHash('sha256').update(data).digest('hex');

async function fetchBytes(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'kangdaejong.com protein atlas renderer' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function ensureVendor() {
  await mkdir(VENDOR, { recursive: true });
  const files = [
    ['3Dmol-min.js', 'https://unpkg.com/3dmol@2.5.5/build/3Dmol-min.js'],
    ['3Dmol-min.js.LICENSE.txt', 'https://unpkg.com/3dmol@2.5.5/build/3Dmol-min.js.LICENSE.txt'],
    ['LICENSE', 'https://unpkg.com/3dmol@2.5.5/LICENSE'],
  ];
  const manifest = { name: '3dmol', version: '2.5.5', license: 'BSD-3-Clause', files: {} };
  for (const [filename, url] of files) {
    const body = await fetchBytes(url);
    await writeFile(join(VENDOR, filename), body);
    manifest.files[filename] = { url, sha256: sha256(body), bytes: body.length };
  }
  await writeFile(join(VENDOR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}

function parseFormula(formula) {
  const elements = {};
  for (const match of formula.matchAll(/([A-Z][a-z]?)(\d*)/g)) {
    elements[match[1]] = Number(match[2] || 1);
  }
  return elements;
}

function parseV2000(sdf) {
  const lines = sdf.replace(/\r/g, '').split('\n');
  if (!lines[3]?.includes('V2000')) throw new Error('Expected an MDL V2000 record');
  const atomCount = Number(lines[3].slice(0, 3));
  const bondCount = Number(lines[3].slice(3, 6));
  const atoms = lines.slice(4, 4 + atomCount).map((line, index) => ({
    index: index + 1,
    element: line.slice(31, 34).trim(),
    x: Number(line.slice(0, 10)),
    y: Number(line.slice(10, 20)),
    z: Number(line.slice(20, 30)),
  }));
  const bonds = lines.slice(4 + atomCount, 4 + atomCount + bondCount).map((line) => ({
    from: Number(line.slice(0, 3)),
    to: Number(line.slice(3, 6)),
    order: Number(line.slice(6, 9)),
    stereo: Number(line.slice(9, 12)),
  }));
  const elements = atoms.reduce((counts, atom) => {
    counts[atom.element] = (counts[atom.element] || 0) + 1;
    return counts;
  }, {});
  const properties = {};
  for (let index = 4 + atomCount + bondCount; index < lines.length; index += 1) {
    const match = lines[index].match(/^> <([^>]+)>$/);
    if (!match) continue;
    const values = [];
    while (lines[index + 1] && !lines[index + 1].startsWith('> <') && lines[index + 1] !== '$$$$') {
      values.push(lines[index + 1]);
      index += 1;
    }
    properties[match[1]] = values.filter(Boolean).join('\n');
  }
  return { atomCount, bondCount, atoms, bonds, elements, properties };
}

function validateStructure(aminoAcid, structure, property) {
  const expected = parseFormula(aminoAcid.formula);
  const sameElements = Object.entries(expected).every(([element, count]) => structure.elements[element] === count)
    && Object.keys(structure.elements).length === Object.keys(expected).length;
  if (!sameElements) {
    throw new Error(`${aminoAcid.slug}: atom counts ${JSON.stringify(structure.elements)} != ${JSON.stringify(expected)}`);
  }
  if (property.CID !== aminoAcid.cid || property.MolecularFormula !== aminoAcid.formula) {
    throw new Error(`${aminoAcid.slug}: PubChem identity mismatch`);
  }
  if (Number(structure.properties.PUBCHEM_COMPOUND_CID) !== property.CID) {
    throw new Error(`${aminoAcid.slug}: SDF CID does not match property response CID`);
  }
  const stereoEvidence = NATURAL_STEREO_EVIDENCE[aminoAcid.slug];
  if (stereoEvidence && (property.InChIKey !== stereoEvidence.inchiKey
    || (property.SMILES || property.IsomericSMILES) !== stereoEvidence.isomericSmiles)) {
    throw new Error(`${aminoAcid.slug}: natural L stereochemistry identity mismatch`);
  }
  if (!structure.atoms.every((a) => Number.isFinite(a.x) && Number.isFinite(a.y) && Number.isFinite(a.z))) {
    throw new Error(`${aminoAcid.slug}: invalid coordinates`);
  }
  if (!structure.bonds.every((b) => b.from > 0 && b.from <= structure.atomCount && b.to > 0 && b.to <= structure.atomCount && b.order >= 1 && b.order <= 3)) {
    throw new Error(`${aminoAcid.slug}: invalid bond table`);
  }
  const connected = new Set([1]);
  for (let pass = 0; pass < structure.atomCount; pass += 1) {
    for (const bond of structure.bonds) {
      if (connected.has(bond.from)) connected.add(bond.to);
      if (connected.has(bond.to)) connected.add(bond.from);
    }
  }
  if (connected.size !== structure.atomCount) throw new Error(`${aminoAcid.slug}: disconnected structure`);
}

async function getPubChemRecord(aminoAcid) {
  const query = encodeURIComponent(aminoAcid.pubchemQuery);
  const propertyUrl = `${PUBCHEM}/name/${query}/property/Title,MolecularFormula,IsomericSMILES,InChI,InChIKey/JSON`;
  const sdfUrl = `${PUBCHEM}/name/${query}/SDF?record_type=3d`;
  const [propertyBody, sdfBody] = await Promise.all([fetchBytes(propertyUrl), fetchBytes(sdfUrl)]);
  const property = JSON.parse(propertyBody).PropertyTable.Properties[0];
  const sdf = sdfBody.toString('utf8');
  const structure = parseV2000(sdf);
  validateStructure(aminoAcid, structure, property);
  return { property, propertyUrl, sdf, sdfUrl, sdfSha256: sha256(sdfBody), structure };
}

async function renderMolecule(page, aminoAcid, sdf) {
  await page.setViewportSize({ width: 1000, height: 1000 });
  await page.setContent(`<!doctype html>
    <html><head><style>
      * { box-sizing: border-box; }
      html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: #ffffff; }
      #viewer { position: absolute; inset: 0; }
    </style></head><body><div id="viewer"></div></body></html>`);
  await page.addScriptTag({ path: join(VENDOR, '3Dmol-min.js') });
  await page.evaluate(({ sdfText }) => {
    const viewer = globalThis.$3Dmol.createViewer('viewer', { antialias: true });
    viewer.setBackgroundColor(0xffffff, 1);
    viewer.addModel(sdfText, 'sdf');
    viewer.setStyle({}, {
      stick: { radius: 0.13, colorscheme: 'Jmol' },
      sphere: { scale: 0.30, colorscheme: 'Jmol' },
    });
    viewer.rotate(8, 'x');
    viewer.rotate(-12, 'y');
    viewer.zoomTo();
    viewer.render();
    globalThis.__aminoViewer = viewer;
    globalThis.__aminoReady = true;
  }, { sdfText: sdf });
  await page.waitForFunction(() => globalThis.__aminoReady === true);
  await page.waitForTimeout(120);

  let image;
  let pixelBounds;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    image = await page.screenshot({ type: 'png' });
    pixelBounds = await page.evaluate(async (base64) => {
      const imageElement = new Image();
      imageElement.src = `data:image/png;base64,${base64}`;
      await imageElement.decode();
      const canvas = document.createElement('canvas');
      canvas.width = imageElement.width;
      canvas.height = imageElement.height;
      const context = canvas.getContext('2d');
      context.drawImage(imageElement, 0, 0);
      const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
      let left = canvas.width;
      let top = canvas.height;
      let right = -1;
      let bottom = -1;
      for (let y = 0; y < canvas.height; y += 1) {
        for (let x = 0; x < canvas.width; x += 1) {
          const offset = (y * canvas.width + x) * 4;
          if (data[offset] < 245 || data[offset + 1] < 245 || data[offset + 2] < 245) {
            left = Math.min(left, x);
            top = Math.min(top, y);
            right = Math.max(right, x);
            bottom = Math.max(bottom, y);
          }
        }
      }
      return { left, top, right, bottom, width: right - left + 1, height: bottom - top + 1 };
    }, image.toString('base64'));

    const minimumMargin = Math.min(
      pixelBounds.left,
      pixelBounds.top,
      999 - pixelBounds.right,
      999 - pixelBounds.bottom,
    );
    const longestSide = Math.max(pixelBounds.width, pixelBounds.height);
    if (minimumMargin >= 60 && longestSide >= 650 && longestSide <= 800) break;
    const factor = minimumMargin < 60 || longestSide > 800
      ? Math.min(0.90, 800 / longestSide)
      : Math.min(1.24, 720 / longestSide);
    await page.evaluate((scale) => {
      globalThis.__aminoViewer.zoom(scale);
      globalThis.__aminoViewer.render();
    }, factor);
    await page.waitForTimeout(80);
  }

  const margins = {
    left: pixelBounds.left,
    top: pixelBounds.top,
    right: 999 - pixelBounds.right,
    bottom: 999 - pixelBounds.bottom,
  };
  if (Math.min(...Object.values(margins)) < 60) {
    throw new Error(`${aminoAcid.slug}: rendered molecule has insufficient canvas margin ${JSON.stringify(margins)}`);
  }
  const imagePath = join(OUT, `${aminoAcid.slug}.png`);
  await writeFile(imagePath, image);
  return { imageSha256: sha256(image), pixelBounds: { ...pixelBounds, margins } };
}

async function main() {
  await mkdir(STRUCTURES, { recursive: true });
  await ensureVendor();
  const records = [];
  for (const aminoAcid of AMINO_ACIDS) {
    const record = await getPubChemRecord(aminoAcid);
    await writeFile(join(STRUCTURES, `${aminoAcid.slug}.sdf`), record.sdf);
    records.push({ aminoAcid, ...record });
    console.log(`validated ${aminoAcid.slug}: ${record.structure.atomCount} atoms, ${record.structure.bondCount} bonds`);
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ deviceScaleFactor: 1 });
    for (const record of records) {
      Object.assign(record, await renderMolecule(page, record.aminoAcid, record.sdf));
      console.log(`rendered ${record.aminoAcid.slug}`);
    }
  } finally {
    await browser.close();
  }

  const metadata = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    representation: {
      chemicalForm: 'neutral non-zwitterionic, explicit-hydrogen 3D conformer as supplied by PubChem',
      style: 'ball-and-stick',
      colorScheme: 'Jmol/CPK-style element colors',
      renderer: { name: '3Dmol.js', version: '2.5.5', license: 'BSD-3-Clause' },
      canvas: { width: 1000, height: 1000, format: 'PNG' },
    },
    source: {
      provider: 'PubChem',
      publisher: 'National Center for Biotechnology Information',
      api: 'PUG REST',
      recordType: '3d',
      accessedAt: new Date().toISOString(),
    },
    aminoAcids: records.map(({ aminoAcid, property, propertyUrl, sdfUrl, sdfSha256, imageSha256, pixelBounds, structure }) => ({
      ...aminoAcid,
      pubchem: {
        cid: property.CID,
        sdfCompoundCid: Number(structure.properties.PUBCHEM_COMPOUND_CID),
        title: property.Title,
        url: `https://pubchem.ncbi.nlm.nih.gov/compound/${property.CID}`,
        propertyApiUrl: propertyUrl,
        sdfApiUrl: sdfUrl,
        inchi: property.InChI,
        inchiKey: property.InChIKey,
        isomericSmiles: property.SMILES || property.IsomericSMILES,
        naturalStereoEvidence: NATURAL_STEREO_EVIDENCE[aminoAcid.slug] || null,
      },
      files: {
        image: `${aminoAcid.slug}.png`,
        imageSha256,
        structure: `structures/${aminoAcid.slug}.sdf`,
        sdfSha256,
      },
      rendering: { pixelBounds },
      structure: {
        atomCount: structure.atomCount,
        bondCount: structure.bondCount,
        elementCounts: structure.elements,
        atoms: structure.atoms,
        bonds: structure.bonds,
      },
    })),
  };
  await writeFile(join(OUT, 'manifest.json'), `${JSON.stringify(metadata, null, 2)}\n`);
  console.log(`wrote ${records.length} amino-acid figures and metadata`);
}

await main();
