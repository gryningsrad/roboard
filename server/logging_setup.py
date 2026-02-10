import logging
import os
import sys
import time
from fastapi import logger
import structlog
from config import APP_NAME


def setup_logging():
    """
    Configure stdlib logging + structlog for JSON structured logs.
    Designed to log to stdout so systemd/journald can capture it.
    """
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()

    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )

    structlog.configure(
        processors=[
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,  # renders exception traces when exc_info=True
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(getattr(logging, log_level, logging.INFO)),
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    return structlog.get_logger(APP_NAME).bind(app=APP_NAME)
