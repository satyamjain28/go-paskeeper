package main

import (
	"net/http"
	"io/ioutil"
	"github.com/go-chi/chi"
	"encoding/json"
	"github.com/pkg/errors"
	"github.com/fatih/structs"
	"fmt"
	"bytes"
	"html/template"
)

type passReqBody struct {
	BucketId string `json:"bucket"`
	SecretId string `json:"secret_name"`
	Password string `json:"password"`
}

type PassStoreBody struct {
	Owner    string `json:"owner"`
	Password string `json:"password"`
}

func (s *Service) wrapper(h http.HandlerFunc) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		session, err := s.getSession(r)
		if err != nil {
			http.Redirect(w, r, "/login", 301)
			return
		}
		if session == nil {
			http.Redirect(w, r, "/login", 301)
			return
		}
		h.ServeHTTP(w, r)
	})
}

func (s *Service) get(w http.ResponseWriter, r *http.Request) {
	secretID := chi.URLParam(r, "id")
	bucketID := chi.URLParam(r, "bucket")
	passBody, err := s.bolt.Get(bucketID, secretID)
	if err != nil {
		errorResp(w, "error in fetching the password", 400, "failure", err)
		return
	}
	if passBody.Password == "" {
		errorResp(w, "secret not found", 404, "failure", err)
		return
	}
	payload := map[string]string{"password": passBody.Password, "secretID": secretID, "bucketID": bucketID, "owner": passBody.Owner}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	byteResp, err := json.Marshal(payload)
	if err != nil {
		errorResp(w, "error in marshalling the response", 400, "failure", err)
		return
	}
	w.Write(byteResp)
}

func (s *Service) put(w http.ResponseWriter, r *http.Request) {
	user := r.Header.Get("user")
	if user == "" {
		errorResp(w, "user header not found", 400, "", errors.New("user header not found"))
		return
	}
	contents, err := ioutil.ReadAll(r.Body)
	defer r.Body.Close()
	if err != nil {
		errorResp(w, "error in reading body", 400, "", err)
		return
	}
	var reqBody passReqBody
	err = json.Unmarshal(contents, &reqBody)
	if err != nil {
		errorResp(w, "error in unmarshalling body", 400, "", err)
		return
	}
	psb := &PassStoreBody{Owner: user, Password: reqBody.Password}
	err = s.bolt.Put(reqBody.BucketId, reqBody.SecretId, *psb)
	if err != nil {
		errorResp(w, "error in storing the password", 400, "", err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	resp := map[string]string{"status": "successful"}
	respJson, err := json.Marshal(resp)
	if err != nil {
		errorResp(w, "error in marshalling body", 400, "", err)
		return
	}
	w.Write([]byte(respJson))
}

func (s *Service) getAll(w http.ResponseWriter, r *http.Request) {
	bucketID := chi.URLParam(r, "bucket")
	keys, err := s.bolt.GetAllKeys(bucketID)
	if err != nil {
		errorResp(w, "error in fetching the keys", 400, "failure", err)
		return
	}
	payload := map[string]interface{}{"keys": keys, "bucketID": bucketID}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	byteResp, err := json.Marshal(payload)
	if err != nil {
		errorResp(w, "error in marshalling the response", 400, "failure", err)
		return
	}
	w.Write(byteResp)
}

func (s *Service) getAllBuckets(w http.ResponseWriter, r *http.Request) {
	buckets, err := s.bolt.GetAllBuckets()
	if err != nil {
		errorResp(w, "error in fetching the buckets", 400, "failure", err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if len(buckets) == 0 {
		buckets = make([]string, 0)
	}
	byteResp, err := json.Marshal(buckets)
	if err != nil {
		errorResp(w, "error in marshalling the response", 400, "failure", err)
		return
	}
	w.Write(byteResp)
}

func (s *Service) validateOauth(w http.ResponseWriter, r *http.Request) {
	authCode := r.FormValue("code")
	contents, err := s.authorize(authCode, w)
	if err != nil {
		http.Error(w, err.Error(), 401)
		return
	}
	var userInfo UserInfo
	err = json.Unmarshal(contents, &userInfo)
	if err != nil {
		return
	}
	s.setSession(structs.Map(userInfo), w)
	http.Redirect(w, r, "/ui", 301)
}

func (s *Service) authorizeRedirect(w http.ResponseWriter, r *http.Request) {
	url := s.getRedirectURL()
	http.Redirect(w, r, url, 301)
}

func (s *Service) login(w http.ResponseWriter, r *http.Request) {
	var doc bytes.Buffer
	template.Must(template.ParseFiles(
		"build/login.html",
	)).Execute(&doc, nil)
	fmt.Fprintf(w, doc.String())
}


func (s *Service) getSessionCookies(w http.ResponseWriter, r *http.Request) {
	cookies, err := s.getSession(r)
	if err != nil {
		errorResp(w, "not able to fetch cookies", 400, "", err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	byteResp, err := json.Marshal(cookies)
	if err != nil {
		errorResp(w, "error in marshalling the response", 400, "failure", err)
		return
	}
	w.Write(byteResp)
}

func (s *Service) logout(w http.ResponseWriter, r *http.Request) {
	err := s.clearSession(r, w)
	if err != nil {
		errorResp(w, "not able to logout", 400, "", err)
		return
	}
	http.Redirect(w, r, "/login", 301)
}
