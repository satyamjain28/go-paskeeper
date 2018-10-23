package main

import (
	"sync"
	"github.com/boltdb/bolt"
	"fmt"
	"encoding/json"
)

type BoltStore struct {
	sync.Mutex
	StoreName string
	Db        *bolt.DB
}

func (b *BoltStore) Init() (err error) {
	db, err := bolt.Open(b.StoreName, 0600, nil)
	if err != nil {
		return
	}
	b.Db = db
	return
}

func (b *BoltStore) Close() error {
	return b.Db.Close()
}

func (b *BoltStore) Put(bucket, key string, body PassStoreBody) error {
	b.Lock()
	defer b.Unlock()
	return b.Db.Update(func(tx *bolt.Tx) (err error) {
		b, err := tx.CreateBucketIfNotExists([]byte(bucket))
		if err != nil {
			return err
		}
		mb, err := json.Marshal(body)
		if err != nil {
			return err
		}
		return b.Put([]byte(key), mb)
	})
}

func (b *BoltStore) Get(bucket string, key string) (psb PassStoreBody, err error) {
	b.Lock()
	defer b.Unlock()
	err = b.Db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(bucket))
		if bucket == nil {
			return fmt.Errorf("bucket %v not found", bucket)
		}
		r := bucket.Get([]byte(key))
		if err = json.Unmarshal(r, &psb); err != nil {
			return err
		}
		return nil
	})
	return
}

func (b *BoltStore) GetAllKeys(bucket string) (ct []string, err error) {
	b.Lock()
	defer b.Unlock()
	err = b.Db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(bucket))
		if bucket == nil {
			return fmt.Errorf("bucket %v not found", bucket)
		}
		c := bucket.Cursor()
		for k, _ := c.First(); k != nil; k, _ = c.Next() {
			ct = append(ct, string(k))
		}
		return nil
	})
	return
}

func (b *BoltStore) GetAllBuckets() (ct []string, err error) {
	b.Lock()
	defer b.Unlock()
	err = b.Db.View(func(tx *bolt.Tx) error {
		tx.ForEach(func(name []byte, bucket *bolt.Bucket) error {
			ct = append(ct, string(name))
			return nil
		})
		return nil
	})
	return
}
