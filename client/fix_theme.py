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
    r'bg-\[\#222\]': 'bg-gray-100 dark:bg-[#222]',
    
    # Borders
    r'border-neutral-800': 'border-gray-200 dark:border-neutral-800',
    r'border-neutral-700': 'border-gray-300 dark:border-neutral-700',
    r'border-neutral-600': 'border-gray-400 dark:border-neutral-600',
    r'border-white/10': 'border-gray-200 dark:border-white/10',
    r'divide-neutral-800': 'divide-gray-200 dark:divide-neutral-800',
    r'divide-neutral-700': 'divide-gray-200 dark:divide-neutral-700',
    
    # Text colors
    r'(?<!\bdark:)text-neutral-200': 'text-gray-800 dark:text-neutral-200',
    r'(?<!\bdark:)text-neutral-300': 'text-gray-700 dark:text-neutral-300',
    r'(?<!\bdark:)text-neutral-400': 'text-gray-600 dark:text-neutral-400',
    r'(?<!\bdark:)text-neutral-500': 'text-gray-500 dark:text-neutral-500',
    
    # Badges/Glows
    r'bg-indigo-500/10': 'bg-indigo-100 dark:bg-indigo-500/10',
    r'bg-blue-500/10': 'bg-blue-100 dark:bg-blue-500/10',
    r'bg-green-500/10': 'bg-green-100 dark:bg-green-500/10',
    r'bg-yellow-500/10': 'bg-yellow-100 dark:bg-yellow-500/10',
    r'bg-red-500/10': 'bg-red-100 dark:bg-red-500/10',
    r'bg-purple-500/10': 'bg-purple-100 dark:bg-purple-500/10',
    
    # Inputs focus
    r'focus:border-indigo-500': 'focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500',
    
    # Tables hover
    r'hover:bg-neutral-800': 'hover:bg-gray-50 dark:hover:bg-neutral-800',
    r'hover:bg-\[\#222\]': 'hover:bg-gray-100 dark:hover:bg-[#222]',
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # We only want to replace text-white if it's NOT inside a button or badge that has colored background
    # This is tricky with regex, so we'll do it manually by finding classNames
    
    def replacer(match):
        class_str = match.group(1)
        
        # Apply standard mappings
        for pattern, replacement in class_mapping.items():
            class_str = re.sub(r'\b' + pattern + r'\b', replacement, class_str)
            
        # Handle text-white specifically:
        # If it doesn't have bg-indigo, bg-blue, bg-green, bg-red, etc., replace it with text-gray-900 dark:text-white
        if 'text-white' in class_str and not 'dark:text-white' in class_str:
            if not re.search(r'bg-(indigo|blue|green|red|yellow|purple|amber|emerald)-(500|600|700)', class_str):
                class_str = re.sub(r'\btext-white\b', 'text-gray-900 dark:text-white', class_str)
                
        return 'className="' + class_str + '"'

    content = re.sub(r'className="([^"]+)"', replacer, content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for d in directories_to_scan:
    if os.path.exists(d):
        for root, dirs, files in os.walk(d):
            for file in files:
                if file.endswith('.jsx') or file.endswith('.js'):
                    process_file(os.path.join(root, file))
