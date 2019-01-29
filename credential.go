package main

type Credential struct {
	Password  string `json:"password"`
	CreatedOn int    `json:"created"`
	Type      string `json:"type"`
}
