const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace title margins
      content = content.replace(/<h1 className="([^"]*)mb-6([^"]*)">/g, '<h1 className="\-4\">');
      content = content.replace(/<h2 className="([^"]*)mb-6([^"]*)">/g, '<h2 className="\-4\">');
      
      // Replace some other layout things requested
      // The user wants 'Grey + White + Blue' and to fix cards being too large
      
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

processDir('./src/pages');
console.log('Done titles');
