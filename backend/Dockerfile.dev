FROM python:3.9-slim

# set work directory
WORKDIR /usr/src/app

RUN mkdir /usr/src/app/staticfiles

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# install dependencies
RUN pip install --upgrade pip

COPY ./pyproject.toml .
COPY ./poetry.lock .

RUN pip install poetry~=1.4.2 && \
    poetry config virtualenvs.create false && \
    poetry install

# COPY ./entrypoint.sh .
# RUN sed -i 's/\r$//g' /usr/src/app/entrypoint.sh
# RUN chmod +x /usr/src/app/entrypoint.sh

# copy project
COPY . .

RUN poetry run ./manage.py collectstatic --no-input

# run entrypoint.sh
# ENTRYPOINT ["./entrypoint.sh"]