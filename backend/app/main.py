"""
Fiber Optic Network Analyzer - Main Application
FastAPI backend for analyzing fiber optic network quality
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.core.config import settings
from app.api import network, analysis, optimization, upload, comparison

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Fiber Optic Network Analyzer",
    description="AI-powered analysis and optimization for fiber optic networks",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(network.router, prefix="/api/network", tags=["Network"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(optimization.router, prefix="/api/optimization", tags=["Optimization"])
app.include_router(comparison.router, prefix="/api/comparison", tags=["As-Planned vs As-Built"])


@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {
        "message": "Fiber Optic Network Analyzer API",
        "version": "0.1.0",
        "status": "operational",
        "docs": "/api/docs"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "service": "fiber-optic-analyzer",
        "version": "0.1.0"
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.DEBUG else "An error occurred"
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
