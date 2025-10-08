# routes.py
from fastapi import APIRouter, Request, UploadFile, File
from fastapi.responses import JSONResponse
from models import run_model_logic
from schemas import ModelRequest, PlotRequest, Plot3DRequest
from plots import plot_logic, plot_3d_logic
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
async def import_data(file: UploadFile = File(...)):
    return await import_data_logic(file)

@router.post("/model")
async def run_model(data: ModelRequest):
    return await run_model_logic(data)

@router.post("/plot")
async def plot(data: PlotRequest):
    return await plot_logic(data)

@router.post("/plot3d")
async def plot_3d(data: Plot3DRequest):
    return await plot_3d_logic(data)
