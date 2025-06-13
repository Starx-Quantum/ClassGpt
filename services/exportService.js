const fs = require('fs').promises;
const path = require('path');
const markdownpdf = require('markdown-pdf');
const { promisify } = require('util');

class ExportService {
  constructor() {
    this.exportDir = path.join(__dirname, '../exports');
    this.ensureExportDir();
  }

  async ensureExportDir() {
    try {
      await fs.mkdir(this.exportDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create export directory:', error);
    }
  }

  async exportMarkdown(content, filename) {
    const filepath = path.join(this.exportDir, `${filename}.md`);
    await fs.writeFile(filepath, content, 'utf8');
    return filepath;
  }

  async exportPDF(markdownContent, filename) {
    return new Promise((resolve, reject) => {
      const filepath = path.join(this.exportDir, `${filename}.pdf`);
      
      markdownpdf({
        cssPath: path.join(__dirname, '../assets/pdf-styles.css'),
        paperFormat: 'A4',
        paperOrientation: 'portrait'
      }).from.string(markdownContent).to(filepath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(filepath);
        }
      });
    });
  }

  async exportHTML(markdownContent, filename) {
    const marked = require('marked');
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${filename}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1, h2, h3 { color: #2c3e50; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
        blockquote { border-left: 4px solid #3498db; margin: 0; padding-left: 20px; color: #7f8c8d; }
    </style>
</head>
<body>
    ${marked.parse(markdownContent)}
</body>
</html>`;

    const filepath = path.join(this.exportDir, `${filename}.html`);
    await fs.writeFile(filepath, htmlContent, 'utf8');
    return filepath;
  }

  async exportJSON(data, filename) {
    const filepath = path.join(this.exportDir, `${filename}.json`);
    await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf8');
    return filepath;
  }

  getDownloadUrl(filename) {
    return `/exports/${path.basename(filename)}`;
  }
}

module.exports = new ExportService();
