package main

import (
	"sync"
	"github.com/boltdb/bolt"
	"fmt"
	"encoding/json"
	"github.com/pkg/errors"
)

type Store struct {
	sync.Mutex
	Name string
	Db   *bolt.DB
}

func (s *Store) Init() (err error) {
	db, err := bolt.Open(s.Name, 0600, nil)
	if err != nil {
		return
	}
	s.Db = db
	return
}

func (s *Store) Close() error {
	return s.Db.Close()
}

func (s *Store) Put(c Collection, key string, cred Credential) error {
	s.Lock()
	defer s.Unlock()
	return s.Db.Update(func(tx *bolt.Tx) (err error) {
		b, err := tx.CreateBucket([]byte(c.Name))
		if err != nil && err != bolt.ErrBucketExists {
			return err
		} else if err == bolt.ErrBucketExists {
			b = tx.Bucket([]byte(c.Name))
		} else {
			sw, err := json.Marshal(c)
			if err != nil {
				return err
			}
			err = b.Put([]byte(MetadataId), sw)
			if err != nil {
				return err
			}
		}
		mb, err := json.Marshal(cred)
		if err != nil {
			return err
		}
		return b.Put([]byte(key), mb)
	})
}

func (s *Store) Update(c Collection) error {
	s.Lock()
	defer s.Unlock()
	return s.Db.Update(func(tx *bolt.Tx) (err error) {
		b := tx.Bucket([]byte(c.Name))
		sw, err := json.Marshal(c)
		if err != nil {
			return err
		}
		return b.Put([]byte(MetadataId), sw)

	})
}

func (s *Store) GetCred(collectionID string, key string) (cred Credential, err error) {
	s.Lock()
	defer s.Unlock()
	err = s.Db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(collectionID))
		if b == nil {
			return fmt.Errorf("collection id %v not found", b)
		}
		r := b.Get([]byte(key))
		if err = json.Unmarshal(r, &cred); err != nil {
			return err
		}
		return nil
	})
	return
}

func (s *Store) GetAllKeys(collectionId string) (keys []string, err error) {
	s.Lock()
	defer s.Unlock()
	err = s.Db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(collectionId))
		if b == nil {
			return fmt.Errorf("collection id %v not found", collectionId)
		}
		c := b.Cursor()
		for k, _ := c.First(); k != nil; k, _ = c.Next() {
			if string(k) != MetadataId {
				keys = append(keys, string(k))
			}
		}
		return nil
	})
	return
}

func (s *Store) GetAllCollections() (ct []string, err error) {
	s.Lock()
	defer s.Unlock()
	err = s.Db.View(func(tx *bolt.Tx) error {
		tx.ForEach(func(name []byte, bucket *bolt.Bucket) error {
			ct = append(ct, string(name))
			return nil
		})
		return nil
	})
	return
}

func (s *Store) DeleteCollection(collectionID string) (err error) {
	s.Lock()
	defer s.Unlock()
	err = s.Db.Update(func(tx *bolt.Tx) (err error) {
		return tx.DeleteBucket([]byte(collectionID))
	})
	return
}

func (s *Store) GetCollectionByID(collectionID string) (c Collection, err error) {
	s.Lock()
	defer s.Unlock()
	err = s.Db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(collectionID))
		if b == nil {
			return fmt.Errorf("collection %s not found", collectionID)
		}
		cBytes := b.Get([]byte(MetadataId))
		err = json.Unmarshal(cBytes, &c)
		if err != nil {
			return err
		}
		return nil
	})
	return
}

func (s *Store) DeleteCredential(collectionID, key string) (err error) {
	s.Lock()
	defer s.Unlock()
	err = s.Db.Update(func(tx *bolt.Tx) (err error) {
		b := tx.Bucket([]byte(collectionID))
		if b == nil {
			return errors.New("collection doesn't exist")
		}
		return b.Delete([]byte(key))
	})
	return
}