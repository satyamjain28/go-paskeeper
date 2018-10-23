package main

import (
	"net/http"
	"bytes"
	"log"
	"encoding/json"
)

type ErrorStatus struct {
	Message string `json:"message,omitempty"`
	Type    string `json:"type,omitempty"`
}

type ErrorBody struct {
	Status ErrorStatus `json:"status,omitempty"`
}

// Send Creates a standard error body and return the error
func errorResp(w http.ResponseWriter, message string, statusCode int, errorType string, err error) {
	log.Printf("message : %s, error : %+v", message, err)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	if errorType == "" {
		errorType = "Failure"
	}
	errorResponse := ErrorBody{
		Status: ErrorStatus{
			Message: message,
			Type:    errorType,
		},
	}
	errNew, err := json.Marshal(errorResponse)
	if err != nil {
		log.Printf("Error in generating the error body, error : %+v", errNew)
		return
	}
	w.Write(bytes.NewBuffer(errNew).Bytes())
	return
}
