// TEST: NANOCACHE

let chai = require("chai")
let mocha = require("mocha")
let before = mocha.before
let describe = mocha.describe
let it = mocha.it

chai.should()

describe("Bitecache Tests", function () {
    let logger = require("anyhow")
    logger.setup("none")

    let bitecache = require("../lib/index.js")

    it("Setup a collection with invalid expiresIn", function () {
        bitecache.setup("test", -5)
    })

    it("Setup other collections", function () {
        bitecache.setup("test-another", 1)
        bitecache.setup("test-complex", 60)
    })

    it("Wait for expiration of items on test-another", function (done) {
        this.timeout(3000)
        bitecache.set("test-another", "expire1", 1)
        bitecache.set("test-another", "expire2", 2)

        const check = () => {
            if (bitecache.totalSize == 0) {
                done()
            } else {
                done("Items on test-another did not expire")
            }
        }

        setTimeout(check, 2000)
    })

    it("Setup same test collection again with expiresIn 1", function () {
        bitecache.setup("test", 1)
    })

    it("Try getting invalid cache items, cache misses should be 3", function (done) {
        bitecache.get("test", "notexist1")
        bitecache.get("test", "notexist2")
        bitecache.get("test", "notexist3")

        const misses = bitecache.totalMisses

        if (misses == 3) {
            done()
        } else {
            done(`The total misses should be 3, but got ${misses}`)
        }
    })

    it("Add an item to the cache", function () {
        bitecache.set("test", "a", "First", 1)
    })

    it("Add an item to the cache with custom expiresIn 10", function () {
        bitecache.set("test", "b", "Second", 10)
    })

    it("Get second added item", function (done) {
        const second = bitecache.get("test", "b")

        if (second == "Second") {
            done()
        } else {
            done("Did not return 'Second' for item 'b'")
        }
    })

    it("First item should have expired", function (done) {
        const checkFirst = () => {
            const first = bitecache.get("test", "a")

            if (!first) {
                done()
            } else {
                done("Item 'a' should have expired")
            }
        }

        setTimeout(checkFirst, 1100)
    })

    it("Add 10 itens to another collection", function () {
        for (let i = 0; i < 10; i++) {
            bitecache.set("test-another", i.toString(), i * 10)
        }
    })

    it("Current size should be 11 (1 from test, 10 from test-another)", function (done) {
        const size = bitecache.totalSize

        if (size == 11) {
            done()
        } else {
            done(`Cache total size should be 11 but got ${size}`)
        }
    })

    it("Delete item from cache", function (done) {
        if (bitecache.del("test", "b")) {
            done()
        } else {
            done("Deleting 'b' item should return true, but got false")
        }
    })

    it("Deleting invalid item should return false, and current size 10", function (done) {
        const size = bitecache.totalSize

        if (bitecache.del("test", "b")) {
            done("Deleting 'b' item again should return false, but got true")
        } else if (size != 10) {
            done(`Cache total size should be now 10 but got ${size}`)
        } else {
            done()
        }
    })

    it("Clear test-another, size should now be 0", function (done) {
        bitecache.clear("test-another")

        const size = bitecache.totalSize

        if (size == 0) {
            done()
        } else {
            done(`Total size should now be 0 but got ${size}`)
        }
    })

    it("Get size used by cache", function (done) {
        bitecache.set("test-complex", "boolean", true)
        bitecache.set("test-complex", "string", "a")
        bitecache.set("test-complex", "number", 123)
        bitecache.set("test-complex", "date", new Date())
        bitecache.set("test-complex", "array", ["1", 1, null])
        bitecache.set("test-complex", "defaultExpires", {}, -1)

        const memsize = bitecache.totalMemSize
        if (memsize > 150) {
            done()
        } else {
            done(`Total estimated memory size should be at least 150 bytes, but got ${memsize}`)
        }
    })

    it("Merge data to existing cache item", function (done) {
        bitecache.set("test-complex", "to-merge", {a: "a", b: "a"})
        bitecache.merge("test-complex", "to-merge", {b: "b"})

        bitecache.set("test-complex", "to-merge-fail", 1)
        bitecache.merge("test-complex", "to-merge-fail", 2)

        if (bitecache.get("test-complex", "to-merge").b == "a") {
            done("Did not merge data")
        } else {
            done()
        }
    })

    it("Get stats for cache", function () {
        bitecache.stats("test-complex")
    })

    it("Clear all", function () {
        bitecache.clear()
    })

    it("Throw error when calling methods on invalid collection", function (done) {
        try {
            bitecache.set("invalid")
            done("Calling set on invalid collection should throw an error")
        } catch (ex) {}

        try {
            bitecache.get("invalid")
            done("Calling get on invalid collection should throw an error")
        } catch (ex) {}

        try {
            bitecache.del("invalid")
            done("Calling del on invalid collection should throw an error")
        } catch (ex) {}

        try {
            bitecache.merge("invalid")
            done("Calling merge on invalid collection should throw an error")
        } catch (ex) {}

        try {
            bitecache.expire("invalid")
            done("Calling expire on invalid collection should throw an error")
        } catch (ex) {}

        try {
            bitecache.clear("invalid")
            done("Calling clear on invalid collection should throw an error")
        } catch (ex) {}

        try {
            bitecache.stats("invalid")
            done("Calling stats on invalid collection should throw an error")
        } catch (ex) {}

        try {
            bitecache.memSizeOf("invalid")
            done("Calling memSizeOf on invalid collection should throw an error")
        } catch (ex) {}

        done()
    })

    it("Do not throw is strict is false", function (done) {
        bitecache.strict = false

        try {
            bitecache.set("invalid")
        } catch (ex) {
            return done("Calling set on invalid collection should not throw an error")
        }

        try {
            bitecache.get("invalid")
        } catch (ex) {
            return done("Calling set on invalid collection should not throw an error")
        }

        try {
            bitecache.del("invalid")
        } catch (ex) {
            return done("Calling del on invalid collection should not throw an error")
        }

        try {
            bitecache.merge("invalid")
        } catch (ex) {
            return done("Calling merge on invalid collection should not throw an error")
        }

        try {
            bitecache.expire("invalid")
        } catch (ex) {
            return done("Calling expire on invalid collection should not throw an error")
        }

        try {
            bitecache.clear("invalid")
        } catch (ex) {
            return done("Calling clear on invalid collection should not throw an error")
        }

        try {
            bitecache.stats("invalid")
        } catch (ex) {
            return done("Calling stats on invalid collection should not throw an error")
        }

        try {
            bitecache.memSizeOf("invalid")
        } catch (ex) {
            return done("Calling memSizeOf on invalid collection should not throw an error")
        }

        done()
    })
})
