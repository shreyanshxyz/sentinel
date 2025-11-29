package main

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"

	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

var ctx = context.Background()

type LogPayload struct {
	Service string `json:"service"`
	Level   string `json:"level"`
	Message string `json:"message"`
}

type OllamaRequest struct {
	Model  string `json:"model"`
	Prompt string `json:"prompt"`
}

type OllamaResponse struct {
	Response string `json:"response"`
}

func analyzeWithAI(message string) string {
	reqBody := OllamaRequest{
		Model: "qwen2.5:3b",
		Prompt: fmt.Sprintf(
			"Explain this error in 2 lines max and give 1 practical fix:\n\n%s",
			message,
		),
	}

	data, _ := json.Marshal(reqBody)

	resp, err := http.Post(
		"http://localhost:11434/api/generate",
		"application/json",
		bytes.NewBuffer(data),
	)
	if err != nil {
		return "AI service unavailable"
	}
	defer resp.Body.Close()

	decoder := json.NewDecoder(resp.Body)

	var fullResponse string

	for decoder.More() {
		var chunk OllamaResponse
		if err := decoder.Decode(&chunk); err != nil {
			break
		}
		fullResponse += chunk.Response
	}

	if fullResponse == "" {
		return "AI returned empty response"
	}

	return fullResponse
}

func main() {
	rdb := redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
	})

	db, err := sql.Open(
		"postgres",
		"host=localhost port=5432 user=postgres password=postgres dbname=sentinel sslmode=disable",
	)
	if err != nil {
		panic(err)
	}

	group := "sentinel-group"
	consumer := "worker-1"

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

				var logID int
				err = db.QueryRow(
					"INSERT INTO logs(service, level, message) VALUES ($1,$2,$3) RETURNING id",
					payload.Service,
					payload.Level,
					payload.Message,
				).Scan(&logID)

				if err != nil {
					fmt.Println("DB error:", err)
					continue
				}

				aiSummary := analyzeWithAI(payload.Message)

				_, err = db.Exec(
					"INSERT INTO log_insights(log_id, summary) VALUES ($1,$2)",
					logID,
					aiSummary,
				)

				if err != nil {
					fmt.Println("AI DB error:", err)
				}

				rdb.XAck(ctx, "logs", group, msg.ID)
			}
		}
	}
}
