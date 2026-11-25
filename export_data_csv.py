"""Export this kit's saved DATA sheet to UTF-8 comma CSV without locale guessing.
Usage: python export_data_csv.py saved-workbook.xlsx new-output.csv
Requires only Python 3 standard library. Never recalculates or edits the workbook.
"""
import csv
import datetime as dt
import pathlib
import sys
import xml.etree.ElementTree as ET
import zipfile
from decimal import Decimal

NS = {'x': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
HEADERS = ['record_id','date','site_name','latitude','longitude','parameter','value','unit','notes']

def read_sheet(path, name):
    with zipfile.ZipFile(path) as z:
        wb = ET.fromstring(z.read('xl/workbook.xml'))
        props = wb.find('x:workbookPr', NS)
        if props is not None and props.get('date1904') in ('1','true'):
            raise ValueError('1904 date system is unsupported; do not guess dates')
        sheet = next(s for s in wb.findall('x:sheets/x:sheet',NS) if s.get('name') == name)
        rid = sheet.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
        rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        target = next(r.get('Target') for r in rels if r.get('Id') == rid)
        target = target.lstrip('/') if target.startswith('/') else 'xl/' + target
        ss = []
        if 'xl/sharedStrings.xml' in z.namelist():
            ss = [''.join(s.itertext()) for s in ET.fromstring(z.read('xl/sharedStrings.xml'))]
        cells = {}
        for c in ET.fromstring(z.read(target)).findall('.//x:c',NS):
            typ, value = c.get('t','n'), c.findtext('x:v','',NS)
            if typ == 's': value = ss[int(value)]
            elif typ == 'inlineStr': value = ''.join(c.find('x:is',NS).itertext())
            cells[c.get('r')] = (typ,value,c.find('x:f',NS) is not None)
        return cells

def export(path, output):
    cells = read_sheet(path, 'DATA')
    if [cells.get(c+'1',('','',False))[1] for c in 'ABCDEFGHI'] != HEADERS:
        raise ValueError('DATA schema differs from the nine-column kit')
    rows = []
    for r in range(2,302):
        row = []
        for col in 'ABCDEFGHI':
            typ, val, formula = cells.get(col+str(r),('n','',False))
            if formula or typ in ('e','b'):
                raise ValueError(f'{col}{r}: formula/error/boolean input is unsupported')
            if col == 'A' and val and typ == 'n':
                raise ValueError(f'A{r}: ID must be text; leading zeros cannot be recovered')
            if col == 'B' and val and typ == 'n':
                n = Decimal(val)
                if n != n.to_integral_value() or not 1 <= n <= 2958465 or n == 60:
                    raise ValueError(f'B{r}: invalid Excel date serial; correct workbook QA first')
                date = dt.date(1899,12,31) + dt.timedelta(days=int(n)-(n>60))
                val = f'{date.year:04}-{date.month:02}-{date.day:02}'
            # Numeric XML values already use the invariant decimal point.
            # All text (including invalid dates/numbers) stays byte-for-character exact.
            row.append(val)
        if any(row): rows.append(row)
    with pathlib.Path(output).open('x',encoding='utf-8-sig',newline='') as f:
        w = csv.writer(f); w.writerow(HEADERS); w.writerows(rows)
    return rows

if __name__ == '__main__':
    print(f'Exported {len(export(sys.argv[1],sys.argv[2]))} active rows')
