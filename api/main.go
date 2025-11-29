package main

import (
	"context"
	"encoding/json"

	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
)

var ctx = context.Background()
var rdb *redis.Client

type LogPayload struct {
	Service string `json:"service"`
	Level   string `json:"level"`
	Message string `json:"message"`
}

func main() {
	rdb = redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
	})

	app := fiber.New()

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

	app.Listen(":3000")
}
