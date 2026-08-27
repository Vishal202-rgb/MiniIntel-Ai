const Report = require('../models/Report');

const generateReport = async (data, type) => {
  try {
    // Create a dummy PDF/DOCX structure or string for now
    const content = {
      summary: `Auto-generated ${type} report`,
      data: data,
      generatedAt: new Date().toISOString()
    };
    
    const reportTitle = `${type} Report - ${new Date().toLocaleDateString()}`;
    
    const report = new Report({
      title: reportTitle,
      type: type,
      content: content,
      status: 'completed',
      fileUrl: `/reports/dummy-${Date.now()}.pdf`
    });

    await report.save();
    return report;
  } catch (error) {
    throw new Error('Error generating report: ' + error.message);
  }
};

module.exports = {
  generateReport
};
