"""엑셀 수정 후: python update_data.py (openpyxl 필요)."""
import json
from pathlib import Path
import openpyxl

root = Path(__file__).resolve().parent
source = root.parent / '프로그램별_재원_2026_2027.xlsx'
book = openpyxl.load_workbook(source, data_only=True)
sheet = book['프로그램별 재원']
records = []
for row in sheet.iter_rows(min_row=7, max_row=38, values_only=True):
    sector, account, group, program, a, b = row[:6]
    if not isinstance(a, (float, int)) or not isinstance(b, (float, int)):
        raise ValueError(f'수치값이 아닌 금액: {program}')
    records.append(dict(id=len(records)+1, sector=sector, account=account,
                        group=group or '', program=program or '', a=a, b=b))
payload = {'source': source.name, 'unit': '억 원', 'rows': records}
(root / 'data.js').write_text('window.BUDGET_DATA = ' + json.dumps(payload, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
print(f'data.js 갱신 완료: {len(records)}개 항목')
