package routes

import (
	"context"
	"intualai/conn"
	"intualai/gen"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/rs/zerolog/log"
)

func CreateUser(c echo.Context) error {
	// Retrieve user information (id, email, and name) from the context or request
	userId := c.Get("userId").(string)
	email := c.Get("email").(string)
	name := c.Get("name").(string)

	// Check if the user already exists
	exists, err := conn.Queries.UserExists(context.Background(), userId)
	if err != nil {
		log.Err(err).Msg("Failed to check if user exists")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to check if user exists")
	}

	// If the user exists, return a 409 Conflict status
	if exists {
		log.Info().Msg("User already exists")
		return echo.NewHTTPError(http.StatusConflict, "User already exists")
	}

	// If the user does not exist, create the user
	userParams := gen.CreateUserParams{
		ID:    userId,
		Email: email,
		Name:  name,
	}

	user, err := conn.Queries.CreateUser(context.Background(), userParams)
	if err != nil {
		log.Err(err).Msg("Failed to create user")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create user")
	}

	return c.JSON(http.StatusOK, user)
}
