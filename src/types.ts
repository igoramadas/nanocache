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
