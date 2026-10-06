from pydantic import BaseModel
from typing import Optional

class RegistroBase(BaseModel):
    dia: str
    inicio: str
    fim: str
    gasolina: float
    consumo: float
    km: float
    faturado: float

class RegistroCreate(RegistroBase):
    pass

class RegistroResponse(RegistroBase):
    id: int
    tempo_horas: float
    tempo_formatado: str
    lucro_liquido: float
    lucro_hora: float

    class Config:
        from_attributes = True

class AuthRequest(BaseModel):
    pin: str