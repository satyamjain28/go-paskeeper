package main

import (
	"net/http"
	"time"
	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	"log"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"github.com/gorilla/securecookie"
	"io/ioutil"
	"bytes"
	"github.com/BurntSushi/toml"
	"strings"
	"github.com/GeertJohan/go.rice"
)

func generateRandomSecureKey(path string) (*securecookie.SecureCookie) {
	var firstKey, secondKey []byte
	data, err := ioutil.ReadFile(path)
	if err != nil {
		firstKey = securecookie.GenerateRandomKey(64)
		secondKey = securecookie.GenerateRandomKey(32)
		var val []byte
		val = append(val, firstKey...)
		val = append(val, []byte("\n")...)
		val = append(val, secondKey...)
		err := ioutil.WriteFile(path, val, 0777)
		if err != nil {
			panic(err)
		}
	} else {
		keys := bytes.Split(data, []byte("\n"))
		if len(keys) != 2 {
			firstKey = securecookie.GenerateRandomKey(64)
			secondKey = securecookie.GenerateRandomKey(32)
			var val []byte
			val = append(val, firstKey...)
			val = append(val, []byte("\n")...)
			val = append(val, secondKey...)
			err := ioutil.WriteFile(path, val, 0777)
			if err != nil {
				panic(err)
			}
		} else {
			firstKey = keys[0]
			secondKey = keys[1]
		}
	}
	return securecookie.New(
		firstKey, secondKey,
	)
}

// fileServer starts the file server and return the file
func (s *Service) fileServer(r chi.Router, path string) {
	if strings.ContainsAny(path, "{}*") {
		panic("FileServer does not permit URL parameters.")
	}

	fs := http.StripPrefix(path, http.FileServer(rice.MustFindBox("build").HTTPBox()))

	path += "*"

	r.Get(path, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fs.ServeHTTP(w, r)
	}))
}

func NewService(cfg *Config) (*Service, error) {

	gConf, err := initializeConfig(cfg.ConfigFile)
	if err != nil {
		log.Fatal(err)
		return nil, err
	}

	authConfig := authTemplate{
		ClientId:     gConf.ClientId,
		ClientSecret: gConf.ClientSecret,
		KeyPath:      gConf.KeyPath,
		RedirectUrl:  gConf.RedirectURL,
	}
	cookieHandler := generateRandomSecureKey(authConfig.KeyPath)
	oauth2Config := &oauth2.Config{
		ClientID:     authConfig.ClientId,
		ClientSecret: authConfig.ClientSecret,
		RedirectURL:  authConfig.RedirectUrl,
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.profile",
			"https://www.googleapis.com/auth/userinfo.email",
		},
		Endpoint: google.Endpoint,
	}

	b := &Store{Name: cfg.BoltStore}
	err = b.Init()
	if err != nil {
		log.Fatal(err)
		return nil, err
	}

	svc := &Service{
		httpAddr:      cfg.HTTPAddr,
		bolt:          b,
		cookieHandler: cookieHandler,
		oauth2Config:  oauth2Config,
	}

	router := chi.NewRouter()
	router.Use(middleware.Recoverer)
	router.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			log.Printf("Received request on %s %s", r.URL.String(), r.RequestURI)
			next.ServeHTTP(w, r)
		})
	})

	svc.fileServer(router, "/ui")

	router.Get("/", svc.login)
	router.Get("/login", svc.login)
	router.Get("/auth", svc.authorizeRedirect)
	router.Get("/oauth2", svc.validateOauth)
	router.Get("/signout", svc.wrapper(svc.logout))
	router.Get("/session", svc.wrapper(svc.getSessionCookies))

	router.Get("/collection", svc.wrapper(svc.getAllCollections))
	router.Get("/collection/{id}", svc.wrapper(svc.getCollection))
	router.Post("/collection", svc.wrapper(svc.insertCollection))
	router.Put("/collection/{collectionID}/user", svc.wrapper(svc.addUser))
	router.Delete("/collection/{collectionID}/user", svc.wrapper(svc.removeUser))
	router.Delete("/collection/{collectionID}", svc.wrapper(svc.deleteCollection))

	router.Get("/collection/{collectionID}/credential", svc.wrapper(svc.getAllCredentials))
	router.Get("/collection/{collectionID}/credential/{id}", svc.wrapper(svc.getCredential))
	router.Post("/collection/{collectionID}/credential", svc.wrapper(svc.insertCredential))
	router.Delete("/collection/{collectionID}/credential/{id}", svc.wrapper(svc.deleteCredential))


	router.NotFound(func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/ui/"+r.URL.String(), 302)
	})

	srv := &http.Server{
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
		Handler:      router,
	}

	svc.srv = srv
	svc.listener = cfg.HTTPListener
	return svc, nil
}

func (s *Service) Start() error {
	go func() {
		if err := s.srv.Serve(s.listener); err != nil {
			log.Printf("server closed %v", err)
		}
	}()
	return nil
}

func initializeConfig(path string) (Cfg googleConfig, err error) {
	if _, err = toml.DecodeFile(path, &Cfg); err != nil {
		log.Fatalln(err)
		return
	}
	return
}
