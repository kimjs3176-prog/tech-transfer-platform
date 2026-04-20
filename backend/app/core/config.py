from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "기술이전계약관리 플랫폼"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/tech_transfer"
    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8시간

    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "contracts"

    # 특허청 KIPRIS API
    KIPRIS_API_KEY: str = ""
    KIPRIS_API_URL: str = "http://plus.kipris.or.kr/openapi/rest"

    class Config:
        env_file = ".env"


settings = Settings()
