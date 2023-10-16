#!/usr/bin/bash

set -e -x

poetry run ./manage.py migrate
PYTHONUNBUFFERED=1 gunicorn --bind "0.0.0.0:8000" -k uvicorn.workers.UvicornWorker --access-logfile - --log-level info app.asgi
