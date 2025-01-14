package conn

import (
	"context"
	"intualai/gen"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog/log"
)

var DBPool *pgxpool.Pool
var DBCtx context.Context
var Queries *gen.Queries

func InitDB() {
	DBCtx = context.Background()

	// 1. Find the POSTGRES_DSN env var
	postgresDsn := os.Getenv("POSTGRES_DSN")
	if postgresDsn == "" {
		log.Fatal().Msg("POSTGRES_DSN environment variable not set")
	}

	// 2. Create a connection pool configuration
	poolConfig, err := pgxpool.ParseConfig(postgresDsn)
	if err != nil {
		log.Fatal().Msgf("failed to parse pool configuration %v", err)
	}

	poolConfig.MaxConns = 150 // Adjust this value based on your requirements

	// 3. Establish a connection pool
	DBPool, err = pgxpool.NewWithConfig(DBCtx, poolConfig)
	if err != nil {
		log.Fatal().Msgf("failed to connect to the database %v", err)
	}

	// Initialize the Queries struct
	Queries = gen.New(DBPool)
}

func CloseDB() {
	if DBPool != nil {
		DBPool.Close()
	}
}
