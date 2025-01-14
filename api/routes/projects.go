package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"intualai/conn"
	"intualai/gen"
	"net/http"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ses"
	"github.com/aws/aws-sdk-go-v2/service/ses/types"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
	"github.com/rs/zerolog/log"
)

func GetAllProjects(c echo.Context) error {
	// Retrieve the current userId from the middleware
	userId := c.Get("userId").(string)

	projects, err := conn.Queries.GetAllProjects(context.Background(), userId)
	if err != nil {
		log.Err(err).Send()
		return echo.NewHTTPError(http.StatusInternalServerError)
	}

	return c.JSON(http.StatusOK, projects)
}

type CreateProjectRequestBody struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Industry    string `json:"industry"`
	UseCase     string `json:"use_case"`
	ModelType   string `json:"model_type"`
	Function    string `json:"function"`
}

func CreateProject(c echo.Context) error {
	userId := c.Get("userId").(string)

	body := CreateProjectRequestBody{}

	err := json.NewDecoder(c.Request().Body).Decode(&body)
	if err != nil {
		log.Err(err).Send()
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	// Construct the CreateProjectParams with valid pgtype.Text fields
	_, err = conn.Queries.CreateProject(context.Background(), gen.CreateProjectParams{
		UserID: userId,
		Name:   body.Name,
		Description: pgtype.Text{
			String: body.Description,
			Valid:  body.Description != "",
		},
		Industry: pgtype.Text{
			String: body.Industry,
			Valid:  body.Industry != "",
		},
		UseCase: pgtype.Text{
			String: body.UseCase,
			Valid:  body.UseCase != "",
		},
		ModelType: pgtype.Text{
			String: body.ModelType,
			Valid:  body.ModelType != "",
		},
		Function: pgtype.Text{
			String: body.Function,
			Valid:  body.Function != "",
		},
	})

	if err != nil {
		log.Err(err).Send()
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create project")
	}

	return c.JSON(http.StatusOK, body)
}

func CheckUserPermission(c echo.Context) error {
	userId := c.Get("userId").(string)
	projectId := c.Param("project_id")

	projectUUID, err := uuid.Parse(projectId)
	if err != nil {
		log.Err(err).Msg("Invalid project ID")
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid project ID")
	}

	var pgUUID pgtype.UUID
	copy(pgUUID.Bytes[:], projectUUID[:])
	pgUUID.Valid = true

	permission, err := conn.Queries.GetProjectUserPermission(context.Background(), gen.GetProjectUserPermissionParams{
		UserID:    userId,
		ProjectID: pgUUID,
	})
	if err != nil {
		log.Err(err).Msg("Failed to retrieve user permission")
		return echo.NewHTTPError(http.StatusNotFound, "Project not found or no permission")
	}

	return c.JSON(http.StatusOK, map[string]int32{"permission": permission})
}

func DeleteProject(c echo.Context) error {
	userId := c.Get("userId").(string)
	projectId := c.Param("project_id")

	projectUUID, err := uuid.Parse(projectId)
	if err != nil {
		log.Err(err).Msg("Invalid project ID")
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid project ID")
	}

	var pgUUID pgtype.UUID
	copy(pgUUID.Bytes[:], projectUUID[:])
	pgUUID.Valid = true

	permission, err := conn.Queries.GetProjectUserPermission(context.Background(), gen.GetProjectUserPermissionParams{
		UserID:    userId,
		ProjectID: pgUUID,
	})
	if err != nil {
		log.Err(err).Msg("Failed to retrieve user permission")
		return echo.NewHTTPError(http.StatusForbidden, "You do not have permission to delete this project")
	}

	if permission != 0 {
		return echo.NewHTTPError(http.StatusForbidden, "Only the project owner can delete this project")
	}

	err = conn.Queries.DeleteProject(context.Background(), pgUUID)
	if err != nil {
		log.Err(err).Msg("Failed to delete project")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to delete project")
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Project deleted successfully"})
}

func GetProjectByID(c echo.Context) error {
	projectId := c.Param("project_id")

	projectUUID, err := uuid.Parse(projectId)
	if err != nil {
		log.Err(err).Msg("Invalid project ID")
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid project ID")
	}

	var pgUUID pgtype.UUID
	copy(pgUUID.Bytes[:], projectUUID[:])
	pgUUID.Valid = true

	project, err := conn.Queries.GetProjectByID(context.Background(), pgUUID)
	if err != nil {
		log.Err(err).Msg("Failed to fetch project details")
		return echo.NewHTTPError(http.StatusNotFound, "Project not found")
	}

	return c.JSON(http.StatusOK, project)
}

type UpdateProjectRequestBody struct {
	Description string `json:"description,omitempty"`
	Industry    string `json:"industry,omitempty"`
	UseCase     string `json:"use_case,omitempty"`
	ModelType   string `json:"model_type,omitempty"`
}

// UpdateProjectDetails updates partial project details.
func UpdateProjectDetails(c echo.Context) error {
	projectIdStr := c.Param("project_id")
	projectUUID, err := uuid.Parse(projectIdStr)
	if err != nil {
		log.Error().Err(err).Msg("Invalid project ID")
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid project ID")
	}

	var body UpdateProjectRequestBody
	if err := json.NewDecoder(c.Request().Body).Decode(&body); err != nil {
		log.Error().Err(err).Msg("Invalid request body")
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	params := gen.UpdateProjectDetailsParams{
		ID:          pgtype.UUID{Bytes: projectUUID, Valid: true},
		Description: pgtype.Text{String: body.Description, Valid: body.Description != ""},
		Industry:    pgtype.Text{String: body.Industry, Valid: body.Industry != ""},
		UseCase:     pgtype.Text{String: body.UseCase, Valid: body.UseCase != ""},
		ModelType:   pgtype.Text{String: body.ModelType, Valid: body.ModelType != ""},
	}

	err = conn.Queries.UpdateProjectDetails(context.Background(), params)
	if err != nil {
		log.Error().Err(err).Msg("Failed to update project details")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to update project details")
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "Project details updated successfully",
	})
}

// InviteUserRequestBody for Invite Request
type InviteUserRequestBody struct {
	Email      string `json:"email"`
	Permission int32  `json:"permission"`
}

func InviteUserToProject(c echo.Context) error {
	userId := c.Get("userId").(string)
	projectIdStr := c.Param("project_id")

	// Parse projectId string to UUID
	projectUUID, err := uuid.Parse(projectIdStr)
	if err != nil {
		log.Err(err).Msg("Invalid project ID")
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid project ID")
	}

	var pgUUID pgtype.UUID
	copy(pgUUID.Bytes[:], projectUUID[:])
	pgUUID.Valid = true

	var body InviteUserRequestBody
	if err := c.Bind(&body); err != nil {
		log.Error().Err(err).Msg("Invalid request body")
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	currentPermission, err := conn.Queries.GetProjectUserPermission(context.Background(), gen.GetProjectUserPermissionParams{
		UserID:    userId,
		ProjectID: pgUUID,
	})
	if err != nil || (currentPermission != 0 && currentPermission != 1) {
		log.Error().Err(err).Msg("Insufficient permissions to invite users")
		return echo.NewHTTPError(http.StatusForbidden, "You do not have permission to invite users")
	}

	invitedUser, err := conn.Queries.GetUserByEmail(context.Background(), body.Email)
	if err != nil {
		// If the user is not found, invite by email only
		err = conn.Queries.InviteUserToProjectByEmail(context.Background(), gen.InviteUserToProjectByEmailParams{
			Email:      body.Email,
			ProjectID:  pgUUID,
			Permission: body.Permission,
		})
		if err != nil {
			log.Error().Err(err).Msg("Failed to add user to project")
			return echo.NewHTTPError(http.StatusInternalServerError, "Failed to add user to project")
		}
	} else {
		// If the user exists, add them to the project with user ID
		err = conn.Queries.InviteUserToProject(context.Background(), gen.InviteUserToProjectParams{
			UserID:     invitedUser.ID,
			ProjectID:  pgUUID,
			Permission: body.Permission,
			Email:      body.Email,
		})
		if err != nil {
			log.Error().Err(err).Msg("Failed to invite user")
			return echo.NewHTTPError(http.StatusInternalServerError, "Failed to invite user")
		}
	}

	// Fetch project name
	project, err := conn.Queries.GetProjectByID(context.Background(), pgUUID)
	if err != nil {
		log.Error().Err(err).Msg("Failed to fetch project details")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to fetch project details")
	}

	// Send the invite email using AWS SES
	err = sendInviteEmail(body.Email, project.Name)
	if err != nil {
		log.Error().Err(err).Msg("Failed to send invite email")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to send invite email")
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "User invited and email sent successfully!",
	})
}

// sendInviteEmail sends the invitation email using AWS SES
func sendInviteEmail(recipientEmail, projectName string) error {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		return fmt.Errorf("unable to load SDK config: %v", err)
	}

	sesClient := ses.NewFromConfig(cfg)
	senderEmail := os.Getenv("SENDER_EMAIL")
	dashboardUrl := "https://intualai.com/dashboard"

	// Create the email subject and body
	subject := fmt.Sprintf("IntualAI - Invitation to join the project: %s", projectName)
	body := fmt.Sprintf(`
		<p>You have been invited to join the project: <strong>%s</strong>.</p>
		<p>Click the button below to access the project:</p>
		<a href="%s" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 10px 2px; cursor: pointer;">Go to Dashboard</a>
	`, projectName, dashboardUrl)

	// Construct the email input
	input := &ses.SendEmailInput{
		Destination: &types.Destination{
			ToAddresses: []string{recipientEmail},
		},
		Message: &types.Message{
			Body: &types.Body{
				Html: &types.Content{
					Data: aws.String(body),
				},
			},
			Subject: &types.Content{
				Data: aws.String(subject),
			},
		},
		Source: aws.String(senderEmail),
	}

	// Send the email
	_, err = sesClient.SendEmail(context.TODO(), input)
	if err != nil {
		return fmt.Errorf("failed to send email: %v", err)
	}

	return nil
}

func GetProjectMembers(c echo.Context) error {
	userId := c.Get("userId").(string)
	projectId := c.Param("project_id")

	// Convert the projectId string to pgtype.UUID
	projectUUID, err := uuid.Parse(projectId)
	if err != nil {
		log.Error().Err(err).Msg("Invalid project ID")
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid project ID")
	}

	var pgUUID pgtype.UUID
	copy(pgUUID.Bytes[:], projectUUID[:])
	pgUUID.Valid = true

	// Check if the current user has permission to view project members
	currentPermission, err := conn.Queries.GetProjectUserPermission(context.Background(), gen.GetProjectUserPermissionParams{
		UserID:    userId,
		ProjectID: pgUUID,
	})
	if err != nil || (currentPermission != 0 && currentPermission != 1) {
		log.Error().Err(err).Msg("Insufficient permissions to view project members")
		return echo.NewHTTPError(http.StatusForbidden, "You do not have permission to view project members")
	}

	// Retrieve all members of the project along with their permission levels
	members, err := conn.Queries.GetProjectMembers(context.Background(), pgUUID)
	if err != nil {
		log.Error().Err(err).Msg("Failed to retrieve project members")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to retrieve project members")
	}

	// Return the members as JSON
	return c.JSON(http.StatusOK, members)
}

type ChangePermissionRequestBody struct {
	Permission int32 `json:"permission"`
}

// ChangeUserPermission allows an owner or editor to change the permissions of project members.
func ChangeUserPermission(c echo.Context) error {
	userId := c.Get("userId").(string)   // Current user (performing the change)
	memberId := c.Param("member_id")     // The user whose permissions are being changed
	projectId := c.Param("project_id")   // Project ID
	var body ChangePermissionRequestBody // Request body to accept permission change

	// Parse the projectId and memberId to UUIDs
	projectUUID, err := uuid.Parse(projectId)
	if err != nil {
		log.Err(err).Msg("Invalid project ID")
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid project ID")
	}

	var pgUUID pgtype.UUID
	copy(pgUUID.Bytes[:], projectUUID[:])
	pgUUID.Valid = true

	// Parse the request body
	if err := c.Bind(&body); err != nil {
		log.Error().Err(err).Msg("Invalid request body")
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	// Check current user's permission
	currentPermission, err := conn.Queries.GetProjectUserPermission(context.Background(), gen.GetProjectUserPermissionParams{
		UserID:    userId,
		ProjectID: pgUUID,
	})
	if err != nil {
		log.Error().Err(err).Msg("Failed to check current user's permission")
		return echo.NewHTTPError(http.StatusForbidden, "You do not have permission to change project member permissions")
	}

	// Check the target user's current permission
	memberPermission, err := conn.Queries.GetProjectUserPermission(context.Background(), gen.GetProjectUserPermissionParams{
		UserID:    memberId,
		ProjectID: pgUUID,
	})
	if err != nil {
		log.Error().Err(err).Msg("Failed to retrieve member's permission")
		return echo.NewHTTPError(http.StatusNotFound, "Member not found or invalid permissions")
	}

	// Owners (permission level 0) can change any user's permissions
	// Editors (permission level 1) can only change "Can View" (permission level 2) users to "Can Edit" (permission level 1) or back
	// No one can change their own permission
	if userId == memberId {
		return echo.NewHTTPError(http.StatusForbidden, "You cannot change your own permission")
	}

	if currentPermission == 1 && (memberPermission == 1 || body.Permission == 0) {
		return echo.NewHTTPError(http.StatusForbidden, "Editors cannot change other editors or make someone an owner")
	}

	// Update the target user's permission
	err = conn.Queries.UpdateProjectUserPermission(context.Background(), gen.UpdateProjectUserPermissionParams{
		UserID:     memberId,
		ProjectID:  pgUUID,
		Permission: body.Permission,
	})
	if err != nil {
		log.Error().Err(err).Msg("Failed to update project member's permission")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to update project member's permission")
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "Member's permission updated successfully",
	})
}

// DeleteUserFromProject allows only project owners to delete a member from a project.
func DeleteUserFromProject(c echo.Context) error {
	userId := c.Get("userId").(string) // Current user (performing the deletion)
	memberId := c.Param("member_id")   // The user to be removed
	projectId := c.Param("project_id") // Project ID

	// Parse the projectId and memberId to UUIDs
	projectUUID, err := uuid.Parse(projectId)
	if err != nil {
		log.Err(err).Msg("Invalid project ID")
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid project ID")
	}

	var pgUUID pgtype.UUID
	copy(pgUUID.Bytes[:], projectUUID[:])
	pgUUID.Valid = true

	// Check current user's permission
	currentPermission, err := conn.Queries.GetProjectUserPermission(context.Background(), gen.GetProjectUserPermissionParams{
		UserID:    userId,
		ProjectID: pgUUID,
	})
	if err != nil {
		log.Err(err).Err(err).Msg("Failed to check current user's permission")
		return echo.NewHTTPError(http.StatusForbidden, "You do not have permission to delete project members")
	}

	// Only owners (permission 0) can delete project members
	if currentPermission != 0 {
		return echo.NewHTTPError(http.StatusForbidden, "Only project owners can delete members")
	}

	// Prevent owners from deleting themselves
	if userId == memberId {
		return echo.NewHTTPError(http.StatusForbidden, "Owners cannot remove themselves from the project")
	}

	// Delete the user from the project_users table
	err = conn.Queries.DeleteUserFromProject(context.Background(), gen.DeleteUserFromProjectParams{
		UserID:    memberId,
		ProjectID: pgUUID,
	})
	if err != nil {
		log.Err(err).Err(err).Msg("Failed to remove user from project")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to remove user from project")
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "User removed from project successfully",
	})
}
