// Bitecache

import {CacheCollection, CacheItem} from "./types"
import logger = require("anyhow")

/**
 * Bitecache wrapper.
 */
class Bitecache {
    private constructor() {}
    private static _instance: Bitecache
    static get Instance() {
        return this._instance || (this._instance = new this())
    }

    /**
     * Main holder of cached objects.
     */
    private store: any = {}

    /**
     * Total cache size.
     */
    get totalSize(): number {
        let result = 0
        for (let collection in this.store) {
            result += this.store[collection].size
        }
        return result
    }

    /**
     * Total memory used by the cache.
     */
    get totalMemSize(): number {
        let result = 0
        for (let collection in this.store) {
            result += this.memSizeOf(collection)
        }
        return result
    }

    /**
     * Total cache misses.
     */
    get totalMisses() {
        let result = 0
        for (let collection in this.store) {
            result += this.store[collection].misses
        }
        return result
    }

    // SETUP
    // --------------------------------------------------------------------------

    /**
     * Setup a cache object with the specified name.
     * @param collection The collection name.
     * @param expiresIn Default expiration in seconds.
     */
    setup = (collection: string, expiresIn: number): void => {
        if (expiresIn < 1) {
            expiresIn = 1
        }

        // Replace current or create new collection?
        if (this.store[collection]) {
            clearInterval(this.store[collection].clearTimer)
            logger.info("Bitecache.setup", collection, `Expires in ${expiresIn}s`, "Collection already exists, will overwrite it")
        } else {
            logger.info("Bitecache.setup", collection, `Expires in ${expiresIn}s`)
        }

        // Cleanup helper.
        const cleanup = () => {
            this.expire(collection)
        }

        // Create and save the store collection.
        const store: CacheCollection = {
            items: {},
            expiresIn: expiresIn,
            expireTimer: setInterval(cleanup, expiresIn * 1000),
            size: 0,
            misses: 0
        }

        this.store[collection] = store
    }

    // METHODS
    // --------------------------------------------------------------------------

    /**
     * Add an object to the specified cache collection.
     * @param collection Cache collection name.
     * @param key The object's unique key.
     * @param value The actual object.
     * @param expiresIn Optional if object should expire on a specific interval.
     */
    set = (collection: string, key: string | number | Date, value: any, expiresIn?: number): void => {
        try {
            const store: CacheCollection = this.store[collection]
            if (!store) {
                throw new Error(`Invalid collection: ${collection}`)
            }

            // Defaults to store's expireIn if the value is not valid.
            if (expiresIn < 0) {
                expiresIn = store.expiresIn
            }

            // Force key as string.
            key = key.toString()

            const now = new Date().getTime()
            const expires = expiresIn ? now + expiresIn * 1000 : now + store.expiresIn * 1000
            const item: CacheItem = {data: value, expires: expires}
            store.items[key] = item
            store.size++
        } catch (ex) {
            logger.error("Bitecache.set", collection, key, ex)
            throw ex
        }
    }

    /**
     * Get an object from the specified cache collection.
     * @param collection Cache collection name.
     * @param key The object's unique key.
     */
    get = (collection: string, key: string | number | Date): any => {
        try {
            const store: CacheCollection = this.store[collection]
            if (!store) {
                throw new Error(`Invalid collection: ${collection}`)
            }

            // Force key as string.
            key = key.toString()

            const now = new Date().getTime()
            const item = store.items[key]

            if (!item) {
                store.misses++
                return null
            }

            if (item.expires <= now) {
                delete store.items[key]
                store.size--
                return null
            }

            return item.data
        } catch (ex) {
            logger.error("Bitecache.get", collection, key, ex)
            throw ex
        }
    }

    /**
     * Remove an object from the specified cache collection.
     * @param collection Cache collection name.
     * @param key The object's unique key.
     */
    del = (collection: string, key: string | number | Date): boolean => {
        try {
            const store: CacheCollection = this.store[collection]
            if (!store) {
                throw new Error(`Invalid collection: ${collection}`)
            }

            // Force key as string.
            key = key.toString()

            if (!(key in store.items)) {
                store.misses++
                return false
            }

            delete store.items[key]
            store.size--

            return true
        } catch (ex) {
            logger.error("Bitecache.del", collection, key, ex)
            throw ex
        }
    }

    /**
     * Remove old items from the specified cache collection.
     * @param collection Cache collection name.
     */
    expire = (collection: string) => {
        try {
            const store: CacheCollection = this.store[collection]
            if (!store) {
                throw new Error(`Invalid collection: ${collection}`)
            }

            const storeItems = Object.entries(store.items)
            const now = new Date().getTime()
            let key: string
            let item: any

            for ([key, item] of storeItems) {
                if (item.expires <= now) {
                    delete store.items[key]
                    store.size--
                }
            }
        } catch (ex) {
            logger.error("Bitecache.expire", collection, ex)
            throw ex
        }
    }

    /**
     * Clear the cache.
     * @param collection Optional collection, if not specified will clear all collections.
     */
    clear = (collection?: string) => {
        try {
            if (collection) {
                const store: CacheCollection = this.store[collection]
                if (!store) {
                    throw new Error(`Invalid collection: ${collection}`)
                }
                store.items = {}
                store.size = 0
                store.misses = 0
            } else {
                for (let c in this.store) {
                    this.store[c].items = {}
                    this.store[c].size = 0
                    this.store[c].misses = 0
                }
            }
        } catch (ex) {
            logger.error("Bitecache.expire", collection, ex)
            throw ex
        }
    }

    /**
     * Get individual stats for the specified cache collection.
     * @param collection Optional cache collection name.
     */
    stats = (collection?: string) => {
        try {
            const store: CacheCollection = this.store[collection]
            if (!store) {
                throw new Error(`Invalid collection: ${collection}`)
            }

            return {
                size: store.size,
                memSize: this.memSizeOf(collection),
                misses: store.misses,
                expiresIn: store.expiresIn
            }
        } catch (ex) {
            logger.error("Bitecache.stats", collection, ex)
            throw ex
        }
    }

    // HELPERS
    // --------------------------------------------------------------------------

    /**
     * Calculate memory usage for the specified collection.
     *
     */
    memSizeOf = (collection: string): number => {
        try {
            const store: CacheCollection = this.store[collection]
            if (!store) {
                throw new Error(`Invalid collection: ${collection}`)
            }

            const objectList = []
            let stack = [store.items]
            let bytes = 0

            // Iterate items to calculate memory size.
            while (stack.length) {
                let value = stack.pop()

                if (typeof value === "boolean") {
                    bytes += 4
                } else if (typeof value === "string") {
                    bytes += value.length * 2
                } else if (typeof value === "number") {
                    bytes += 8
                } else if (typeof value === "object" && objectList.indexOf(value) === -1) {
                    objectList.push(value)

                    if (Object.prototype.toString.call(value) != "[object Array]") {
                        for (let key in value) {
                            bytes += 2 * key.length
                        }
                    }

                    for (let key in value) {
                        stack.push(value[key])
                    }
                }
            }

            return bytes
        } catch (ex) {
            logger.error("Bitecache.expire", collection, ex)
            throw ex
        }
    }
}

// Exports...
export = Bitecache.Instance
