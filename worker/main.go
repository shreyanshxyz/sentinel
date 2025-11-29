package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

var ctx = context.Background()

type LogPayload struct {
	Service string `json:"service"`
	Level   string `json:"level"`
	Message string `json:"message"`
}

func main() {
	rdb := redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
	})

	db, err := sql.Open(
	"postgres",
	"postgres://postgres:123123@localhost:5432/sentinel?sslmode=disable",
	)
	if err != nil {
		panic(err)
	}

	fmt.Println("Worker started. Waiting for logs...")

group := "sentinel-group"
consumer := "worker-1"

fmt.Println("Worker started with consumer group. Waiting for logs...")

for {
	streams, err := rdb.XReadGroup(ctx, &redis.XReadGroupArgs{
		Group:    group,
		Consumer: consumer,
		Streams:  []string{"logs", ">"},
		Count:    1,
		Block:    0,
	}).Result()

	if err != nil {
		fmt.Println("Redis error:", err)
		continue
	}

	for _, stream := range streams {
		for _, msg := range stream.Messages {
			raw := msg.Values["data"].(string)

			var payload LogPayload
			err := json.Unmarshal([]byte(raw), &payload)
			if err != nil {
				fmt.Println("Bad JSON:", err)
				continue
			}

			fmt.Println("Processed:", payload)

			_, err = db.Exec(
				"INSERT INTO logs(service, level, message) VALUES ($1,$2,$3)",
				payload.Service,
				payload.Level,
				payload.Message,
			)

			if err != nil {
				fmt.Println("DB error:", err)
				continue
			}

			err = rdb.XAck(ctx, "logs", group, msg.ID).Err()
			if err != nil {
				fmt.Println("ACK error:", err)
			}
		}
	}
}

}
