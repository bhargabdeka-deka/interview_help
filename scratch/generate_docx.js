const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow,
  TableCell, WidthType, AlignmentType, BorderStyle, ShadingType,
  PageBreak, HorizontalPositionAlign, ImageRun, convertInchesToTwip,
  Header, Footer, PageNumber, NumberFormat, UnderlineType, Indent,
  TableOfContents, StyleLevel
} = require('docx');

const mdContent = fs.readFileSync('c:/interview_help/COLLEGE_PROJECT_REPORT.md', 'utf-8');
const lines = mdContent.split('\n');

// --- Style Helpers ---
const COLOR = {
  primary: '1A56DB',   // Blue
  secondary: '374151', // Dark Gray
  code_bg: 'F3F4F6',  // Light gray for code
  border: 'D1D5DB',
  heading1: '111827',
  heading2: '1F2937',
  heading3: '374151',
  white: 'FFFFFF',
  table_header: '1A56DB',
};

function makeHeading1(text) {
  return new Paragraph({
    text: text.replace(/^#\s*/, '').trim(),
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 240 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR.primary } },
    run: { color: COLOR.heading1, bold: true },
    pageBreakBefore: false,
  });
}

function makeHeading2(text) {
  return new Paragraph({
    text: text.replace(/^##\s*/, '').trim(),
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 180 },
  });
}

function makeHeading3(text) {
  return new Paragraph({
    text: text.replace(/^###\s*/, '').trim(),
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
  });
}

function makeHeading4(text) {
  return new Paragraph({
    text: text.replace(/^####\s*/, '').trim(),
    heading: HeadingLevel.HEADING_4,
    spacing: { before: 200, after: 100 },
  });
}

function inlineRuns(text) {
  const runs = [];
  // Process **bold**, `code`, and plain text segments
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true, color: COLOR.secondary }));
    } else if (part.startsWith('`') && part.endsWith('`')) {
      runs.push(new TextRun({ text: part.slice(1, -1), font: 'Courier New', size: 18, color: '9B1C1C', shading: { type: ShadingType.SOLID, fill: COLOR.code_bg } }));
    } else {
      runs.push(new TextRun({ text: part, color: COLOR.secondary }));
    }
  }
  return runs;
}

function makeParagraph(text) {
  if (!text.trim()) return new Paragraph({ spacing: { after: 80 } });
  
  // Bullet point
  if (text.trim().startsWith('- ') || text.trim().startsWith('* ')) {
    const content = text.trim().slice(2);
    return new Paragraph({
      bullet: { level: 0 },
      children: inlineRuns(content),
      spacing: { after: 80 },
    });
  }
  
  // Numbered list
  const numMatch = text.trim().match(/^(\d+)\.\s+(.+)/);
  if (numMatch) {
    return new Paragraph({
      numbering: { reference: 'default-numbering', level: 0 },
      children: inlineRuns(numMatch[2]),
      spacing: { after: 80 },
    });
  }

  return new Paragraph({
    children: inlineRuns(text.trim()),
    spacing: { after: 120 },
  });
}

function makeCodeBlock(lines) {
  const paras = [];
  for (const line of lines) {
    paras.push(new Paragraph({
      children: [new TextRun({
        text: line || ' ',
        font: 'Courier New',
        size: 17,
        color: '111827',
      })],
      spacing: { before: 0, after: 0, line: 240 },
      indent: { left: convertInchesToTwip(0.2), right: convertInchesToTwip(0.2) },
      shading: { type: ShadingType.SOLID, fill: 'F8F9FA' },
    }));
  }
  return paras;
}

function makeTableFromLines(tableLines) {
  const rows = tableLines
    .filter(l => l.trim() && !l.trim().match(/^\|[-| :]+\|$/))
    .map(l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()));

  if (rows.length === 0) return null;

  const tableRows = rows.map((cells, rowIdx) =>
    new TableRow({
      children: cells.map(cell =>
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({
              text: cell.replace(/\*\*/g, ''),
              bold: rowIdx === 0,
              color: rowIdx === 0 ? COLOR.white : COLOR.secondary,
              size: 18,
            })],
            alignment: AlignmentType.LEFT,
            spacing: { before: 60, after: 60 },
          })],
          shading: rowIdx === 0
            ? { type: ShadingType.SOLID, fill: COLOR.primary }
            : (rowIdx % 2 === 0 ? { type: ShadingType.SOLID, fill: 'F9FAFB' } : undefined),
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
        })
      ),
    })
  );

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  });
}

// --- Parse Markdown to DOCX Elements ---
const docElements = [];
let i = 0;
let inCodeBlock = false;
let codeLines = [];
let tableLines = [];
let inTable = false;

