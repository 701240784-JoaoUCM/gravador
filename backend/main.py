import os
import json
import uuid
import shutil
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = BASE_DIR / "uploads"
WEB_APP_DIR = BASE_DIR / "web_app"

DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
for sub in ["videos", "images", "pdfs", "audios"]:
    (UPLOADS_DIR / sub).mkdir(parents=True, exist_ok=True)

MEDIA_FILE = DATA_DIR / "media.json"
if not MEDIA_FILE.exists():
    MEDIA_FILE.write_text("[]", encoding="utf-8")

def get_base_url(request: Request) -> str:
    proto = request.headers.get("x-forwarded-proto")
    host = request.headers.get("x-forwarded-host")
    if proto and host:
        return f"{proto}://{host}"
    return str(request.base_url).rstrip("/")

def read_media():
    try:
        with open(MEDIA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def write_media(items):
    with open(MEDIA_FILE, "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2, ensure_ascii=False)

def resolve_folder_and_type(filename: str, content_type: Optional[str] = None):
    ext = Path(filename).suffix.lower()
    ct = (content_type or "").lower()
    if ext in [".mp4", ".mov", ".avi", ".mkv", ".webm"] or "video" in ct:
        return "videos", "video"
    if ext in [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"] or "image" in ct:
        return "images", "image"
    if ext in [".pdf"] or "pdf" in ct:
        return "pdfs", "pdf"
    if ext in [".mp3", ".wav", ".m4a", ".aac", ".ogg"] or "audio" in ct:
        return "audios", "audio"
    return "images", "image"

app = FastAPI(
    title="Media Manager & Video Recorder API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

@app.get("/api")
def api_status(request: Request):
    base_url = get_base_url(request)
    return {
        "status": "online",
        "service": "Media Manager & Video Recorder API",
        "base_url": base_url,
        "endpoints": {
            "root": "/",
            "status": "/api",
            "list_media": "/media",
            "media_detail": "/media/{id}",
            "upload_media": "/media/upload",
            "delete_media": "/media/{id}",
            "docs": "/docs"
        }
    }

@app.get("/media")
def list_media(request: Request, type: Optional[str] = None):
    base_url = get_base_url(request)
    items = read_media()
    if type and type != "all":
        items = [i for i in items if i.get("type") == type]
    for item in items:
        rel = item.get("relative_path")
        if rel:
            item["url"] = f"{base_url}/uploads/{rel.lstrip('/')}"
    return items

@app.get("/media/{media_id}")
def get_media(media_id: str, request: Request):
    base_url = get_base_url(request)
    items = read_media()
    item = next((i for i in items if i.get("id") == media_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Mídia não encontrada")
    rel = item.get("relative_path")
    if rel:
        item["url"] = f"{base_url}/uploads/{rel.lstrip('/')}"
    return item

@app.post("/media/upload")
async def upload_media(
    request: Request,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None)
):
    base_url = get_base_url(request)
    original_name = file.filename or "media_upload"
    folder, media_type = resolve_folder_and_type(original_name, file.content_type)
    
    unique_id = str(uuid.uuid4())
    ext = Path(original_name).suffix.lower()
    if not ext:
        if media_type == "video":
            ext = ".mp4"
        elif media_type == "image":
            ext = ".jpg"
        elif media_type == "pdf":
            ext = ".pdf"
        else:
            ext = ".bin"

    stored_filename = f"{unique_id}{ext}"
    target_path = UPLOADS_DIR / folder / stored_filename
    
    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    size_bytes = target_path.stat().st_size
    from datetime import datetime
    created_at = datetime.utcnow().isoformat() + "Z"
    
    relative_path = f"{folder}/{stored_filename}"
    item = {
        "id": unique_id,
        "title": title or original_name,
        "description": description or "",
        "type": media_type,
        "filename": original_name,
        "stored_filename": stored_filename,
        "relative_path": relative_path,
        "url": f"{base_url}/uploads/{relative_path}",
        "size_bytes": size_bytes,
        "created_at": created_at
    }
    
    items = read_media()
    items.insert(0, item)
    write_media(items)
    return item

@app.delete("/media/{media_id}")
def delete_media(media_id: str):
    items = read_media()
    item = next((i for i in items if i.get("id") == media_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Mídia não encontrada")
    
    rel = item.get("relative_path")
    if rel:
        file_path = UPLOADS_DIR / rel
        if file_path.exists():
            try:
                file_path.unlink()
            except Exception:
                pass
                
    items = [i for i in items if i.get("id") != media_id]
    write_media(items)
    return {"message": "Mídia removida com sucesso", "id": media_id}

if os.path.exists(WEB_APP_DIR):
    app.mount("/", StaticFiles(directory=str(WEB_APP_DIR), html=True), name="web_app")
