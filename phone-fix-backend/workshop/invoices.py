import os
import io
import json
import socket
from datetime import datetime
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit
import boto3
from django.utils import timezone
from django.conf import settings
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm

def get_s3_client():
    """Retorna cliente S3 compatible con MinIO resolviendo hostnames para evitar rechazo RFC de botocore"""
    endpoint = os.environ.get('MINIO_ENDPOINT', 'http://minio_pfix:9000')
    try:
        parts = urlsplit(endpoint)
        if parts.hostname and '_' in parts.hostname:
            ip = socket.gethostbyname(parts.hostname)
            netloc = f"{ip}:{parts.port}" if parts.port else ip
            endpoint = urlunsplit((parts.scheme, netloc, parts.path, parts.query, parts.fragment))
    except Exception:
        pass

    return boto3.client(
        's3',
        endpoint_url=endpoint,
        aws_access_key_id=os.environ.get('MINIO_ROOT_USER', 'admin'),
        aws_secret_access_key=os.environ.get('MINIO_ROOT_PASSWORD', 'minioadmin123'),
        region_name='us-east-1'
    )

def ensure_bucket_exists(s3_client=None, bucket_name=None):
    if not s3_client:
        s3_client = get_s3_client()
    if not bucket_name:
        bucket_name = os.environ.get('MINIO_BUCKET_NAME', 'phonefix-media')

    try:
        buckets = [b['Name'] for b in s3_client.list_buckets().get('Buckets', [])]
        if bucket_name not in buckets:
            s3_client.create_bucket(Bucket=bucket_name)
        
        # Política de lectura pública para comprobantes
        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "PublicReadInvoices",
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{bucket_name}/*"]
                }
            ]
        }
        s3_client.put_bucket_policy(Bucket=bucket_name, Policy=json.dumps(policy))
    except Exception as e:
        print(f"Advertencia al verificar bucket MinIO: {e}")

def get_public_url(s3_key: str) -> str:
    public_base = os.environ.get('MINIO_PUBLIC_ENDPOINT', 'http://localhost:9000')
    bucket_name = os.environ.get('MINIO_BUCKET_NAME', 'phonefix-media')
    return f"{public_base.rstrip('/')}/{bucket_name}/{s3_key.lstrip('/')}"

def generate_repair_invoice_pdf(order) -> tuple[str, str]:
    """
    Genera el comprobante / factura de servicio técnico con logo oficial PhoneFix,
    términos de garantía de 3 semanas, liquidación bicanal y almacenamiento en MinIO.
    Retorna (s3_key, public_url).
    """
    buffer = io.BytesIO()
    
    # Documento tamaño Carta con márgenes optimizados
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Estilos tipográficos Cyber-Clean
    primary_color = colors.HexColor("#080B11")
    cyan_accent = colors.HexColor("#00B4D8")
    dark_gray = colors.HexColor("#1E293B")
    text_muted = colors.HexColor("#64748B")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=primary_color
    )

    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=text_muted
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=dark_gray,
        spaceBefore=8,
        spaceAfter=4
    )

    label_style = ParagraphStyle(
        'FieldLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=dark_gray
    )

    val_style = ParagraphStyle(
        'FieldVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0F172A")
    )

    story = []

    # 1. ENCABEZADO CON LOGO OFICIAL PHONEFIX Y DATOS DEL TALLER
    logo_path = Path(__file__).resolve().parent / 'assets' / 'logo_phonefix.jpg'
    logo_element = None
    if logo_path.exists():
        try:
            logo_element = Image(str(logo_path), width=1.1 * inch, height=1.1 * inch)
        except Exception:
            logo_element = None

    header_info = [
        Paragraph("<b>PHONEFIX MONTERO</b>", title_style),
        Paragraph("Taller Especializado en Reparación Móvil y Microelectrónica", subtitle_style),
        Paragraph("Afiliado a <b>ASOTTECMO</b> (Asociación de Técnicos de Montero)", subtitle_style),
        Paragraph("Montero, Santa Cruz - Bolivia • Cel / WhatsApp: <b>+591 76000000</b>", subtitle_style),
        Paragraph("NIT: 8960735014 • Atención: Lunes a Sábado", subtitle_style),
    ]

    clean_ticket = order.ticket_number.replace('#', '').strip()
    invoice_num = f"FAC-{clean_ticket}"
    now_str = timezone.now().strftime("%d/%m/%Y %H:%M")

    doc_meta = [
        Paragraph(f"<b>COMPROBANTE DE ENTREGA Y GARANTÍA</b>", ParagraphStyle('MetaH', fontName='Helvetica-Bold', fontSize=10, textColor=cyan_accent, alignment=2)),
        Paragraph(f"Nº Ticket: <b>#{order.ticket_number}</b>", ParagraphStyle('Meta1', fontName='Helvetica', fontSize=9, textColor=dark_gray, alignment=2)),
        Paragraph(f"Nº Factura/Control: <b>{invoice_num}</b>", ParagraphStyle('Meta2', fontName='Helvetica', fontSize=8.5, textColor=dark_gray, alignment=2)),
        Paragraph(f"Fecha Emisión: {now_str}", ParagraphStyle('Meta3', fontName='Helvetica', fontSize=8, textColor=text_muted, alignment=2)),
        Paragraph(f"Estado: <b>{order.get_status_display()}</b>", ParagraphStyle('Meta4', fontName='Helvetica-Bold', fontSize=8.5, textColor=colors.HexColor("#16A34A"), alignment=2)),
    ]

    header_data = []
    if logo_element:
        header_data.append([logo_element, header_info, doc_meta])
        col_widths = [1.2 * inch, 4.0 * inch, 2.3 * inch]
    else:
        header_data.append([header_info, doc_meta])
        col_widths = [4.8 * inch, 2.7 * inch]

    header_table = Table(header_data, colWidths=col_widths)
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#E2E8F0"), spaceAfter=10))

    # 2. DATOS DEL CLIENTE Y DEL DISPOSITIVO (EN 2 COLUMNAS)
    client = order.client
    device = order.device

    info_box_data = [
        [
            Paragraph("<b>DATOS DEL CLIENTE</b>", h2_style),
            Paragraph("<b>DATOS DEL EQUIPO EN TALLER</b>", h2_style)
        ],
        [
            Paragraph(f"<b>Nombre:</b> {client.full_name}", val_style),
            Paragraph(f"<b>Equipo:</b> {device.brand} {device.model} ({device.color or 'Sin color'})", val_style)
        ],
        [
            Paragraph(f"<b>C.I. / NIT:</b> {client.ci or 'Sin C.I.'}", val_style),
            Paragraph(f"<b>IMEI:</b> {device.imei or device.imei_printed or 'No registrado'}", val_style)
        ],
        [
            Paragraph(f"<b>Teléfono Ref:</b> {client.phone_primary} {(' / ' + client.phone_reference) if client.phone_reference else ''}", val_style),
            Paragraph(f"<b>Falla Declarada:</b> {order.issue_description}", val_style)
        ]
    ]

    info_table = Table(info_box_data, colWidths=[3.75 * inch, 3.75 * inch])
    info_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 12))

    # 3. DETALLE DE TRABAJO REALIZADO Y REPUESTOS IMPUTADOS
    story.append(Paragraph("<b>DETALLE DE SERVICIO TÉCNICO Y REPUESTOS</b>", h2_style))
    
    parts_data = [
        [
            Paragraph("<b>Descripción / Concepto</b>", label_style),
            Paragraph("<b>Origen / Repuesto</b>", label_style),
            Paragraph("<b>Subtotal (Bs.)</b>", ParagraphStyle('RLabel', parent=label_style, alignment=2))
        ]
    ]

    # Trabajo de mano de obra y servicio
    tech_work = order.authorized_work or order.technician_notes or "Servicio de diagnóstico, mantenimiento y reparación"
    parts_data.append([
        Paragraph(f"<b>Mano de Obra y Servicio Técnico:</b> {tech_work}", val_style),
        Paragraph("Servicio Técnico Especializado", val_style),
        Paragraph(f"Bs. {order.estimated_total:.2f}", ParagraphStyle('RVal', parent=val_style, alignment=2))
    ])

    for part in order.parts.all():
        origin = "Almacén PhoneFix" if part.source_type == "INTERNAL" else (part.supplier.name if part.supplier else "Caseta Externa")
        parts_data.append([
            Paragraph(f"• Repuesto: {part.name}", val_style),
            Paragraph(origin, val_style),
            Paragraph(f"Bs. {part.price:.2f}", ParagraphStyle('RVal2', parent=val_style, alignment=2))
        ])

    parts_table = Table(parts_data, colWidths=[4.2 * inch, 2.0 * inch, 1.3 * inch])
    parts_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0F172A")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
    ]))
    story.append(parts_table)
    story.append(Spacer(1, 12))

    # 4. LIQUIDACIÓN FINANCIERA BICANAL (EFECTIVO Y QR)
    story.append(Paragraph("<b>LIQUIDACIÓN FINANCIERA BICANAL (BOB / Bs.)</b>", h2_style))

    initial_deposit = order.deposit_cash + order.deposit_qr
    final_payment = order.final_payment_cash + order.final_payment_qr
    total_paid = order.total_collected

    fin_data = [
        [
            Paragraph("Presupuesto Total Acordado:", label_style),
            Paragraph(f"<b>Bs. {order.estimated_total:.2f}</b>", ParagraphStyle('R1', parent=val_style, alignment=2)),
            Paragraph("Seña Inicial (Recepción):", label_style),
            Paragraph(f"Bs. {initial_deposit:.2f} <i>(Ef: {order.deposit_cash:.2f} | QR: {order.deposit_qr:.2f})</i>", ParagraphStyle('R2', parent=val_style, alignment=2))
        ],
        [
            Paragraph("Total Cancelado Efectivamente:", label_style),
            Paragraph(f"<b>Bs. {total_paid:.2f}</b>", ParagraphStyle('R3', parent=val_style, alignment=2, textColor=colors.HexColor("#16A34A"))),
            Paragraph("Pago Final al Retirar:", label_style),
            Paragraph(f"Bs. {final_payment:.2f} <i>(Ef: {order.final_payment_cash:.2f} | QR: {order.final_payment_qr:.2f})</i>", ParagraphStyle('R4', parent=val_style, alignment=2))
        ],
        [
            Paragraph("Saldo Pendiente de Cobro:", label_style),
            Paragraph(f"<b>Bs. {order.remaining_balance:.2f}</b>", ParagraphStyle('R5', parent=val_style, alignment=2, textColor=colors.HexColor("#DC2626") if order.remaining_balance > 0 else colors.HexColor("#16A34A"))),
            Paragraph("Seña Devuelta (Si aplica):", label_style),
            Paragraph(f"Bs. {order.deposit_refunded:.2f}", ParagraphStyle('R6', parent=val_style, alignment=2))
        ]
    ]

    fin_table = Table(fin_data, colWidths=[2.2 * inch, 1.55 * inch, 2.2 * inch, 1.55 * inch])
    fin_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(fin_table)
    story.append(Spacer(1, 12))

    # 5. PÓLIZA DE GARANTÍA LEGAL (ESTÁNDAR 3 SEMANAS)
    warranty_title = f"PÓLIZA DE GARANTÍA: {order.get_warranty_display().upper()}"
    expires_str = order.warranty_expires_at.strftime("%d/%m/%Y") if order.warranty_expires_at else "3 semanas computables desde la fecha de retiro"
    
    warranty_clause = (
        f"<b>Términos de Garantía Legal:</b> El presente servicio cuenta con garantía válida hasta el <b>{expires_str}</b>. "
        "Cubre exclusivamente defectos de fabricación o ensamble de las piezas sustituidas. "
        "<b>Exclusiones:</b> No cubre caídas, presión indebida, rotura posterior de pantalla o cristal, humedad/contacto con líquidos, "
        "intervención por terceros o sellos de seguridad violentados."
    )

    warranty_box = [
        [Paragraph(f"<b>{warranty_title}</b>", ParagraphStyle('WH', fontName='Helvetica-Bold', fontSize=9, textColor=colors.HexColor("#0284C7")))],
        [Paragraph(warranty_clause, ParagraphStyle('WB', fontName='Helvetica', fontSize=7.5, leading=10, textColor=dark_gray))]
    ]
    warranty_table = Table(warranty_box, colWidths=[7.5 * inch])
    warranty_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F0F9FF")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#BAE6FD")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(warranty_table)
    story.append(Spacer(1, 24))

    # 6. ESPACIO PARA FIRMAS DE CONFORMIDAD (TÉCNICO Y CLIENTE)
    signatures_data = [
        [
            Paragraph("________________________________________<br/><b>Firma Técnico Responsable</b><br/>PHONEFIX MONTERO", ParagraphStyle('Sig1', fontName='Helvetica', fontSize=8, alignment=1, textColor=dark_gray)),
            Paragraph("________________________________________<br/><b>Firma de Conformidad Cliente</b><br/>Recibí a entera satisfacción", ParagraphStyle('Sig2', fontName='Helvetica', fontSize=8, alignment=1, textColor=dark_gray))
        ]
    ]
    sig_table = Table(signatures_data, colWidths=[3.75 * inch, 3.75 * inch])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(sig_table)

    # Construir PDF en memoria
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()

    # Subir a MinIO S3
    s3 = get_s3_client()
    bucket_name = os.environ.get('MINIO_BUCKET_NAME', 'phonefix-media')
    ensure_bucket_exists(s3, bucket_name)

    safe_ticket = clean_ticket.replace('/', '_').replace('-', '_')
    s3_key = f"invoices/factura_{safe_ticket}.pdf"

    s3.put_object(
        Bucket=bucket_name,
        Key=s3_key,
        Body=pdf_bytes,
        ContentType='application/pdf'
    )

    # Actualizar la orden en base de datos
    order.invoice_pdf_key = s3_key
    order.invoice_number = invoice_num
    order.invoice_generated_at = timezone.now()
    order.save()

    public_url = get_public_url(s3_key)
    return s3_key, public_url
