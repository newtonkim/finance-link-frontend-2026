import os
import re

target_words = ['submit', 'save', 'create', 'edit', 'add']
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

        text_content = re.sub(r'<[^>]+>', '', inner_content).lower()
        # Check if the inner content has any of our target words as full words
        has_target = False
        words = re.findall(r'\w+', text_content)
        for w in target_words:
            if w in words:
                has_target = True
                break
                
        if has_target:
            new_start_tag = start_tag
            
            # If the button doesn't have the new target class bg-[#052659], add/replace it
            if 'bg-[#052659]' not in new_start_tag:
                # Add to existing class attribute if it exists
                if 'class="' in new_start_tag:
                    new_start_tag = new_start_tag.replace('class="', 'class="bg-[#052659] hover:bg-[#052659]/90 text-white border-0 ')
                else:
                    new_start_tag = new_start_tag.replace('>', ' class="bg-[#052659] hover:bg-[#052659]/90 text-white border-0">')
                
                # Clean up conflicting classes
                new_start_tag = re.sub(r'bg-\w+-\d+', '', new_start_tag) # bg-blue-600 etc
                new_start_tag = new_start_tag.replace('bg-primary', '')
                new_start_tag = new_start_tag.replace('bg-nfuko-primary', '')
                new_start_tag = new_start_tag.replace('bg-[#0050D8]', '')
                new_start_tag = re.sub(r'hover:bg-\S+', 'hover:bg-[#052659]/90', new_start_tag)
                new_start_tag = re.sub(r'shadow-\S+', 'shadow-sm', new_start_tag)
                
            if new_start_tag != start_tag:
                modified = True
                return new_start_tag + inner_content + end_tag
                
        return match.group(0)

    new_content = btn_pattern.sub(replacer, content)

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated Comprehensive {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.vue'):
            process_file(os.path.join(root, file))
