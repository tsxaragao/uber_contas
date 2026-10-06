import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from a2wsgi import ASGIMiddleware

from . import models, schemas, crud
from .database import engine, get_db

# Cria as tabelas do SQLite se não existirem
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Painel Metropolitano")

PIN_FIXO = "78901234"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/auth")
def authenticate(auth: schemas.AuthRequest):
    if auth.pin == PIN_FIXO:
        return {"status": "ok", "token": "access_granted"}
    raise HTTPException(status_code=401, detail="PIN incorreto")

@app.get("/api/registros", response_model=List[schemas.RegistroResponse])
def read_registros(db: Session = Depends(get_db)):
    return crud.get_registros(db)

@app.post("/api/registros", response_model=schemas.RegistroResponse)
def create_registro(registro: schemas.RegistroCreate, db: Session = Depends(get_db)):
    return crud.create_registro(db, registro)

@app.put("/api/registros/{reg_id}", response_model=schemas.RegistroResponse)
def update_registro(reg_id: int, registro: schemas.RegistroCreate, db: Session = Depends(get_db)):
    updated = crud.update_registro(db, reg_id, registro)
    if not updated:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    return updated

@app.delete("/api/registros/{reg_id}")
def delete_registro(reg_id: int, db: Session = Depends(get_db)):
    if not crud.delete_registro(db, reg_id):
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    return {"status": "sucesso"}

# Servir a build estática do React no mesmo servidor
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))

if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

# Ponto de entrada WSGI exigido pelo PythonAnywhere
wsgi_app = ASGIMiddleware(app)