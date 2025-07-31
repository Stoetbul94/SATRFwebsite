from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn

from app.config import settings
from app.routers import auth, events, scores, leaderboard, files, admin
from app.database import db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("Starting SATRF API...")
    yield
    # Shutdown
    print("Shutting down SATRF API...")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="SATRF (South African Target Rifle Federation) API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=settings.allowed_methods,
    allow_headers=settings.allowed_headers,
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors"""
    print(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "error": {
                "message": "An unexpected error occurred",
                "code": "INTERNAL_ERROR"
            }
        }
    )


# Include routers
app.include_router(auth.router, prefix=f"/api/{settings.app_version}")
app.include_router(events.router, prefix=f"/api/{settings.app_version}")
app.include_router(scores.router, prefix=f"/api/{settings.app_version}")
app.include_router(leaderboard.router, prefix=f"/api/{settings.app_version}")
app.include_router(files.router, prefix=f"/api/{settings.app_version}")
app.include_router(admin.router, prefix=f"/api/{settings.app_version}")


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level="info"
    ) 