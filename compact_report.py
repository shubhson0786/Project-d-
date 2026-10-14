from pathlib import Path
from docx import Document
from docx.oxml.ns import qn
from docx.shared import Pt

root=Path(__file__).parent
doc=Document(root/'Stashflow_AKTU_Project_Report_Completed.docx')
# Let chapters flow naturally rather than leaving nearly empty continuation pages.
for p in doc.paragraphs:
    if p.style.name == 'Heading 1':
        p.paragraph_format.page_break_before=False
        p.paragraph_format.keep_with_next=True
        p.paragraph_format.space_before=Pt(24)
    if not p.text.strip() and not p._p.xpath('.//w:br | .//w:sectPr | .//w:fldChar'):
        p.paragraph_format.space_before=Pt(0)
        p.paragraph_format.space_after=Pt(0)
        p.paragraph_format.line_spacing=Pt(1)
        for r in p.runs:r.font.size=Pt(1)
for section in list(doc.sections)[1:]:
    section.different_first_page_header_footer=False
    section.start_type=2
doc.save(root/'Stashflow_AKTU_Report_Corrected.docx')
print(root/'Stashflow_AKTU_Report_Corrected.docx')
