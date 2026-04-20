from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import io


async def generate_contract_pdf(contract) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=60, bottomMargin=60)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("title", parent=styles["Heading1"], alignment=1, fontSize=16)
    body_style = ParagraphStyle("body", parent=styles["Normal"], fontSize=11, leading=20)

    elements = []

    elements.append(Paragraph("기술이전 실시계약서", title_style))
    elements.append(Spacer(1, 20))

    info_data = [
        ["계약번호", contract.contract_no],
        ["계약기간", f"{contract.contract_period_start} ~ {contract.contract_period_end}"],
        ["실시료율", f"{contract.royalty_rate}%" if contract.royalty_rate else "-"],
        ["일시불", f"{contract.lump_sum:,}원" if contract.lump_sum else "-"],
    ]
    table = Table(info_data, colWidths=[120, 360])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 30))

    elements.append(Paragraph(
        "본 계약은 한국농업기술진흥원(이하 '진흥원')과 실시권자 간에 체결된 기술이전 실시계약입니다.",
        body_style,
    ))

    doc.build(elements)
    return buffer.getvalue()
