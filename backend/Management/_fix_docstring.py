import re

p = r'd:\Web Dev\Full Stack\UNI Management - Copy\backend\Management\services\result_services.py'
with open(p, encoding='utf-8') as f:
    content = f.read()

# The _validate_group docstring got mangled. Rebuild it cleanly using a regex
# that matches from the def line through the first body statement.
pattern = re.compile(
    r'    def _validate_group\(items: list\[dict\]\) -> None:\n'
    r'.*\n'                    # def line
    r'.*\n'                    # docstring opening (mangled)
    r'.*\n'                    # - The same calculation_type.
    r'.*\n'                    # - If AVERAGE, identical max_marks.
    r'.*\n'                    # docstring closing (mangled)
    r'.*first = items\[0\]\["assessment"\]',  # first body line
    re.DOTALL,
)

match = pattern.search(content)
if not match:
    print("NO MATCH")
else:
    replacement = (
        '    def _validate_group(items: list[dict]) -> None:\n'
        '        """Validate that all assessments in a group have:\n'
        '        - The same calculation_type.\n'
        '        - If AVERAGE, identical max_marks.\n'
        '        """\n'
        '        first = items[0]["assessment"]'
    )
    content = content[:match.start()] + replacement + content[match.end():]
    with open(p, 'w', encoding='utf-8') as f:
        f.write(content)
    print("FIXED")
