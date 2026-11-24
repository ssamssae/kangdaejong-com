// 셀 서식 등록부. 앱과 같이 "처음 쓰인 순서"로 번호를 매긴다(서식 번호가 정답 엑셀과 같아지도록).

export const FONT_NAME = '맑은 고딕';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export class StyleRegistry {
  constructor() {
    this.numFmts = []; // [{id, code}]
    this.fonts = [];   // keys
    this.fills = ['none', 'gray125'];
    this.borders = ['none'];
    this.xfs = [];     // [{key, numFmtId, fontId, fillId, borderId, h, wrap}]
    this.xfIndex = new Map();
    // 0번 = 기본(8.5pt 검정, 세로 가운데)
    this.id({ sz: '8.5', color: '000000' }, true);
  }

  numFmtId(code) {
    if (!code) return 0;
    let f = this.numFmts.find((x) => x.code === code);
    if (!f) {
      f = { id: 164 + this.numFmts.length, code };
      this.numFmts.push(f);
    }
    return f.id;
  }

  fontId(b, sz, color) {
    const key = `${b ? 1 : 0}|${sz}|${color}`;
    let i = this.fonts.indexOf(key);
    if (i < 0) { this.fonts.push(key); i = this.fonts.length - 1; }
    return i;
  }

  fillId(color) {
    if (!color) return 0;
    let i = this.fills.indexOf(color);
    if (i < 0) { this.fills.push(color); i = this.fills.length - 1; }
    return i;
  }

  borderId(on) {
    if (!on) return 0;
    let i = this.borders.indexOf('thin');
    if (i < 0) { this.borders.push('thin'); i = this.borders.length - 1; }
    return i;
  }

  /**
   * spec = { fmt?, b?, sz, color, fill?, border?, h?, wrap? } → cellXfs 번호
   */
  id(spec, isDefault = false) {
    const key = JSON.stringify([spec.fmt || null, !!spec.b, spec.sz, spec.color, spec.fill || null, !!spec.border, spec.h || null, !!spec.wrap, isDefault]);
    if (this.xfIndex.has(key)) return this.xfIndex.get(key);
    const xf = {
      numFmtId: this.numFmtId(spec.fmt),
      fontId: this.fontId(spec.b, spec.sz, spec.color),
      fillId: this.fillId(spec.fill),
      borderId: this.borderId(spec.border),
      h: isDefault ? null : spec.h || null,
      wrap: !!spec.wrap,
    };
    this.xfs.push(xf);
    const idx = this.xfs.length - 1;
    this.xfIndex.set(key, idx);
    return idx;
  }

  toXml() {
    const nf = `<numFmts count="${this.numFmts.length}">${this.numFmts.map((f) => `<numFmt numFmtId="${f.id}" formatCode="${esc(f.code)}"/>`).join('')}</numFmts>`;
    const fonts = `<fonts count="${this.fonts.length}">${this.fonts.map((k) => {
      const [b, sz, color] = k.split('|');
      return `<font>${b === '1' ? '<b/>' : ''}<sz val="${sz}"/><color rgb="FF${color}"/><name val="${FONT_NAME}"/><family val="2"/></font>`;
    }).join('')}</fonts>`;
    const fills = `<fills count="${this.fills.length}">${this.fills.map((f) => {
      if (f === 'none' || f === 'gray125') return `<fill><patternFill patternType="${f}"/></fill>`;
      return `<fill><patternFill patternType="solid"><fgColor rgb="FF${f}"/><bgColor indexed="64"/></patternFill></fill>`;
    }).join('')}</fills>`;
    const thin = '<color rgb="FFC9CFD8"/>';
    const borders = `<borders count="${this.borders.length}">${this.borders.map((b) => (b === 'none'
      ? '<border><left/><right/><top/><bottom/><diagonal/></border>'
      : `<border><left style="thin">${thin}</left><right style="thin">${thin}</right><top style="thin">${thin}</top><bottom style="thin">${thin}</bottom><diagonal/></border>`)).join('')}</borders>`;
    const xfs = `<cellXfs count="${this.xfs.length}">${this.xfs.map((x) => {
      let a = `<xf numFmtId="${x.numFmtId}" fontId="${x.fontId}" fillId="${x.fillId}" borderId="${x.borderId}" xfId="0"`;
      if (x.numFmtId) a += ' applyNumberFormat="1"';
      a += ' applyFont="1"';
      if (x.fillId) a += ' applyFill="1"';
      if (x.borderId) a += ' applyBorder="1"';
      a += ' applyAlignment="1">';
      const al = `<alignment${x.h ? ` horizontal="${x.h}"` : ''} vertical="center"${x.wrap ? ' wrapText="1"' : ''}/>`;
      return `${a}${al}</xf>`;
    }).join('')}</cellXfs>`;
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
      + nf + fonts + fills + borders
      + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
      + xfs
      + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  }
}
