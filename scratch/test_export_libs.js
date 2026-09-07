const PDFDocument = require('pdfkit');
const { Document, Paragraph, TextRun, Packer, HeadingLevel } = require('docx');

async function testExports() {
  // Test PDF
  const pdfBuffer = await new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
    doc.fontSize(18).text('MineIntel AI Report', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text('Sample content generated for testing.');
    doc.end();
  });
  console.log('PDF generated successfully, size:', pdfBuffer.length);

  // Test DOCX
  const docxDoc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: 'MineIntel AI Report',
          heading: HeadingLevel.TITLE
        }),
        new Paragraph({
          children: [new TextRun('Sample content generated for testing.')]
        })
      ]
    }]
  });
  const docxBuffer = await Packer.toBuffer(docxDoc);
  console.log('DOCX generated successfully, size:', docxBuffer.length);
}

testExports().catch(console.error);
