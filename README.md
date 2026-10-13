# MediaHub Pro — Gravador de Vídeo & Gerenciador Multimídia

Projeto Full Stack desenvolvido com **React Native (Expo SDK 57)** e **Python FastAPI**, projetado com tema White Mode minimalista e arquitetura unificada para deploy direto na nuvem (**Render**). O docente ou avaliador pode acessar diretamente pelo navegador sem instalar o Expo Go e sem depender de computadores locais ligados.

---

## Estrutura do Projeto

- `App.js`: Entrada principal com filtros em abas (*Todos*, *Vídeos*, *Fotos*, *PDFs*, *Nuvem*) e lista responsiva.
- `src/components/VideoRecorder.js`: Câmera e gravador com timer em tempo real (00:00:00), alternância de câmera e pré-visualização.
- `src/components/MediaCard.js`: Cartões de mídia com badges (Nuvem/Local), metadados e botão de exclusão.
- `src/components/MediaViewerModal.js`: Modal com reprodução nativa de vídeo, visualização de imagens e visualizador de PDFs acadêmicos.
- `src/services/mediaService.js`: Comunicação com a API REST FastAPI via Multipart `FormData`.
- `src/services/storageService.js`: Persistência local offline via `@react-native-async-storage/async-storage`.
- `backend/main.py`: Servidor FastAPI com rotas REST (`/api`, `/media`, `/media/upload`, `/media/{id}`) e montagem dos arquivos estáticos da web compilada na raiz `/`.
- `backend/setup_samples.py`: Inicializador automático de arquivos de amostra (vídeo MP4, imagem de capa PNG e relatório técnico PDF).
- `backend/test_api.py`: Testes automatizados com biblioteca `requests` validando 100% dos endpoints com Status 200.

---

## Verificações de Qualidade Concluídas

1. **`npx expo-doctor`**: **21/21 verificações aprovadas** com sucesso.
2. **`npx expo export -p web`**: Pacote estático compilado e copiado para `backend/web_app/`.
3. **`py backend/test_api.py`**: **100% de sucesso** em todas as operações (GET /api, GET /media, POST /media/upload multipart, filtros e DELETE).
4. **Git Repository**: Inicializado no branch `main` com `.gitignore` configurado.

---

## Como Rodar Localmente

### 1. Iniciar o Backend FastAPI
```bash
cd backend
py -m pip install -r requirements.txt
py setup_samples.py
py -m uvicorn main:app --reload --port 8000
```
Acesse a aplicação no navegador em: `http://127.0.0.1:8000`  
Documentação Swagger da API: `http://127.0.0.1:8000/docs`

### 2. Iniciar o Expo no Modo Desenvolvimento (Opcional)
```bash
npx expo start
```

---

## Como Publicar no GitHub e Render

### 1. Criar Repositório no GitHub e Enviar o Código
No terminal (dentro da pasta `media-recorder-app`):
```bash
git remote add origin https://github.com/<SEU_USUARIO>/<SEU_REPOSITORIO>.git
git branch -M main
git push -u origin main
```

### 2. Configurar o Web Service no Render (render.com)
1. Crie uma conta no [Render](https://render.com).
2. Clique em **New +** -> **Web Service**.
3. Conecte o repositório do GitHub recém-criado.
4. Preencha os campos exatamente com os seguintes valores:
   - **Name:** `mediahub-app` (ou o nome de sua preferência)
   - **Region:** Escolha a mais próxima (ex: Frankfurt ou Oregon)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:**
     ```bash
     pip install -r requirements.txt && python setup_samples.py
     ```
   - **Start Command:**
     ```bash
     uvicorn main:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type:** `Free`
5. Clique em **Create Web Service**.

Assim que a compilação finalizar, o Render gerará uma URL HTTPS pública (ex: `https://mediahub-app.onrender.com`). O docente poderá abrir esse link diretamente pelo smartphone ou computador sem qualquer instalação prévia.
