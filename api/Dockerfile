FROM debian:bookworm AS sqlc-generate
RUN apt update
RUN apt install -y ca-certificates

COPY --from=kjconroy/sqlc /workspace/sqlc /usr/bin/sqlc
WORKDIR /intual
COPY . .

RUN /usr/bin/sqlc generate -f ./api/sqlc.yml

FROM golang:1.23 AS builder

COPY --from=sqlc-generate /intual /build/intual

WORKDIR /build/intual/api

RUN go mod download

# RUN curl -O https://downloads.sqlc.dev/sqlc_1.27.0_linux_amd64.tar.gz
# RUN tar xvzf sqlc_1.27.0_linux_amd64.tar.gz
# RUN ./sqlc_1.27.0/sqlc

RUN CGO_ENABLED=0 GOOS=linux go build -o intual-api

FROM debian:bookworm AS runner

WORKDIR /runner

RUN apt-get update && apt-get install -y apt-transport-https ca-certificates curl gnupg && \
  curl -sLf --retry 3 --tlsv1.2 --proto "=https" 'https://packages.doppler.com/public/cli/gpg.DE2A7741A397C129.key' | gpg --dearmor -o /usr/share/keyrings/doppler-archive-keyring.gpg && \
  echo "deb [signed-by=/usr/share/keyrings/doppler-archive-keyring.gpg] https://packages.doppler.com/public/cli/deb/debian any-version main" | tee /etc/apt/sources.list.d/doppler-cli.list && \
  apt-get update && \
  apt-get -y install doppler

COPY --from=builder /build/intual/api/intual-api intual-api
EXPOSE 8080

ENTRYPOINT [ "doppler", "run", "--", "/runner/intual-api" ]
