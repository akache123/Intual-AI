package routes

import (
	"context"
	"fmt"
	"intualai/conn"
	"intualai/gen"
	"net/http"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
	"github.com/emicklei/pgtalk/convert"
	"github.com/labstack/echo/v4"
	"github.com/rs/zerolog/log"
)

func GetAllFiles(c echo.Context) error {
	projectId := c.Param("project_id")

	results, err := conn.Queries.GetAllFiles(context.Background(), convert.StringToUUID(projectId))
	if err != nil {
		log.Err(err).Send()
		return echo.NewHTTPError(http.StatusInternalServerError, map[string]string{
			"error": "Internal server error, check logs",
		})
	}

	return c.JSON(http.StatusOK, results)
}

// Handles multiple files w/ filenames through formdata
func UploadFile(c echo.Context) error {
	projectId := c.Param("project_id")

	uploadsBucketName := os.Getenv("UPLOADS_BUCKET_NAME")

	form, err := c.MultipartForm()
	if err != nil {
		log.Err(err).Send()
		return echo.NewHTTPError(http.StatusInternalServerError, map[string]string{
			"error": "Internal server error, check logs",
		})
	}
	files := form.File["files"]

	if len(files) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, map[string]string{
			"error": "File uploads must contain the `files` key",
		})
	}

	// Once we create each file in the database, store the results here
	// Avoids additional queries
	var results []gen.File

	// Now that we have the files, upload them to S3
	for _, file := range files {
		fileBody, err := file.Open()
		if err != nil {
			log.Err(err).Send()
			return echo.NewHTTPError(http.StatusInternalServerError, map[string]string{
				"error": "Internal server error, check logs",
			})
		}
		defer fileBody.Close()

		// Upload the file to S3
		cfg, err := config.LoadDefaultConfig(context.TODO())
		if err != nil {
			log.Err(err).Send()
			return echo.NewHTTPError(http.StatusInternalServerError, map[string]string{
				"error": "Internal server error, check logs",
			})
		}

		s3Client := s3.NewFromConfig(cfg)
		uploader := manager.NewUploader(s3Client)

		_, err = uploader.Upload(context.TODO(), &s3.PutObjectInput{
			Bucket: aws.String(uploadsBucketName),
			Key:    aws.String(fmt.Sprintf("%s/%s", projectId, file.Filename)),
			Body:   fileBody,
		})
		if err != nil {
			log.Err(err).Send()
			return echo.NewHTTPError(http.StatusInternalServerError, map[string]string{
				"error": "Internal server error, check logs",
			})
		}

		// Done uploading this file to S3

		// Create file in database
		dbFile, err := conn.Queries.CreateFile(context.Background(), gen.CreateFileParams{
			ProjectID: convert.StringToUUID(projectId),
			FileName:  file.Filename,
		})
		if err != nil {
			log.Err(err).Send()
			return echo.NewHTTPError(http.StatusInternalServerError, map[string]string{
				"error": "Internal server error, check logs",
			})
		}

		results = append(results, dbFile)
	}

	return c.JSON(http.StatusOK, results)
}

// Sends inputs from URL path parameters to SQS
func ProcessFile(c echo.Context) error {
	projectId := c.Param("project_id")
	fileName := c.Param("file_name")

	fileExists, err := conn.Queries.FileExists(context.Background(), gen.FileExistsParams{
		ProjectID: convert.StringToUUID(projectId),
		FileName:  fileName,
	})
	if err != nil {
		log.Err(err).Send()
		return echo.NewHTTPError(http.StatusInternalServerError, map[string]string{
			"error": "Internal server error, check logs",
		})
	}

	if !fileExists {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "File not found!"})
	}

	sqsUrl := os.Getenv("QUEUE_URL")

	// Load AWS config
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		log.Err(err).Send()
		return echo.NewHTTPError(http.StatusInternalServerError, map[string]string{
			"error": "Internal server error, check logs",
		})
	}

	// Create SQS client
	sqsClient := sqs.NewFromConfig(cfg)

	_, err = sqsClient.SendMessage(context.TODO(), &sqs.SendMessageInput{
		QueueUrl:    &sqsUrl,
		MessageBody: aws.String(fmt.Sprintf(`{"project_id": "%s", "file_name": "%s"}`, projectId, fileName)),
	})
	if err != nil {
		log.Err(err).Send()
		return echo.NewHTTPError(http.StatusInternalServerError, map[string]string{
			"error": "Internal server error, check logs",
		})
	}

	// Update file table with "QUEUED" status
	fileUpdate, err := conn.Queries.UpdateFileQueued(context.Background(), gen.UpdateFileQueuedParams{
		ProjectID: convert.StringToUUID(projectId),
		FileName:  fileName,
	})
	if err != nil {
		log.Err(err).Send()
		return echo.NewHTTPError(http.StatusInternalServerError, map[string]string{
			"error": "Internal server error, check logs",
		})
	}

	return c.JSON(http.StatusOK, fileUpdate)
}