while (i < lines.length) {
  const line = lines[i];

  // Page break markers
  if (line.trim() === '---') {
    if (!inCodeBlock) {
      i++;
      continue;
    }
  }

  // Code block start/end
  if (line.trim().startsWith('```')) {
    if (!inCodeBlock) {
      inCodeBlock = true;
      codeLines = [];
      i++;
      continue;
    } else {
      inCodeBlock = false;
      // Wrap in bordered box
      docElements.push(new Paragraph({
        children: [new TextRun({ text: ' ' })],
        spacing: { before: 80, after: 0 },
      }));
      docElements.push(...makeCodeBlock(codeLines));
      docElements.push(new Paragraph({
        children: [new TextRun({ text: ' ' })],
        spacing: { before: 0, after: 160 },
      }));
      i++;
      continue;
    }
  }

  if (inCodeBlock) {
    codeLines.push(line);
    i++;
    continue;
  }

  // Table detection
  if (line.trim().startsWith('|')) {
    tableLines.push(line);
    i++;
    // Check if next line is also a table line
    if (i < lines.length && lines[i].trim().startsWith('|')) {
      continue;
    } else {
      // End of table, render it
      const tbl = makeTableFromLines(tableLines);
      if (tbl) {
        docElements.push(new Paragraph({ spacing: { before: 120, after: 0 } }));
        docElements.push(tbl);
        docElements.push(new Paragraph({ spacing: { before: 0, after: 200 } }));
      }
      tableLines = [];
      continue;
    }
  }

  // Headings
  if (line.startsWith('#### ')) { docElements.push(makeHeading4(line)); i++; continue; }
  if (line.startsWith('### ')) { docElements.push(makeHeading3(line)); i++; continue; }
  if (line.startsWith('## ')) { docElements.push(makeHeading2(line)); i++; continue; }
  if (line.startsWith('# ')) { docElements.push(makeHeading1(line)); i++; continue; }

  // Images — show as placeholder text
  if (line.trim().startsWith('![')) {
    const altMatch = line.match(/!\[([^\]]+)\]/);
    const alt = altMatch ? altMatch[1] : 'Figure';
    docElements.push(new Paragraph({
      children: [new TextRun({ text: `[${alt}]`, italics: true, color: '6B7280' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 160, after: 80 },
      border: { top: { style: BorderStyle.SINGLE, size: 2, color: COLOR.border },
                bottom: { style: BorderStyle.SINGLE, size: 2, color: COLOR.border } },
    }));
    docElements.push(new Paragraph({
      children: [new TextRun({ text: alt, italics: true, size: 18, color: '6B7280' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 200 },
    }));
    i++;
    continue;
  }

  // HTML comments / tags — skip
  if (line.trim().startsWith('<') || line.trim().startsWith('>')) {
    if (line.trim().startsWith('> **[Screenshot')) {
      docElements.push(new Paragraph({
        children: [new TextRun({ text: line.trim().replace(/>/g, '').replace(/\*\*/g, '').trim(), italics: true, color: '6B7280' })],
        spacing: { before: 40, after: 40 },
        shading: { type: ShadingType.SOLID, fill: 'FEF3C7' },
        border: { left: { style: BorderStyle.SINGLE, size: 6, color: 'F59E0B' } },
        indent: { left: convertInchesToTwip(0.25) },
      }));
    }
    i++;
    continue;
  }

  // Horizontal rule
  if (line.trim() === '---') { i++; continue; }

  // Normal paragraph
  if (line.trim()) {
    docElements.push(makeParagraph(line));
  } else {
    docElements.push(new Paragraph({ spacing: { after: 60 } }));
  }
  i++;
}

// --- Build the Document ---
const doc = new Document({
  numbering: {
    config: [{
      reference: 'default-numbering',
      levels: [{
        level: 0,
        format: NumberFormat.DECIMAL,
        text: '%1.',
        alignment: AlignmentType.LEFT,
      }],
    }],
  },
  styles: {
    default: {
      document: {
        run: { font: 'Calibri', size: 22, color: COLOR.secondary },
        paragraph: { spacing: { line: 276 } },
      },
    },
    paragraphStyles: [
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        next: 'Normal',
        run: { color: COLOR.heading1, bold: true, size: 36, font: 'Calibri' },
        paragraph: { spacing: { before: 480, after: 240 } },
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        run: { color: COLOR.primary, bold: true, size: 28, font: 'Calibri' },
        paragraph: { spacing: { before: 360, after: 180 } },
      },
      {
        id: 'Heading3',
        name: 'Heading 3',
        basedOn: 'Normal',
        next: 'Normal',
        run: { color: COLOR.heading2, bold: true, size: 24, font: 'Calibri' },
        paragraph: { spacing: { before: 240, after: 120 } },
      },
      {
        id: 'Heading4',
        name: 'Heading 4',
        basedOn: 'Normal',
        next: 'Normal',
        run: { color: COLOR.heading3, bold: true, italics: true, size: 22, font: 'Calibri' },
        paragraph: { spacing: { before: 200, after: 80 } },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        margin: {
          top: convertInchesToTwip(1),
          bottom: convertInchesToTwip(1),
          left: convertInchesToTwip(1.25),
          right: convertInchesToTwip(1.25),
        },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'InterviewOS — Technical Project Report', color: '6B7280', size: 18, italics: true }),
            ],
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: COLOR.border } },
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'Department of Computer Science and Engineering    |    Page ', color: '6B7280', size: 18 }),
              new TextRun({ children: [PageNumber.CURRENT], color: '6B7280', size: 18 }),
              new TextRun({ text: ' of ', color: '6B7280', size: 18 }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], color: '6B7280', size: 18 }),
            ],
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 2, color: COLOR.border } },
          }),
        ],
      }),
    },
    children: docElements,
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('c:/interview_help/InterviewOS_Project_Report.docx', buffer);
  console.log('SUCCESS: InterviewOS_Project_Report.docx generated!');
}).catch(err => {
  console.error('ERROR:', err.message);
});
