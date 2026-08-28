import os
import re

directories_to_scan = [
    r"C:\Users\user\Desktop\MineIntel-AI-SIH26023\client\src\pages",
    r"C:\Users\user\Desktop\MineIntel-AI-SIH26023\client\src\components"
]

class_mapping = {
    # Backgrounds
    r'bg-\[\#1A1A1A\]': 'bg-white dark:bg-dark-card',
    r'bg-\[\#111111\]': 'bg-gray-50 dark:bg-dark-bg',
    r'bg-\[\#111\]': 'bg-gray-50 dark:bg-dark-bg',
    r'bg-\[\#151515\]': 'bg-gray-50 dark:bg-[#151515]',
    r'bg-\[\#222222\]': 'bg-gray-100 dark:bg-[#222]',
    r'bg-\[\#222\]': 'bg-gray-100 dark:bg-[#222]',
    r'bg-\[\#2A2A2A\]': 'bg-gray-200 dark:bg-[#2A2A2A]',
    
    # Tables hover
    r'hover:bg-\[\#222\]': 'hover:bg-gray-100 dark:hover:bg-[#222]',
    r'hover:bg-\[\#2A2A2A\]': 'hover:bg-gray-200 dark:hover:bg-[#2A2A2A]',
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    def replacer(match):
        class_str = match.group(1)
        
        # Apply standard mappings without strict \b since brackets break word boundaries
        for pattern, replacement in class_mapping.items():
            class_str = re.sub(r'(?<!\S)' + pattern + r'(?!\S)', replacement, class_str)
                
        return 'className="' + class_str + '"'

    content = re.sub(r'className="([^"]+)"', replacer, content)
    
    # Also fix some duplicate classes that might have been created by my previous script
    content = content.replace("dark:bg-dark-card dark:bg-[#1A1A1A]", "dark:bg-dark-card")
    content = content.replace("bg-white bg-white", "bg-white")
    content = content.replace("border-gray-200 dark:border-gray-200", "dark:border-gray-200")
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

for d in directories_to_scan:
    if os.path.exists(d):
        for root, dirs, files in os.walk(d):
            for file in files:
                if file.endswith('.jsx') or file.endswith('.js'):
                    process_file(os.path.join(root, file))
