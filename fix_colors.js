const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.jsx') || dirFile.endsWith('.js')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
};

const files = walkSync('./client/src');
let changedFiles = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Replace blue variations with amber
  content = content.replace(/\b(bg|text|border|ring|shadow|fill|stroke|from|via|to|outline)-blue-(\d{2,3}(?:\/\d{1,2})?)\b/g, '\-amber-\');
  content = content.replace(/\bhover:(bg|text|border|ring|shadow|fill)-blue-(\d{2,3}(?:\/\d{1,2})?)\b/g, 'hover:\-amber-\');
  content = content.replace(/\bfocus:(bg|text|border|ring|shadow|fill)-blue-(\d{2,3}(?:\/\d{1,2})?)\b/g, 'focus:\-amber-\');
  content = content.replace(/\bactive:(bg|text|border|ring|shadow|fill)-blue-(\d{2,3}(?:\/\d{1,2})?)\b/g, 'active:\-amber-\');
  content = content.replace(/\bdark:(bg|text|border|ring|shadow|fill)-blue-(\d{2,3}(?:\/\d{1,2})?)\b/g, 'dark:\-amber-\');
  content = content.replace(/\bdark:hover:(bg|text|border|ring|shadow|fill)-blue-(\d{2,3}(?:\/\d{1,2})?)\b/g, 'dark:hover:\-amber-\');
  content = content.replace(/\bselection:bg-blue-(\d{2,3}(?:\/\d{1,2})?)\b/g, 'selection:bg-amber-\');
  
  // Replace purple variations with amber
  content = content.replace(/\b(bg|text|border|ring|shadow|fill|stroke|from|via|to|outline)-purple-(\d{2,3}(?:\/\d{1,2})?)\b/g, '\-amber-\');
  content = content.replace(/\bhover:(bg|text|border|ring|shadow|fill)-purple-(\d{2,3}(?:\/\d{1,2})?)\b/g, 'hover:\-amber-\');
  content = content.replace(/\bfocus:(bg|text|border|ring|shadow|fill)-purple-(\d{2,3}(?:\/\d{1,2})?)\b/g, 'focus:\-amber-\');
  content = content.replace(/\bdark:(bg|text|border|ring|shadow|fill)-purple-(\d{2,3}(?:\/\d{1,2})?)\b/g, 'dark:\-amber-\');
  content = content.replace(/\bdark:hover:(bg|text|border|ring|shadow|fill)-purple-(\d{2,3}(?:\/\d{1,2})?)\b/g, 'dark:hover:\-amber-\');

  // Replace indigo variations with amber
  content = content.replace(/\b(bg|text|border|ring|shadow|fill|stroke|from|via|to|outline)-indigo-(\d{2,3}(?:\/\d{1,2})?)\b/g, '\-amber-\');
  content = content.replace(/\bhover:(bg|text|border|ring|shadow|fill)-indigo-(\d{2,3}(?:\/\d{1,2})?)\b/g, 'hover:\-amber-\');
  content = content.replace(/\bfocus:(bg|text|border|ring|shadow|fill)-indigo-(\d{2,3}(?:\/\d{1,2})?)\b/g, 'focus:\-amber-\');
  content = content.replace(/\bdark:(bg|text|border|ring|shadow|fill)-indigo-(\d{2,3}(?:\/\d{1,2})?)\b/g, 'dark:\-amber-\');
  content = content.replace(/\bdark:hover:(bg|text|border|ring|shadow|fill)-indigo-(\d{2,3}(?:\/\d{1,2})?)\b/g, 'dark:hover:\-amber-\');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
    console.log(Updated );
  }
}
console.log(Done. Changed  files.);
