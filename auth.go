package main

import (
	"net/http"
	"golang.org/x/oauth2"
	"io/ioutil"
	"log"
	"time"
	"math/rand"
	"errors"
)

type UserInfo struct {
	Id            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
	Link          string `json:"link"`
	Picture       string `json:"picture"`
	Gender        string `json:"gender"`
	Locale        string `json:"locale"`
	Hd            string `json:"hd"`
}

func randomString(l int) string {
	bytesGenerated := make([]byte, l)
	for i := 0; i < l; i++ {
		bytesGenerated[i] = byte(randInt(65, 90))
	}
	return string(bytesGenerated)
}

func randInt(min int, max int) int {
	return min + rand.Intn(max-min)
}

func (s *Service) getRedirectURL() string {
	return s.oauth2Config.AuthCodeURL("state")
}

func (s *Service) authorize(authCode string, w http.ResponseWriter) ([]byte, error) {
	token, err := s.oauth2Config.Exchange(oauth2.NoContext, authCode)
	if err != nil {
		log.Println(err)
		return nil, err
	}
	response, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + token.AccessToken)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	contents, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}
	return contents, nil
}

func (s *Service) setSession(userInfo map[string]interface{}, response http.ResponseWriter) error {
	rand.Seed(time.Now().UTC().UnixNano())
	id := randomString(12)
	if _, ok := userInfo["Email"].(string); !ok {
		return errors.New("invalid user info")
	}
	value := map[string]string{
		"id":    id,
		"email": userInfo["Email"].(string),
		"name":  userInfo["Name"].(string),
		"image": userInfo["Picture"].(string),
	}
	log.Print(value)
	encoded, err := s.cookieHandler.Encode("password", value)
	if err != nil {
		return err
	}
	expiration := time.Now().Add(48 * time.Hour)
	cookie := &http.Cookie{
		Name:    "password",
		Value:   encoded,
		Path:    "/",
		Expires: expiration,
	}
	log.Println(userInfo["Name"], "logged in")
	http.SetCookie(response, cookie)
	return nil
}

func (s *Service) getSession(request *http.Request) (map[string]string, error) {
	cookie, err := request.Cookie("password")
	if err != nil {
		log.Println("User not logged in. No cookies found!")
		return nil, err
	}
	cookieValue := make(map[string]string)
	err = s.cookieHandler.Decode("password", cookie.Value, &cookieValue)
	if err != nil {
		return nil, err
	}
	return cookieValue, err
}

func (s *Service) clearSession(request *http.Request, w http.ResponseWriter) (error) {
	existingCookie, err := request.Cookie("password")
	if err != nil {
		log.Println("Error in finding the existing cookie.")
		return err
	}
	cookieValue := make(map[string]string)
	err = s.cookieHandler.Decode("password", existingCookie.Value, &cookieValue)
	name := cookieValue["name"]
	log.Println(name, "logged out")
	cookie := &http.Cookie{
		Name:   "password",
		Value:  "",
		Path:   "/",
		MaxAge: -1,
	}
	http.SetCookie(w, cookie)
	return nil
}
