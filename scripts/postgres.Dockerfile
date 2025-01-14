FROM postgres:16-bookworm

ENV POSTGRES_USER=intual
ENV POSTGRES_DB=intual

RUN apt update && apt upgrade -y
RUN apt-get install -y \
  postgresql-server-dev-16 \
  curl \
  build-essential \
  libreadline-dev \
  zlib1g-dev \
  flex \
  bison

RUN curl -sLO https://github.com/apache/age/releases/download/PG16%2Fv1.5.0-rc0/apache-age-1.5.0-src.tar.gz
RUN tar -xvzf apache-age-1.5.0-src.tar.gz
RUN cd apache-age-1.5.0 && make && make install

RUN apt install -y postgresql-16-pgvector
