import json
import re
from collections import defaultdict

with open("./components/department_data_to_parse2.txt", 'r') as f:
    text = f.read()
    blocks = text.strip().split("\n---\n")

    # Build prefix-to-department mapping
    prefix_to_dept_info = {}
    for block in blocks:
        lines = block.strip().splitlines()
        if len(lines) >= 3:
            name = lines[0].strip()
            abbrev = lines[1].strip()
            prefixes = [p.strip() for p in lines[2].split(",")]
            for p in prefixes:
                prefix_to_dept_info[p] = {"name": name, "abbreviation": abbrev}

def infer_dept_info(course_code):
    prefix = course_code.split()[0]
    return prefix_to_dept_info.get(prefix)

def parse_block(block):
    lines = block.strip().splitlines()
    if len(lines) < 3:
        return None

    department = {
        "name": lines[0].strip(),
        "abbreviation": lines[1].strip(),
        "prefixes": [p.strip() for p in lines[2].split(",")],
        "concentrations": []
    }

    comment = next((line for line in lines if line.startswith("Comment:")), None)
    if comment:
        department["comment"] = comment.replace("Comment:", "").strip()

    current_conc = None
    current_reqs = defaultdict(list)

    for line in lines[3:]:
        line = line.strip()
        if not line or line.startswith("Comment:"):
            continue
        if line.startswith("•"):
            name = line[1:].strip()
            if "Minor" in name:
                current_conc = None
                continue
            current_conc = {
                "name": name,
                "outside_requirements": [],
                "abbreviation": department["abbreviation"]
            }
            # if "Teacher Licensure" in name:
            #     current_conc["outside_requirements"] = [{"dept": "Education"}]
            department["concentrations"].append(current_conc)
            current_reqs = defaultdict(list)
        elif current_conc:
            match = re.match(r"([A-Z]+ \d+)", line)
            if match:
                course_code = match.group(1)
                dept_info = infer_dept_info(course_code)
                if dept_info:
                    current_reqs[(dept_info["name"], dept_info["abbreviation"])].append(course_code)

        if current_conc and current_reqs:
            current_conc["outside_requirements"] = [
                {"dept": name, "abbreviation": abbrev, "courses": v}
                for (name, abbrev), v in current_reqs.items()
            ]

    return department
        
departments = [parse_block(block) for block in blocks if parse_block(block)]

# Deal with education
# for dept in departments:
#     for concentration in dept['concentrations']:
#         for osr in concentration['outside_requirements']:
#             if osr['dept'] == 'Education':
#                 osr['abbreviation'] = 'Ed'
#                 osr['courses'] = [1]
