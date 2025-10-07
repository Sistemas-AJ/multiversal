from pydantic import BaseModel
from typing import List

class ModelRequest(BaseModel):
    dependent: str
    independent: List[str]
    type: str

class PlotRequest(BaseModel):
    x: str
    y: str
