// 시트·통합문서 XML 쓰기. 글자는 공유 문자열 없이 inlineStr 로 넣는다(앱과 같은 방식).

import { StyleRegistry } from './styles.js';
import { zipStore } from './zip.js';
import { xlsxNumber } from '../engine/format.js';

export function escXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function colIndex(letters) {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

function splitRef(ref) {
  const m = /^([A-Z]+)(\d+)$/.exec(ref);
  return { col: m[1], row: Number(m[2]) };
}

export class Sheet {
  constructor(name, reg) {
    this.name = name;
    this.reg = reg;
    this.rows = new Map();
    this.cols = [];
    this.merges = [];
    this.freezeRows = 0;
    this.dimension = 'A1';
  }

  row(r, ht) {
    let row = this.rows.get(r);
    if (!row) { row = { ht: null, cells: new Map() }; this.rows.set(r, row); }
    if (ht != null) row.ht = ht;
    return row;
  }

  put(ref, cell) {
    const { col, row } = splitRef(ref);
    cell.s = this.reg.id(cell.style);
    this.row(row).cells.set(col, cell);
  }

  str(ref, text, style) { this.put(ref, { kind: 'str', text, style }); }
  num(ref, n, style) { this.put(ref, { kind: 'num', n, style }); }
  fnum(ref, f, n, style) { this.put(ref, { kind: 'fnum', f, n, style }); }
  fstr(ref, f, text, style) { this.put(ref, { kind: 'fstr', f, text, style }); }
  empty(ref, style) { this.put(ref, { kind: 'empty', style }); }
  merge(range) { this.merges.push(range); }

  toXml() {
    const rowsXml = [...this.rows.entries()].sort((a, b) => a[0] - b[0]).map(([r, row]) => {
      const attrs = row.ht != null ? ` ht="${row.ht}" customHeight="1"` : '';
      const cells = [...row.cells.entries()].sort((a, b) => colIndex(a[0]) - colIndex(b[0])).map(([col, c]) => {
        const ref = `${col}${r}`;
        switch (c.kind) {
          case 'str': return `<c r="${ref}" s="${c.s}" t="inlineStr"><is><t xml:space="preserve">${escXml(c.text)}</t></is></c>`;
          case 'num': return `<c r="${ref}" s="${c.s}"><v>${xlsxNumber(c.n)}</v></c>`;
          case 'fnum': return `<c r="${ref}" s="${c.s}"><f>${escXml(c.f)}</f><v>${xlsxNumber(c.n)}</v></c>`;
          case 'fstr': return `<c r="${ref}" s="${c.s}" t="str"><f>${escXml(c.f)}</f><v>${escXml(c.text)}</v></c>`;
          default: return `<c r="${ref}" s="${c.s}"/>`;
        }
      }).join('');
      return `<row r="${r}"${attrs}>${cells}</row>`;
    }).join('');
    const top = this.freezeRows + 1;
    const cols = `<cols>${this.cols.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`;
    const merges = this.merges.length
      ? `<mergeCells count="${this.merges.length}">${this.merges.map((m) => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>`
      : '';
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
      + '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>'
      + `<dimension ref="${this.dimension}"/>`
      + `<sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane ySplit="${this.freezeRows}" topLeftCell="A${top}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A${top}" sqref="A${top}"/></sheetView></sheetViews>`
      + '<sheetFormatPr defaultRowHeight="15"/>'
      + cols
      + `<sheetData>${rowsXml}</sheetData>`
      + merges
      + '<pageMargins left="0.4" right="0.4" top="0.4" bottom="0.4" header="0.3" footer="0.3"/>'
      + '<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="1"/>'
      + '</worksheet>';
  }
}

/** 시트 이름을 수식 참조용으로: '김민지' (작은따옴표는 두 번) */
export function sheetRef(name) {
  return `'${name.replace(/'/g, "''")}'`;
}

export class Workbook {
  constructor() {
    this.reg = new StyleRegistry();
    this.sheets = [];
    this.appName = '알바 급여 계산기';
  }

  addSheet(name) {
    const s = new Sheet(name, this.reg);
    this.sheets.push(s);
    return s;
  }

  /** 파일 목록(zip 넣기 순서 = 앱 엑셀과 같음) */
  parts(created = new Date()) {
    const iso = `${created.toISOString().slice(0, 19)}Z`;
    const n = this.sheets.length;
    const sheetOverrides = this.sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('');
    const contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
      + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      + '<Default Extension="xml" ContentType="application/xml"/>'
      + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
      + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
      + '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
      + '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>'
      + sheetOverrides
      + '</Types>';
    const rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
      + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
      + '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>'
      + '</Relationships>';
    const core = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
      + `<dc:creator>${escXml(this.appName)}</dc:creator>`
      + `<dcterms:created xsi:type="dcterms:W3CDTF">${iso}</dcterms:created>`
      + `<dcterms:modified xsi:type="dcterms:W3CDTF">${iso}</dcterms:modified>`
      + '</cp:coreProperties>';
    const app = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'
      + `<Application>${escXml(this.appName)}</Application></Properties>`;
    const defined = this.sheets.flatMap((s, i) => {
      const out = [`<definedName name="_xlnm.Print_Area" localSheetId="${i}">${escXml(sheetRef(s.name))}!${s.printArea}</definedName>`];
      if (s.printTitles) out.push(`<definedName name="_xlnm.Print_Titles" localSheetId="${i}">${escXml(sheetRef(s.name))}!${s.printTitles}</definedName>`);
      return out;
    }).join('');
    const workbook = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
      + '<bookViews><workbookView xWindow="0" yWindow="0" windowWidth="20000" windowHeight="12000"/></bookViews>'
      + `<sheets>${this.sheets.map((s, i) => `<sheet name="${escXml(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets>`
      + `<definedNames>${defined}</definedNames>`
      + '<calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>';
    const wbRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + this.sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')
      + `<Relationship Id="rId${n + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`
      + '</Relationships>';
    // 시트 XML 을 먼저 만들어도 서식 등록 순서는 시트 채울 때 이미 정해졌다.
    const sheetXml = this.sheets.map((s) => s.toXml());
    return [
      { name: '[Content_Types].xml', data: contentTypes },
      { name: '_rels/.rels', data: rels },
      { name: 'docProps/core.xml', data: core },
      { name: 'docProps/app.xml', data: app },
      { name: 'xl/workbook.xml', data: workbook },
      { name: 'xl/_rels/workbook.xml.rels', data: wbRels },
      { name: 'xl/styles.xml', data: this.reg.toXml() },
      ...sheetXml.map((x, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: x })),
    ];
  }

  toZip(created = new Date()) {
    return zipStore(this.parts(created), created);
  }
}
