// Bitecache Types

/**
 * A collection of cached items.
 */
export interface CacheCollection {
    /** Cached items. */
    items: {}
    /** Default expires in (seconds). */
    expiresIn: number
    /** Timer to expire old items.  */
    expireTimer: any
    /** Collection size (count). */
    size: number
    /** Cache misses (count). */
    misses: number
}

/**
 * A cached item.
 */
export interface CacheItem {
    /** Cached data. */
    data: any
    /** Expire timestamp (epoch). */
    expires: number
}

/**
 * Cache collection stats.
 */
export interface CacheStats {
    /** How many items cached. */
    size: number
    /** Approx. memory used. */
    memSize: number
    /** Total of cache misses. */
    misses: number
    /** Expires in. */
    expiresIn: number
}
