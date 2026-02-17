const NodeCache = require("node-cache");

const cache = new NodeCache({
  stdTTL: 300, // 5 minutes default
  checkperiod: 60,
  maxKeys: 1000,
});

function cacheMiddleware(ttl = 300) {
  return (req, res, next) => {
    if (req.method !== "GET") return next();

    const key = `__cache__${req.originalUrl}`;
    const cached = cache.get(key);

    if (cached) {
      return res.json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode === 200) {
        cache.set(key, body, ttl);
      }
      return originalJson(body);
    };

    next();
  };
}

function invalidateCache(pattern) {
  const keys = cache.keys();
  keys.forEach((key) => {
    if (key.includes(pattern)) cache.del(key);
  });
}

module.exports = { cache, cacheMiddleware, invalidateCache };
