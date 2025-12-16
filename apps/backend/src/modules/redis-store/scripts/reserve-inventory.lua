-- Atomic reservation Lua script
-- KEYS[1] = inventory:variant:{variantId} (total inventory)
-- KEYS[2] = inventory:reserved:{variantId} (aggregated reserved count)
-- KEYS[3] = inventory:reservation:{cartId}:{variantId} (individual reservation)
-- ARGV[1] = quantity to reserve
-- ARGV[2] = ttlSeconds

local available = tonumber(redis.call('GET', KEYS[1]) or 0)
local reserved = tonumber(redis.call('GET', KEYS[2]) or 0)
local qty = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])

-- Check if there's enough available inventory (total - reserved)
local availableAfterReserved = available - reserved
if availableAfterReserved < qty then
  return {err = 'INSUFFICIENT_INVENTORY', available = availableAfterReserved}
end

-- Check if reservation already exists for this cart
local existingReservation = tonumber(redis.call('GET', KEYS[3]) or 0)
local deltaQty = qty - existingReservation

if deltaQty > 0 then
  -- Need to reserve more - increment aggregated reserved count
  redis.call('INCRBY', KEYS[2], deltaQty)
elseif deltaQty < 0 then
  -- Need to release some - decrement aggregated reserved count
  redis.call('INCRBY', KEYS[2], deltaQty)
end

-- Set or update individual reservation with TTL
redis.call('SET', KEYS[3], qty, 'EX', ttl)

local newReserved = reserved + deltaQty
return {ok = true, available = available - newReserved, reserved = newReserved}

