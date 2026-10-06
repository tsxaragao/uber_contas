from sqlalchemy import Column, Integer, Float, String, Date, Time
from .database import Base

class RegistroUrbano(Base):
    __tablename__ = "registros"

    id = Column(Integer, primary_key=True, index=True)
    dia = Column(String, index=True)       # Formato: YYYY-MM-DD
    inicio = Column(String)               # Formato: HH:MM
    fim = Column(String)                  # Formato: HH:MM
    gasolina = Column(Float)              # Preço do litro (R$)
    consumo = Column(Float)               # km/l
    km = Column(Float)                    # km rodados
    faturado = Column(Float)              # R$ faturado