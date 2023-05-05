# Bitecache

[![Version](https://img.shields.io/npm/v/bitecache.svg)](https://npmjs.com/package/bitecache)
[![Coverage Status](https://coveralls.io/repos/github/igoramadas/bitecache/badge.svg?branch=master)](https://coveralls.io/github/igoramadas/bitecache?branch=master)
[![Build Status](https://github.com/igoramadas/bitecache/actions/workflows/build.yml/badge.svg)](https://github.com/igoramadas/bitecache/actions)

A tiny, in-memory cache manager that won't bite you :-)


## Basic usage

```javascript
const cache = require("bitecache")

// Create a "users" cache collection with 20 seconds expiration,
// and a "products" with expiration in 10 minutes.
cache.setup("users", 20)
cache.setup("products", 600)

// Add a new user with cache key "jdoe".
const user = {name: "John", surname: "Doe"}
cache.set("users", "jdoe" user)

// Get John Doe from cache.
const cachedUser = cache.get("users", "jdoe")

// You can also merge data to existing cached objects.
cache.merge("users", "jdoe", {surname: "New Doe"})

// A user that does not exist, will return null.
const invalidUser = cache.get("users", "invalid")

// Remove user from cache.
cache.del("users", "jdoe")

// Individual cache items can also have their own expiresIn, here we add
// a product that expires in 30 seconds instead of the 10 mminutes default.
cache.set("products", "myproduct", {title: "My Product"}, 30)

// Log cache's total size, estimation of memory size, and cache misses.
console.log("Total size", cache.totalSize)
console.log("Total memory size", cache.totalMemSize)
console.log("Total misses", cache.totalMisses)

// Log individual cache collection stats.
console.dir(cache.stats("users"))

// Clear the users cache or all cache collections.
cache.clear("users")
cache.clear()

// By default, hitting an invalid collection will throw an exception.
try {
    const invalidCollection = cache.get("oops", "some-id")
} catch (ex) {
    console.error(ex)
}

// You can disable the strict mode and it won't throw an exception,
// but return undefined instead.
cache.strict = false
const invalidAgain = cache.get("oops", "some-id")
cachet.set("oops", "another invalid")

```
