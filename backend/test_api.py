import os
import sys
import time
import subprocess
import requests

def run_tests():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8008"],
        cwd=backend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    base_url = "http://127.0.0.1:8008"
    time.sleep(2)

    try:
        r = requests.get(f"{base_url}/api", timeout=5)
        assert r.status_code == 200, f"GET /api falhou: {r.status_code}"
        api_data = r.json()
        assert api_data.get("status") == "online", "Status nao e online"

        r = requests.get(f"{base_url}/media", timeout=5)
        assert r.status_code == 200, f"GET /media falhou: {r.status_code}"
        items = r.json()
        assert isinstance(items, list), "Resultado nao e lista"
        assert len(items) >= 3, "Esperado pelo menos 3 amostras"

        r = requests.get(f"{base_url}/media?type=pdf", timeout=5)
        assert r.status_code == 200, f"Filtro falhou: {r.status_code}"
        pdfs = r.json()
        assert all(p.get("type") == "pdf" for p in pdfs), "Filtro retornou tipo incorreto"

        sample_id = items[0]["id"]
        r = requests.get(f"{base_url}/media/{sample_id}", timeout=5)
        assert r.status_code == 200, f"GET /media/{{id}} falhou: {r.status_code}"

        test_file_path = os.path.join(backend_dir, "test_upload.txt")
        with open(test_file_path, "w", encoding="utf-8") as f:
            f.write("Conteudo de teste para upload multipart.")

        with open(test_file_path, "rb") as f:
            files = {"file": ("test_upload.pdf", f, "application/pdf")}
            data = {"title": "Upload de Teste Automatizado", "description": "Arquivo criado pelo test_api"}
            r = requests.post(f"{base_url}/media/upload", files=files, data=data, timeout=5)
            assert r.status_code == 200, f"POST /media/upload falhou: {r.status_code}"
            uploaded = r.json()
            upload_id = uploaded["id"]

        if os.path.exists(test_file_path):
            os.remove(test_file_path)

        r = requests.delete(f"{base_url}/media/{upload_id}", timeout=5)
        assert r.status_code == 200, f"DELETE /media/{{id}} falhou: {r.status_code}"

        print("TODOS OS TESTES PASSARAM COM SUCESSO (Status 200 em todas as operacoes)!")
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    run_tests()
