import os
import re

target_words = ['submit', 'save', 'create', 'edit']

# regex to match <button ...>...</button> or <Button ...>...</Button>
# This regex is simplified and might not handle deeply nested tags perfectly, 
# but works for most button usages.
btn_pattern = re.compile(r'(<(b|B)utton[^>]*>)(.*?)(</\2utton>)', re.IGNORECASE | re.DOTALL)

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    modified = False

    def replacer(match):
        nonlocal modified
        start_tag = match.group(1)
        inner_content = match.group(3)
        end_tag = match.group(4)

        # Check if the inner content has any of our target words
        text_content = re.sub(r'<[^>]+>', '', inner_content).lower()
        if any(word in text_content for word in target_words):
            # If so, replace the color classes in the start tag
            new_start_tag = start_tag
            
            # replace bg-nfuko-primary with bg-[#5483B3]
            if 'bg-nfuko-primary' in new_start_tag:
                new_start_tag = new_start_tag.replace('bg-nfuko-primary', 'bg-[#5483B3]')
                
            # replace hover:bg-[...] with hover:bg-[#5483B3]/90
            new_start_tag = re.sub(r'hover:bg-\S+', 'hover:bg-[#5483B3]/90', new_start_tag)
            
            # replace shadow-[...] with shadow-[#5483B3]/10
            new_start_tag = re.sub(r'shadow-\[#0050D8\]/10', 'shadow-[#5483B3]/10', new_start_tag)

            if new_start_tag != start_tag:
                modified = True
                return new_start_tag + inner_content + end_tag
                
        return match.group(0)

    new_content = btn_pattern.sub(replacer, content)

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.vue'):
            process_file(os.path.join(root, file))
