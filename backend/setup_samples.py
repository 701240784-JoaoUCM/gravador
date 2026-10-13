import os
import json
import uuid
from pathlib import Path
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = BASE_DIR / "uploads"
MEDIA_FILE = DATA_DIR / "media.json"

DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
for sub in ["videos", "images", "pdfs", "audios"]:
    (UPLOADS_DIR / sub).mkdir(parents=True, exist_ok=True)

def create_sample_image():
    img_path = UPLOADS_DIR / "images" / "sample_academic_cover.png"
    if not img_path.exists():
        img = Image.new("RGB", (800, 600), color=(30, 58, 138))
        draw = ImageDraw.Draw(img)
        draw.rectangle([40, 40, 760, 560], outline=(255, 255, 255), width=4)
        draw.text((80, 100), "PROJETO ACADEMICO", fill=(255, 255, 255))
        draw.text((80, 160), "Gravador de Video & Gerenciador Multimidia", fill=(224, 231, 255))
        draw.text((80, 240), "React Native (Expo) + FastAPI", fill=(147, 197, 253))
        draw.text((80, 300), "Deploy Cloud Multiplataforma (Render)", fill=(191, 219, 254))
        draw.text((80, 480), f"Gerado em: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC", fill=(203, 213, 225))
        img.save(img_path)
    return "images/sample_academic_cover.png", img_path.stat().st_size

def create_sample_pdf():
    pdf_path = UPLOADS_DIR / "pdfs" / "sample_academic_report.pdf"
    if not pdf_path.exists():
        c = canvas.Canvas(str(pdf_path), pagesize=letter)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(60, 740, "Relatorio Tecnico do Projeto")
        c.setFont("Helvetica", 14)
        c.drawString(60, 710, "Gravador de Video e Central Multimidia")
        c.setStrokeColorRGB(0.2, 0.4, 0.8)
        c.setLineWidth(2)
        c.line(60, 695, 550, 695)
        c.setFont("Helvetica", 11)
        c.drawString(60, 660, "1. Escopo e Tecnologias:")
        c.drawString(80, 640, "- Frontend: React Native com Expo SDK 57 (JavaScript puro, tema claro)")
        c.drawString(80, 620, "- Backend: Python FastAPI com armazenamento estatico e catalogo JSON")
        c.drawString(80, 600, "- Gravacao de video nativa e suporte a reproducao de midia completa")
        c.drawString(80, 580, "- Upload via multipart/form-data sem gargalo Hermes")
        c.drawString(60, 540, "2. Arquitetura de Nuvem:")
        c.drawString(80, 520, "- Deploy unificado no Render servindo frontend estatico e endpoints REST")
        c.drawString(80, 500, "- Suporte a headers x-forwarded-proto para SSL seguro")
        c.drawString(60, 440, "Status de Aprovacao: 100% Validado")
        c.save()
    return "pdfs/sample_academic_report.pdf", pdf_path.stat().st_size

def create_sample_video():
    vid_path = UPLOADS_DIR / "videos" / "sample_demo_clip.mp4"
    if not vid_path.exists():
        import requests
        try:
            sample_url = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
            r = requests.get(sample_url, timeout=10, stream=True)
            if r.status_code == 200:
                with open(vid_path, "wb") as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        f.write(chunk)
            else:
                raise Exception("Falha ao baixar video demo")
        except Exception:
            with open(vid_path, "wb") as f:
                f.write(b"\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00isommp42\x00\x00\x00\x08free")
    return "videos/sample_demo_clip.mp4", vid_path.stat().st_size

def setup():
    img_rel, img_size = create_sample_image()
    pdf_rel, pdf_size = create_sample_pdf()
    vid_rel, vid_size = create_sample_video()

    now_iso = datetime.utcnow().isoformat() + "Z"

    existing = []
    if MEDIA_FILE.exists():
        try:
            with open(MEDIA_FILE, "r", encoding="utf-8") as f:
                existing = json.load(f)
        except Exception:
            existing = []

    existing_rel_paths = {i.get("relative_path") for i in existing}

    samples = [
        {
            "id": "sample-vid-01",
            "title": "Amostra de Video Demonstrativo",
            "description": "Clipe em alta definicao para demonstracao academica do reprodutor integrado.",
            "type": "video",
            "filename": "sample_demo_clip.mp4",
            "stored_filename": "sample_demo_clip.mp4",
            "relative_path": vid_rel,
            "url": f"/uploads/{vid_rel}",
            "size_bytes": vid_size,
            "created_at": now_iso
        },
        {
            "id": "sample-img-01",
            "title": "Capa do Projeto Academico",
            "description": "Identidade visual da aplicacao com especificacoes tecnicas.",
            "type": "image",
            "filename": "sample_academic_cover.png",
            "stored_filename": "sample_academic_cover.png",
            "relative_path": img_rel,
            "url": f"/uploads/{img_rel}",
            "size_bytes": img_size,
            "created_at": now_iso
        },
        {
            "id": "sample-pdf-01",
            "title": "Relatorio Tecnico de Engenharia",
            "description": "Documento oficial detalhando os componentes do sistema e integracao Render.",
            "type": "pdf",
            "filename": "sample_academic_report.pdf",
            "stored_filename": "sample_academic_report.pdf",
            "relative_path": pdf_rel,
            "url": f"/uploads/{pdf_rel}",
            "size_bytes": pdf_size,
            "created_at": now_iso
        }
    ]

    for s in samples:
        if s["relative_path"] not in existing_rel_paths:
            existing.append(s)

    with open(MEDIA_FILE, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    setup()
