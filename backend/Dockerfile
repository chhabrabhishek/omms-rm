###########
# BUILDER #
###########

# pull official base image
FROM python:3.9-slim as builder

# set work directory
WORKDIR /usr/src/app

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc

# lint
RUN pip install --upgrade pip
RUN pip install flake8==6.0.0
COPY . /usr/src/app/
RUN flake8 --ignore=E501,F401,E302,E402,F811,F841,W292,W503,E722,E999,F541 .

# install python dependencies
COPY ./pyproject.toml .
COPY ./poetry.lock .
RUN pip install poetry~=1.4.2 && \
    poetry config virtualenvs.create false && \
    poetry install


#########
# FINAL #
#########

# pull official base image
FROM python:3.9-slim

# create directory for the app user
RUN mkdir -p /home/app

# create the app user
# RUN addgroup --system app && adduser --system --group app

# create the appropriate directories
ENV HOME=/home/app
ENV APP_HOME=/home/app/web
RUN mkdir $APP_HOME
RUN mkdir $APP_HOME/staticfiles
WORKDIR $APP_HOME

# install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends netcat-traditional
# COPY --from=builder /usr/src/app/wheels /wheels
COPY --from=builder /usr/src/app/pyproject.toml .
COPY --from=builder /usr/src/app/poetry.lock .
RUN pip install --upgrade pip
RUN pip install poetry~=1.4.2 && \
    poetry config virtualenvs.create false && \
    poetry install

# copy entrypoint.prod.sh
# COPY . .
# RUN sed -i 's/\r$//g'  $APP_HOME/entrypoint.prod.sh
# RUN chmod +x $APP_HOME/entrypoint.prod.sh

# copy project
COPY . $APP_HOME

# chown all the files to the app user
# RUN chown -R app:app $APP_HOME

# change to the app user
# USER app

RUN poetry run ./manage.py collectstatic --no-input

# run entrypoint.prod.sh
# ENTRYPOINT ["/home/app/web/entrypoint.prod.sh"]