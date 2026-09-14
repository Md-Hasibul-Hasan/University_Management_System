/**
 * Dependency-free XLSX writer.
 *
 * Builds a real Office Open XML workbook (.xlsx) — a ZIP archive holding the
 * required XML parts — using stored (uncompressed) entries, so no third-party
 * spreadsheet library is required.
 */

const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`;

const ROOT_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;

const WORKBOOK_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;

// cellXfs: 0 = default, 1 = bold + centered (header row), 2 = left-aligned (data).
const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf></cellXfs></styleSheet>`;

const encoder = new TextEncoder();

const encodeUtf8 = (value) => encoder.encode(value);

const concatBytes = (chunks) => {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(total);
  let position = 0;

  for (const chunk of chunks) {
    output.set(chunk, position);
    position += chunk.length;
  }

  return output;
};

const u16 = (value) => new Uint8Array([value & 0xff, (value >>> 8) & 0xff]);

const u32 = (value) =>
  new Uint8Array([
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  ]);

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index += 1) {
    let value = index;

    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    table[index] = value >>> 0;
  }

  return table;
})();

const crc32 = (bytes) => {
  let crc = 0xffffffff;

  for (let index = 0; index < bytes.length; index += 1) {
    crc = CRC_TABLE[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
};

/** ZIP archive with stored (uncompressed) entries. */
const createZip = (files) => {
  const localChunks = [];
  const centralChunks = [];
  const now = new Date();

  const dosTime =
    ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xffff;
  const dosDate =
    (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff;

  let offset = 0;

  for (const file of files) {
    const nameBytes = encodeUtf8(file.name);
    const crc = crc32(file.data);
    const size = file.data.length;

    const localHeader = concatBytes([
      u32(0x04034b50),
      u16(20),
      u16(0x0800),
      u16(0),
      u16(dosTime),
      u16(dosDate),
      u32(crc),
      u32(size),
      u32(size),
      u16(nameBytes.length),
      u16(0),
    ]);

    localChunks.push(localHeader, nameBytes, file.data);

    centralChunks.push(
      concatBytes([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0x0800),
        u16(0),
        u16(dosTime),
        u16(dosDate),
        u32(crc),
        u32(size),
        u32(size),
        u16(nameBytes.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
      ]),
      nameBytes
    );

    offset += localHeader.length + nameBytes.length + size;
  }

  const centralDirectory = concatBytes(centralChunks);

  const endOfCentralDirectory = concatBytes([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralDirectory.length),
    u32(offset),
    u16(0),
  ]);

  return concatBytes([...localChunks, centralDirectory, endOfCentralDirectory]);
};

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    // Control characters are not allowed in XML 1.0.
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");

/** 0 => A, 25 => Z, 26 => AA ... */
const columnLetter = (index) => {
  let letters = "";
  let value = index + 1;

  while (value > 0) {
    const remainder = (value - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    value = Math.floor((value - 1) / 26);
  }

  return letters;
};

const isBlank = (value) => value === null || value === undefined || value === "";

// cellXfs indexes declared in STYLES_XML above.
const HEADER_STYLE_ID = 1;
const DATA_STYLE_ID = 2;

const buildSheetXml = (columns, rows) => {
  const parts = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
    '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>',
  ];

  if (columns.some((column) => column.width)) {
    parts.push("<cols>");

    columns.forEach((column, index) => {
      if (!column.width) return;
      parts.push(
        `<col min="${index + 1}" max="${index + 1}" width="${column.width}" customWidth="1"/>`
      );
    });

    parts.push("</cols>");
  }

  parts.push("<sheetData>");

  // Header row — bold and centered.
  parts.push('<row r="1">');

  columns.forEach((column, index) => {
    parts.push(
      `<c r="${columnLetter(index)}1" s="${HEADER_STYLE_ID}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(
        column.label
      )}</t></is></c>`
    );
  });

  parts.push("</row>");

  rows.forEach((row, rowIndex) => {
    const rowNumber = rowIndex + 2;
    const cells = [];

    row.forEach((value, columnIndex) => {
      if (isBlank(value)) return;

      const reference = `${columnLetter(columnIndex)}${rowNumber}`;

      if (typeof value === "number") {
        if (!Number.isFinite(value)) return;
        cells.push(`<c r="${reference}" s="${DATA_STYLE_ID}"><v>${value}</v></c>`);
        return;
      }

      cells.push(
        `<c r="${reference}" s="${DATA_STYLE_ID}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(
          value
        )}</t></is></c>`
      );
    });

    parts.push(`<row r="${rowNumber}">${cells.join("")}</row>`);
  });

  parts.push("</sheetData></worksheet>");

  return parts.join("");
};

const buildWorkbookXml = (sheetName) =>
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
  `<sheets><sheet name="${escapeXml(sheetName).slice(
    0,
    31
  )}" sheetId="1" r:id="rId1"/></sheets></workbook>`;

/**
 * Build the raw .xlsx bytes.
 *
 * @param {object} options
 * @param {string} [options.sheetName]
 * @param {Array}  options.columns  [{ label, width? }]
 * @param {Array}  options.rows     (string | number | null)[][]
 * @returns {Uint8Array}
 */
export const buildXlsx = ({ sheetName = "Sheet1", columns = [], rows = [] }) =>
  createZip([
    { name: "[Content_Types].xml", data: encodeUtf8(CONTENT_TYPES_XML) },
    { name: "_rels/.rels", data: encodeUtf8(ROOT_RELS_XML) },
    { name: "xl/workbook.xml", data: encodeUtf8(buildWorkbookXml(sheetName)) },
    { name: "xl/_rels/workbook.xml.rels", data: encodeUtf8(WORKBOOK_RELS_XML) },
    { name: "xl/styles.xml", data: encodeUtf8(STYLES_XML) },
    {
      name: "xl/worksheets/sheet1.xml",
      data: encodeUtf8(buildSheetXml(columns, rows)),
    },
  ]);

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Build the workbook in the browser and trigger a download. */
export const downloadXlsx = ({ fileName = "export.xlsx", ...options }) => {
  const bytes = buildXlsx(options);
  const blob = new Blob([bytes], { type: XLSX_MIME });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
};





