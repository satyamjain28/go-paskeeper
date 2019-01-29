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
	"time"
)

type passReqBody struct {
	CollectionName string   `json:"collection"`
	SecretId       string   `json:"secret_name"`
	Password       string   `json:"password"`
	SharedWith     []string `json:"shared"`
	Type           string   `json:"type"`
}

type userReq struct {
	User string `json:"user"`
}

type bulkUserReq struct {
	Deleted []string `json:"deleted"`
	Added   []string `json:"added"`
}


type CollectionResponse struct {
	Name       string   `json:"name"`
	SharedWith []string `json:"shared,omitempty"`
	Owner      string   `json:"owner"`
	Keys       []string `json:"keys"`
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

func (s *Service) getAllCollections(w http.ResponseWriter, r *http.Request) {
	user := r.Header.Get("user")
	allCollections, err := s.bolt.GetAllCollections()
	if err != nil {
		errorResp(w, "error in fetching the collections", 400, "failure", err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if len(allCollections) == 0 {
		allCollections = make([]string, 0)
	}
	var collections []string
	for _, collectionID := range allCollections {
		c, err := s.bolt.GetCollectionByID(collectionID)
		if err != nil {
			errorResp(w, "error in fetching the collections", 400, "failure", err)
			return
		}
		if c.Owner == user || contains(c.SharedWith, user) {
			collections = append(collections, collectionID)
		}
	}
	b, err := json.Marshal(collections)
	if err != nil {
		errorResp(w, "error in marshalling the response", 400, "failure", err)
		return
	}
	w.Write(b)
}

func (s *Service) getCollection(w http.ResponseWriter, r *http.Request) {
	user := r.Header.Get("user")
	collectionID := chi.URLParam(r, "id")
	collection, err := s.bolt.GetCollectionByID(collectionID)
	if err != nil {
		errorResp(w, "error in fetching the collections", 404, "failure", err)
		return
	}
	if collection.Owner != user {
		flag := false
		for _, email := range collection.SharedWith {
			if email == user {
				flag = true
			}
		}
		if !flag {
			errorResp(w, "unauthorized to fetch this collection", 401, "failure", err)
			return
		}
	}
	keys, err := s.bolt.GetAllKeys(collectionID)
	if err != nil {
		errorResp(w, "error in fetching the collections", 404, "failure", err)
		return
	}
	var collectionResponse CollectionResponse
	collectionResponse.Owner = collection.Owner
	collectionResponse.Name = collection.Name
	collectionResponse.Keys = keys
	if collection.Owner == user {
		collectionResponse.SharedWith = collection.SharedWith
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	b, err := json.Marshal(collectionResponse)
	if err != nil {
		errorResp(w, "error in marshalling the response", 400, "failure", err)
		return
	}
	w.Write(b)
}

func (s *Service) insertCollection(w http.ResponseWriter, r *http.Request) {
	user := r.Header.Get("user")
	if user == "" {
		errorResp(w, "user header not found", 400, "",
			errors.New("user header not found"))
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
	cred := Credential{Password: reqBody.Password, CreatedOn: int(time.Now().Unix()), Type: reqBody.Type}
	collection := Collection{Name: reqBody.CollectionName, SharedWith: reqBody.SharedWith, Owner: user}
	err = s.bolt.Put(collection, reqBody.SecretId, cred)
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

func (s *Service) deleteCollection(w http.ResponseWriter, r *http.Request) {
	collectionID := chi.URLParam(r, "id")
	err := s.bolt.DeleteCollection(collectionID)
	if err != nil {
		errorResp(w, "error in deleting the collection", 400, "failure", err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	payload := map[string]string{
		"status": "successful",
	}
	b, err := json.Marshal(payload)
	if err != nil {
		errorResp(w, "error in marshalling the response", 400, "failure", err)
		return
	}
	w.Write(b)
}

func (s *Service) addUser(w http.ResponseWriter, r *http.Request) {
	user := r.Header.Get("user")
	collectionID := chi.URLParam(r, "collectionID")
	c, err := s.bolt.GetCollectionByID(collectionID)
	if err != nil {
		errorResp(w, "error in fetching the collection", 400, "", err)
		return
	}
	if c.Owner != user {
		errorResp(w, "unauthorized to update the collection", 403, "", err)
		return
	}
	contents, err := ioutil.ReadAll(r.Body)
	defer r.Body.Close()
	if err != nil {
		errorResp(w, "error in reading body", 400, "", err)
		return
	}
	var reqBody userReq
	err = json.Unmarshal(contents, &reqBody)
	if err != nil {
		errorResp(w, "error in unmarshalling body", 400, "", err)
		return
	}
	err = c.addUser(reqBody.User)
	if err != nil {
		errorResp(w, "error in adding the user", 400, "", err)
		return
	}
	err = s.bolt.Update(c)
	if err != nil {
		errorResp(w, "error in updating the added user", 400, "", err)
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

func (s *Service) removeUser(w http.ResponseWriter, r *http.Request) {
	user := r.Header.Get("user")
	collectionID := chi.URLParam(r, "collectionID")
	c, err := s.bolt.GetCollectionByID(collectionID)
	if err != nil {
		errorResp(w, "error in fetching the collection", 400, "", err)
		return
	}
	if c.Owner != user {
		errorResp(w, "unauthorized to update the collection", 403, "", err)
		return
	}
	contents, err := ioutil.ReadAll(r.Body)
	defer r.Body.Close()
	if err != nil {
		errorResp(w, "error in reading body", 400, "", err)
		return
	}
	var reqBody userReq
	err = json.Unmarshal(contents, &reqBody)
	if err != nil {
		errorResp(w, "error in unmarshalling body", 400, "", err)
		return
	}
	err = c.removeUser(reqBody.User)
	if err != nil {
		errorResp(w, "error in removing the user", 400, "", err)
		return
	}
	err = s.bolt.Update(c)
	if err != nil {
		errorResp(w, "error in updating the added user", 400, "", err)
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

func (s *Service) changeUsers(w http.ResponseWriter, r *http.Request) {
	user := r.Header.Get("user")
	collectionID := chi.URLParam(r, "collectionID")
	c, err := s.bolt.GetCollectionByID(collectionID)
	if err != nil {
		errorResp(w, "error in fetching the collection", 400, "", err)
		return
	}
	if c.Owner != user {
		errorResp(w, "unauthorized to update the collection", 403, "", err)
		return
	}
	contents, err := ioutil.ReadAll(r.Body)
	defer r.Body.Close()
	if err != nil {
		errorResp(w, "error in reading body", 400, "", err)
		return
	}
	var reqBody bulkUserReq
	err = json.Unmarshal(contents, &reqBody)
	if err != nil {
		errorResp(w, "error in unmarshalling body", 400, "", err)
		return
	}
	for _, element := range reqBody.Deleted {
		err = c.removeUser(element)
		if err != nil {
			errorResp(w, fmt.Sprintf("error in removing the user %s", element), 400, "", err)
			return
		}
	}
	for _, element := range reqBody.Added {
		err = c.addUser(element)
		if err != nil {
			errorResp(w, fmt.Sprintf("error in adding the user %s", element), 400, "", err)
			return
		}
	}
	err = s.bolt.Update(c)
	if err != nil {
		errorResp(w, "error in updating the added user", 400, "", err)
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

func (s *Service) getAllCredentials(w http.ResponseWriter, r *http.Request) {
	collectionID := chi.URLParam(r, "collectionID")
	keys, err := s.bolt.GetAllKeys(collectionID)
	if err != nil {
		errorResp(w, "error in fetching the keys", 400, "failure", err)
		return
	}
	payload := map[string]interface{}{"keys": keys, "collectionID": collectionID}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	byteResp, err := json.Marshal(payload)
	if err != nil {
		errorResp(w, "error in marshalling the response", 400, "failure", err)
		return
	}
	w.Write(byteResp)
}

func (s *Service) getCredential(w http.ResponseWriter, r *http.Request) {
	credID := chi.URLParam(r, "id")
	collectionID := chi.URLParam(r, "collectionID")
	cred, err := s.bolt.GetCred(collectionID, credID)
	if err != nil {
		errorResp(w, "error in fetching the password", 400, "failure", err)
		return
	}
	if cred.Password == "" {
		errorResp(w, "secret not found", 404, "failure", err)
		return
	}
	//collection, err := s.bolt.GetCollectionByID(collectionID)
	//if err != nil {
	//	errorResp(w, "error in fetching the collection", 400, "failure", err)
	//	return
	//}
	//keys, err := s.bolt.GetAllKeys(collectionID)
	//if err != nil {
	//	errorResp(w, "error in fetching the keys of the collection", 400, "failure", err)
	//	return
	//}
	payload := map[string]interface{}{
		"password":     cred.Password,
		"secretID":     credID,
		"collectionID": collectionID,
		"type":         cred.Type,
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	byteResp, err := json.Marshal(payload)
	if err != nil {
		errorResp(w, "error in marshalling the response", 400, "failure", err)
		return
	}
	w.Write(byteResp)
}

func (s *Service) insertCredential(w http.ResponseWriter, r *http.Request) {
	user := r.Header.Get("user")
	collectionID := chi.URLParam(r, "collectionID")
	c, err := s.bolt.GetCollectionByID(collectionID)
	if err != nil {
		errorResp(w, "error in fetching the collection", 400, "", err)
		return
	}
	if c.Owner != user {
		errorResp(w, "unauthorized to create new credential", 403, "", err)
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
	cred := Credential{Password: reqBody.Password, CreatedOn: int(time.Now().Unix()), Type: reqBody.Type}
	err = s.bolt.Put(c, reqBody.SecretId, cred)
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

func (s *Service) deleteCredential(w http.ResponseWriter, r *http.Request) {
	collectionID := chi.URLParam(r, "collectionID")
	credentialID := chi.URLParam(r, "id")
	err := s.bolt.DeleteCredential(collectionID, credentialID)
	if err != nil {
		errorResp(w, "error in deleting the collection", 400, "failure", err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	payload := map[string]string{
		"status": "successful",
	}
	b, err := json.Marshal(payload)
	if err != nil {
		errorResp(w, "error in marshalling the response", 400, "failure", err)
		return
	}
	w.Write(b)
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

func contains(arr []string, element string) bool {
	for _, ele := range arr {
		if ele == element {
			return true
		}
	}
	return false
}