# routes.py
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from models import run_model_logic
from plots import plot_logic
from utils import import_data_logic, get_df

router = APIRouter()

@router.get("/health")
async def health_check():
    return {
        'status': 'healthy',
        'message': 'Servidor backend funcionando correctamente',
        'version': '1.0.0'
    }

@router.post("/import")
async def import_data(request: Request):
    return await import_data_logic(request)

@router.post("/model")
async def run_model(request: Request):
    return await run_model_logic(request)

@router.post("/plot")
async def plot(request: Request):
    return await plot_logic(request)
