from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from . import models, schemas

def calcular_metricas(r: models.RegistroUrbano):
    fmt = "%H:%M"
    t_inicio = datetime.strptime(r.inicio, fmt)
    t_fim = datetime.strptime(r.fim, fmt)
    
    if t_fim < t_inicio:
        t_fim += timedelta(days=1)
        
    duracao_segundos = (t_fim - t_inicio).total_seconds()
    horas_trabalhadas = duracao_segundos / 3600.0
    
    # Formatação de horas:minutos
    m, s = divmod(int(duracao_segundos), 60)
    h, m = divmod(m, 60)
    tempo_fmt = f"{h:02d}:{m:02d}"

    cost_combustivel = (r.km / r.consumo) * r.gasolina if r.consumo > 0 else 0.0
    lucro_liq = r.faturado - cost_combustivel
    lucro_h = lucro_liq / horas_trabalhadas if horas_trabalhadas > 0 else 0.0

    return schemas.RegistroResponse(
        id=r.id,
        dia=r.dia,
        inicio=r.inicio,
        fim=r.fim,
        gasolina=r.gasolina,
        consumo=r.consumo,
        km=r.km,
        faturado=r.faturado,
        tempo_horas=round(horas_trabalhadas, 2),
        tempo_formatado=tempo_fmt,
        lucro_liquido=round(lucro_liq, 2),
        lucro_hora=round(lucro_h, 2)
    )

def get_registros(db: Session):
    registros = db.query(models.RegistroUrbano).order_by(models.RegistroUrbano.dia.desc()).all()
    return [calcular_metricas(r) for r in registros]

def create_registro(db: Session, reg: schemas.RegistroCreate):
    db_reg = models.RegistroUrbano(**reg.dict())
    db.add(db_reg)
    db.commit()
    db.refresh(db_reg)
    return calcular_metricas(db_reg)

def update_registro(db: Session, reg_id: int, reg: schemas.RegistroCreate):
    db_reg = db.query(models.RegistroUrbano).filter(models.RegistroUrbano.id == reg_id).first()
    if db_reg:
        for key, value in reg.dict().items():
            setattr(db_reg, key, value)
        db.commit()
        db.refresh(db_reg)
        return calcular_metricas(db_reg)
    return None

def delete_registro(db: Session, reg_id: int):
    db_reg = db.query(models.RegistroUrbano).filter(models.RegistroUrbano.id == reg_id).first()
    if db_reg:
        db.delete(db_reg)
        db.commit()
        return True
    return False