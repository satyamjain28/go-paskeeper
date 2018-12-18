package main

import "errors"

type Collection struct {
	Name       string   `json:"name"`
	SharedWith []string `json:"shared"`
	Owner      string   `json:"owner"`
}

func (c *Collection) isAllowedUser(email string) (allowed bool, err error) {
	for _, user := range c.SharedWith {
		if user == email {
			return true, nil
		}
	}
	return false, nil
}

func (c *Collection) addUser(email string) (err error) {
	for _, user := range c.SharedWith {
		if user == email {
			return errors.New("user already exists")
		}
	}
	c.SharedWith = append(c.SharedWith, email)
	return
}

func (c *Collection) removeUser(email string) (err error) {
	var users []string
	for _, user := range c.SharedWith {
		if user != email {
			users = append(users, user)
		}
	}
	c.SharedWith = users
	return
}
