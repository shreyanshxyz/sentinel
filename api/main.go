package main

import (
	"github.com/gofiber/fiber/v2"
)

func main() {
	app := fiber.New()

	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Sentinel API is running.")
	})

	app.Post("/logs", func(c *fiber.Ctx) error {
		return c.SendString("Log received.")
	})

	app.Listen(":3000")
}
