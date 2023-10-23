FROM python:3.9-slim

WORKDIR /app
COPY . /app

RUN pip install poetry~=1.4.2 && \
    poetry config virtualenvs.create false && \
    poetry install && \
    poetry run ./manage.py collectstatic --no-input

EXPOSE 8000
RUN chmod +x /app/bin/start.sh
CMD [ "/app/bin/start.sh" ]