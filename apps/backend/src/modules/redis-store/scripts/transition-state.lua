-- Atomic state transition Lua script
-- KEYS[1] = checkout:session:{checkoutSessionId}
-- ARGV[1] = fromState (expected current state)
-- ARGV[2] = toState (target state)
-- ARGV[3] = updatedAt (ISO timestamp string)
-- ARGV[4] = allowedTransitions (JSON array of allowed states from fromState)

local key = KEYS[1]
local fromState = ARGV[1]
local toState = ARGV[2]
local updatedAt = ARGV[3]
local allowedTransitionsJson = ARGV[4]

-- Get current session
local current = redis.call('GET', key)
if not current then
  return {'err', 'SESSION_NOT_FOUND'}
end

-- Parse session JSON
local session = cjson.decode(current)

-- Verify current state matches expected fromState
if session.state ~= fromState then
  return {'err', 'INVALID_TRANSITION', session.state, fromState}
end

-- Parse allowed transitions
local allowedTransitions = cjson.decode(allowedTransitionsJson)

-- Check if transition is allowed (idempotent same-state transitions are always allowed)
local isAllowed = false
if fromState == toState then
  isAllowed = true
else
  -- Check if toState is in allowed transitions list
  for i, allowedState in ipairs(allowedTransitions) do
    if allowedState == toState then
      isAllowed = true
      break
    end
  end
end

if not isAllowed then
  return {'err', 'TRANSITION_NOT_ALLOWED', fromState, toState}
end

-- Update state and timestamp
session.state = toState
session.updatedAt = updatedAt

-- Save updated session
redis.call('SET', key, cjson.encode(session))

return {'ok', toState}

