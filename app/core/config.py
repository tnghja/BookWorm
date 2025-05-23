import secrets
import warnings
from typing import Annotated, Any, Literal, Optional
import os
from dotenv import load_dotenv
load_dotenv()
from pydantic import (
    AnyUrl,
    BeforeValidator,
    EmailStr,
    computed_field,
    model_validator,
)
from pydantic_core import MultiHostUrl
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing_extensions import Self


def parse_cors(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)


class Settings(BaseSettings):
    SettingsConfigDict(
        # Use top level .env file (one level above ./backend/)
        env_file="./.env",
        env_ignore_empty=True,
        extra="ignore",
    )
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "123456"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60
    FRONTEND_HOST: str = "http://localhost:5173"

    GEOLOCATION_API_KEY: Optional[str] = os.getenv("GEOLOCATION_API_KEY")
    EXCHANGE_RATE_API_KEY: Optional[str] = os.getenv("EXCHANGE_RATE_API_KEY")

    BACKEND_CORS_ORIGINS: Annotated[
        list[AnyUrl] | str, BeforeValidator(parse_cors)
    ] = ["http://localhost:5173"]

    @computed_field  # type: ignore[prop-decorator]
    @property
    def all_cors_origins(self) -> list[str]:
        return [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS] + [
            self.FRONTEND_HOST
        ]

    PROJECT_NAME: str = os.getenv("PROJECT_NAME")
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD")
    POSTGRES_PORT: int = os.getenv("POSTGRES_PORT")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB")

    @computed_field  # type: ignore[prop-decorator]
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return str(MultiHostUrl.build(
            scheme="postgresql+psycopg",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB
        ))


    @computed_field  # type: ignore[prop-decorator]
    @property
    def emails_enabled(self) -> bool:
        return bool(self.SMTP_HOST and self.EMAILS_FROM_EMAIL)

    EMAIL_TEST_USER: EmailStr = "test@example.com"
    FIRST_SUPERUSER: EmailStr = "admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str = "12345678"

    REFRESH_COOKIE_NAME: str = "refresh_token"
    REFRESH_COOKIE_HTTPONLY: bool = True
    REFRESH_COOKIE_SECURE: bool = os.getenv("REFRESH_COOKIE_SECURE", "False").lower() in ("true", "1", "t")
    REFRESH_COOKIE_SAMESITE: Literal["lax", "strict", "none"] = "lax"
    REFRESH_COOKIE_PATH: str = "/"
    REFRESH_COOKIE_DOMAIN: str | None = None  # Set if needed for cross-subdomain access

    def _check_default_secret(self, var_name: str, value: str | None) -> None:
        if value == "heheheha":
            message = (
                f'The value of {var_name} is "change this", '
                "for security, please change it, at least for deployments."
            )
            if self.ENVIRONMENT == "local":
                warnings.warn(message, stacklevel=1)
            else:
                raise ValueError(message)

    @model_validator(mode="after")
    def _enforce_non_default_secrets(self) -> Self:
        self._check_default_secret("SECRET_KEY", self.SECRET_KEY)
        self._check_default_secret("POSTGRES_PASSWORD", self.POSTGRES_PASSWORD)
        self._check_default_secret(
            "FIRST_SUPERUSER_PASSWORD", self.FIRST_SUPERUSER_PASSWORD
        )

        return self


settings = Settings()  # type: ignore
