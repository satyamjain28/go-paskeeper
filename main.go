package main

import (
	"net/http"
	"os"
	"log"
	"net"
	"context"
	"crawshaw.io/littleboss"
	"flag"
	"golang.org/x/oauth2"
	"github.com/gorilla/securecookie"
)

type authTemplate struct {
	ClientId     string
	ClientSecret string
	RedirectUrl  string
	KeyPath      string
}

type Service struct {
	srv           *http.Server
	httpAddr      string
	bolt          *BoltStore
	pe            *PassEncryption
	listener      net.Listener
	oauth2Config  *oauth2.Config
	cookieHandler *securecookie.SecureCookie
}

type Config struct {
	BoltStore    string
	HTTPAddr     string
	HTTPListener net.Listener
}

type googleConfig struct {
	ClientId     string `toml:"client_id"`
	ClientSecret string `toml:"client_secret"`
	KeyPath      string `toml:"keypath"`
	RedirectURL  string `toml:"redirect_url"`
}

var (
	cfg *Config
)

func init() {
	cfg = &Config{}
}

func main() {
	lb := littleboss.New("epasman")
	lb.Command("service", flag.String("service", "start", "littleboss start command"))
	flagHTTP := lb.Listener("http", "tcp", ":80", "-http :80")
	flagBolt := flag.String("store", "store", "littleboss bolt file")
	flag.Parse()

	lb.Run(func(ctx context.Context) {
		run(context.Background(), flagHTTP, flagBolt)
	})
	log.Printf("Password manager exited")
}

func run(ctx context.Context, flagHTTP *littleboss.ListenerFlag, flagBolt *string) {
	cfg.HTTPListener = flagHTTP.Listener()
	cfg.HTTPAddr = flagHTTP.String()
	cfg.BoltStore = *flagBolt
	svc, err := NewService(cfg)
	if err != nil {
		log.Fatal(err)
		os.Exit(1)
	}

	go func() {
		if err := svc.Start(); err != nil {
			if err == http.ErrServerClosed {
				return
			}
			log.Fatal(err)
		}
	}()

	<-ctx.Done()
}
