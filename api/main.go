package main

import (
	"context"
	"database/sql"
	"encoding/json"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

var ctx = context.Background()
var rdb *redis.Client

type LogPayload struct {
	Service string `json:"service"`
	Level   string `json:"level"`
	Message string `json:"message"`
}

var db *sql.DB

func main() {
	db, _ = sql.Open(
		"postgres",
		"host=localhost port=5432 user=postgres password=postgres dbname=sentinel sslmode=disable",
	)

	rdb = redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
	})

	app := fiber.New()
	app.Use(cors.New())

	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Sentinel API Connected to Redis")
	})

	app.Post("/logs", func(c *fiber.Ctx) error {
		var payload LogPayload

		if err := c.BodyParser(&payload); err != nil {
			return c.Status(400).SendString("Invalid JSON")
		}

		data, _ := json.Marshal(payload)

		err := rdb.XAdd(ctx, &redis.XAddArgs{
			Stream: "logs",
			Values: map[string]interface{}{
				"data": string(data),
			},
		}).Err()

		if err != nil {
			return c.Status(500).SendString("Redis error")
		}

		return c.SendString("Log pushed to Redis")
	})

	app.Get("/logs", func(c *fiber.Ctx) error {
		rows, err := db.Query(`
		SELECT l.id, l.service, l.level, l.message, i.summary, l.timestamp
		FROM logs l
		LEFT JOIN log_insights i ON l.id = i.log_id
		ORDER BY l.id DESC
		LIMIT 20
	`)
		if err != nil {
			return c.Status(500).SendString("DB error")
		}
		defer rows.Close()

		type LogView struct {
			ID        int    `json:"id"`
			Service   string `json:"service"`
			Level     string `json:"level"`
			Message   string `json:"message"`
			Summary   string `json:"summary"`
			Timestamp string `json:"timestamp"`
		}

		var result []LogView

		for rows.Next() {
			var log LogView
			rows.Scan(
				&log.ID,
				&log.Service,
				&log.Level,
				&log.Message,
				&log.Summary,
				&log.Timestamp,
			)
			result = append(result, log)
		}

		return c.JSON(result)
	})

	app.Listen(":3000")
}
