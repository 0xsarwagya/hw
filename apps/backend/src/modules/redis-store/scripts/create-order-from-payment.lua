-- KEYS[1] = order:payment:{provider}:{paymentIntentId}
-- ARGV[1] = orderId (UUID string)
-- ARGV[2] = ttlSeconds (TTL for the key)

local orderKey = KEYS[1]
local orderId = ARGV[1]
local ttlSeconds = tonumber(ARGV[2])

-- Try to get existing order ID
local existingOrderId = redis.call('GET', orderKey)

if existingOrderId then
  -- Order already exists for this payment intent, return existing order ID
  return { "ok", "EXISTS", existingOrderId }
else
  -- Order doesn't exist, create mapping atomically
  local ok = redis.call('SET', orderKey, orderId, 'EX', ttlSeconds, 'NX')
  if ok then
    -- Successfully created mapping
    return { "ok", "CREATED", orderId }
  else
    -- Another client created it concurrently, get the value
    local concurrentOrderId = redis.call('GET', orderKey)
    return { "ok", "EXISTS", concurrentOrderId }
  end
end

