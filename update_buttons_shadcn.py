import os
import re

target_words = ['submit', 'save', 'create', 'edit']
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
        if any(word in text_content for word in target_words):
            new_start_tag = start_tag
            
            # If the button doesn't have our target class, we should add it.
            # But we only want to override if it's meant to be a primary action.
            # Usually Shadcn Button defaults to primary. Let's just add the exact classes
            # to make sure it looks right: bg-[#5483B3] hover:bg-[#5483B3]/90 text-white
            if 'bg-[#5483B3]' not in new_start_tag:
                # Add to existing class attribute if it exists
                if 'class="' in new_start_tag:
                    new_start_tag = new_start_tag.replace('class="', 'class="bg-[#5483B3] hover:bg-[#5483B3]/90 text-white border-0 ')
                else:
                    new_start_tag = new_start_tag.replace('>', ' class="bg-[#5483B3] hover:bg-[#5483B3]/90 text-white border-0">')
                
                # Clean up conflicting classes just in case
                new_start_tag = re.sub(r'bg-\w+-\d+', '', new_start_tag) # bg-blue-600 etc
                new_start_tag = new_start_tag.replace('bg-primary', '')
                new_start_tag = new_start_tag.replace('bg-nfuko-primary', '')
                
            if new_start_tag != start_tag:
                modified = True
                return new_start_tag + inner_content + end_tag
                
        return match.group(0)

    new_content = btn_pattern.sub(replacer, content)

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated Shadcn {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.vue'):
            process_file(os.path.join(root, file))
