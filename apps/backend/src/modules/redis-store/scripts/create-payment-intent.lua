-- Atomic payment intent creation Lua script
-- Ensures exactly one payment intent per checkout session
-- KEYS[1] = payment:intent:{checkoutSessionId}
-- KEYS[2] = payment:intent:by-id:{paymentIntentId} (for reverse lookup)
-- ARGV[1] = paymentIntentJson (JSON string of payment intent to create)
-- ARGV[2] = checkoutSessionId (for reverse lookup)
-- ARGV[3] = ttlSeconds (TTL in seconds)

local intentKey = KEYS[1]
local reverseLookupKey = KEYS[2]
local paymentIntentJson = ARGV[1]
local checkoutSessionId = ARGV[2]
local ttlSeconds = tonumber(ARGV[3])

-- Check if payment intent already exists
local existing = redis.call('GET', intentKey)
if existing then
  -- Payment intent already exists, return it
  return {'ok', 'EXISTS', existing}
end

-- Payment intent doesn't exist, create it atomically using SET NX
local created = redis.call('SET', intentKey, paymentIntentJson, 'EX', ttlSeconds, 'NX')
if created == 'OK' then
  -- Successfully created, also create reverse lookup
  redis.call('SET', reverseLookupKey, checkoutSessionId, 'EX', ttlSeconds)
  return {'ok', 'CREATED', paymentIntentJson}
else
  -- Another process created it concurrently, fetch and return
  local concurrent = redis.call('GET', intentKey)
  if concurrent then
    return {'ok', 'EXISTS', concurrent}
  else
    -- Race condition: key was created and deleted, retry creation
    return {'err', 'RACE_CONDITION'}
  end
end

