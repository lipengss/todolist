#!/bin/bash
# Test auth API via nginx proxy
API_RESULT=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123456"}')
echo "API Login: $API_RESULT"

# Test frontend
CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/)
echo "Frontend: HTTP $CODE"

# Test register
REG_RESULT=$(curl -s -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"testuser","password":"test123"}')
echo "Register: $REG_RESULT"
