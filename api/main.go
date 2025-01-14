package main

import (
	"context"
	"intualai/conn"
	"intualai/gen"
	"intualai/routes"
	"net/http"
	"os"

	"github.com/clerkinc/clerk-sdk-go/clerk"
	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	// Setup zerolog for structured logging
	logger := zerolog.New(os.Stdout)

	// Load environment variables from .env.local
	err := godotenv.Load(".env.local")
	if err != nil {
		logger.Error().Msg("Failed to load environment variables from .env.local")
	}
	logger.Info().Msg("Successfully loaded environment variables")

	// Establish the postgres connection
	conn.InitDB()
	logger.Info().Msg("Established connection to database")
	defer conn.CloseDB()

	// Initialize Echo web framework
	e := echo.New()

	// Enable CORS for localhost:3000 to allow cross-origin requests
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"http://localhost:3000"},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodPatch},
	}))

	// Enable structured request logging for incoming HTTP requests
	e.Use(middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
		LogURI:      true,
		LogStatus:   true,
		LogMethod:   true,
		LogLatency:  true,
		LogRemoteIP: true,
		LogError:    true,
		LogValuesFunc: func(c echo.Context, v middleware.RequestLoggerValues) error {
			logger.Info().
				Int("status", v.Status).
				Str("method", v.Method).
				Str("uri", v.URI).
				Str("ip", v.RemoteIP).
				Str("latency", v.Latency.String()).
				Msg("request")
			return nil
		},
	}))

	// Middleware to validate Clerk session token and extract user details
	e.Use(middleware.KeyAuthWithConfig(middleware.KeyAuthConfig{
		KeyLookup:  "header:" + echo.HeaderAuthorization,
		AuthScheme: "Bearer",
		Validator: func(key string, c echo.Context) (bool, error) {
			// Check if it's a test key for development
			if key == "test-key" {
				c.Set("userId", "user_2jRfvOhhMBfHM5C85C1q3Ze1Ron")
				c.Set("email", "test@example.com")
				c.Set("name", "Test User")
				log.Info().Msg("Test user authenticated")
				return true, nil
			}

			// Initialize Clerk client for token validation
			client, err := clerk.NewClient(os.Getenv("CLERK_API_KEY"))
			if err != nil {
				log.Error().Err(err).Msg("Failed to initialize Clerk client")
				return false, err
			}

			// Validate the JWT token
			claims, err := client.VerifyToken(key)
			if err != nil {
				log.Error().Err(err).Msg("Failed to verify token")
				return false, err
			}

			// Extract the user ID from the token claims
			userId := claims.Subject

			// Fetch user details from Clerk API using the userId
			user, err := client.Users().Read(userId)
			if err != nil {
				log.Error().Err(err).Msg("Failed to fetch user details from Clerk")
				return false, err
			}

			// Safely dereference FirstName and LastName, handling nil cases
			firstName := "Unknown"
			lastName := ""
			if user.FirstName != nil {
				firstName = *user.FirstName
			}
			if user.LastName != nil {
				lastName = *user.LastName
			}
			fullName := firstName + " " + lastName

			// Set userId, email, and name in the context
			c.Set("userId", user.ID)
			if len(user.EmailAddresses) > 0 {
				c.Set("email", user.EmailAddresses[0].EmailAddress) // Set first email
			} else {
				c.Set("email", "no-email@example.com") // Handle case where no email exists
			}
			c.Set("name", fullName)

			// Save or update the user in the users table
			params := gen.CreateOrUpdateUserParams{
				ID:    user.ID,                             // User ID
				Email: user.EmailAddresses[0].EmailAddress, // First email address
				Name:  fullName,                            // Combined first and last name
			}

			err = conn.Queries.CreateOrUpdateUser(context.Background(), params)
			if err != nil {
				log.Error().Err(err).Msg("Failed to create or update user in the database")
				return false, err
			}

			log.Info().
				Str("userId", user.ID).
				Str("email", user.EmailAddresses[0].EmailAddress).
				Str("name", fullName).
				Msg("Successfully authenticated and updated user in the database")

			// If token is valid, return true
			return true, nil
		},
	}))

	// Root route for health check or testing
	e.GET("/", func(c echo.Context) error {
		userId := c.Get("userId").(string)
		email := c.Get("email").(string)
		name := c.Get("name").(string)
		return c.JSON(http.StatusOK, map[string]string{
			"userId": userId,
			"email":  email,
			"name":   name,
		})
	})

	// Group for project-related routes
	projectsGroup := e.Group("/projects")
	projectsGroup.GET("/", routes.GetAllProjects)
	projectsGroup.POST("/", routes.CreateProject)
	projectsGroup.DELETE("/:project_id", routes.DeleteProject)
	projectsGroup.GET("/:project_id", routes.GetProjectByID)
	projectsGroup.PATCH("/:project_id", routes.UpdateProjectDetails)
	projectsGroup.POST("/:project_id/invite", routes.InviteUserToProject)
	projectsGroup.GET("/:project_id/permissions", routes.CheckUserPermission)
	projectsGroup.GET("/:project_id/members", routes.GetProjectMembers)
	projectsGroup.DELETE("/:project_id/members/:member_id", routes.DeleteUserFromProject)
	projectsGroup.PATCH("/:project_id/members/:member_id/permission", routes.ChangeUserPermission)

	projectsGroup.GET("/:project_id/files", routes.GetAllFiles)
	projectsGroup.POST("/:project_id/files", routes.UploadFile)
	projectsGroup.POST("/:project_id/files/:file_name/process", routes.ProcessFile)

	projectsGroup.GET("/:project_id/files", routes.GetAllFiles)
	projectsGroup.POST("/:project_id/files", routes.UploadFile)
	projectsGroup.POST("/:project_id/files/:file_name/process", routes.ProcessFile)

	// Group for user-related routes
	usersGroup := e.Group("/users")
	usersGroup.POST("/", routes.CreateUser)

	// Start the Echo web server on port 8080
	e.Logger.Fatal(e.Start(":8080"))
}
