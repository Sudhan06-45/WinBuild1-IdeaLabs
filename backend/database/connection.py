"""
Database Connection Module
Handles database connection with async support
- Uses SQLite for local development
- Uses Azure SQL for production
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from config.settings import settings
import logging
from urllib.parse import quote_plus

logger = logging.getLogger(__name__)

# Create Base class for models
Base = declarative_base()

# Engine and session factory (initialized on startup)
engine = None
async_session_factory = None


def get_database_url() -> str:
    """Get the appropriate database URL based on configuration"""
    # Check if Azure SQL is configured
    if settings.AZURE_SQL_SERVER and settings.AZURE_SQL_DATABASE:
        # URL-encode password to handle special characters like @
        encoded_password = quote_plus(settings.AZURE_SQL_PASSWORD)
        # Return Azure SQL connection string (will need aioodbc installed)
        return (
            f"mssql+aioodbc://{settings.AZURE_SQL_USERNAME}:{encoded_password}"
            f"@{settings.AZURE_SQL_SERVER}/{settings.AZURE_SQL_DATABASE}"
            f"?driver={settings.AZURE_SQL_DRIVER.replace(' ', '+')}"
            f"&Encrypt=yes&TrustServerCertificate=no"
        )
    else:
        # Use SQLite for local development
        return "sqlite+aiosqlite:///./sqa_dev.db"


async def init_db():
    """Initialize database connection"""
    global engine, async_session_factory
    
    try:
        database_url = get_database_url()
        
        # Log which database we're using
        if "sqlite" in database_url:
            print("📁 Using SQLite database (local development)")
        else:
            print("☁️ Using Azure SQL database (production)")
        
        engine = create_async_engine(
            database_url,
            echo=settings.DEBUG,
            future=True,
            pool_pre_ping=True,  # Verify connections before using
            pool_recycle=3600    # Recycle connections after 1 hour
        )
        
        async_session_factory = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
        
        # Try to create tables, but don't fail if it doesn't work
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            print("✅ Database tables created/verified")
        except Exception as table_error:
            print(f"⚠️ Could not create tables (will retry on first request): {table_error}")
            logger.warning(f"Could not create tables on startup: {table_error}")
        
        print("✅ Database connection established")
        logger.info("✅ Database connection established")
        
    except Exception as e:
        print(f"⚠️ Database connection failed (app will start anyway): {e}")
        logger.warning(f"Database connection failed on startup: {e}")
        # Don't raise - allow app to start without database
        # Database will be retried on first actual use


async def close_db():
    """Close database connection"""
    global engine
    if engine:
        await engine.dispose()
        logger.info("Database connection closed")


async def get_db() -> AsyncSession:
    """Dependency to get database session"""
    if async_session_factory is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()