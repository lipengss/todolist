#!/bin/bash
echo "=== 1. Register new user ==="
REG=$(curl -s -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"testuser1","password":"test123"}')
echo "$REG"

echo ""
echo "=== 2. Login as admin ==="
CAPTCHA=$(curl -s http://localhost:8080/api/auth/captcha)
TOKEN=$(echo "$CAPTCHA" | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')
sleep 2
ADMIN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"admin\",\"password\":\"admin\",\"captchaToken\":\"$TOKEN\"}")
ADMIN_TOKEN=$(echo "$ADMIN" | python3 -c 'import sys,json; print(json.load(sys.stdin)["access_token"])')
echo "Admin logged in"

echo ""
echo "=== 3. List registrations ==="
REGS=$(curl -s http://localhost:8080/api/auth/registrations \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$REGS"
REG_ID=$(echo "$REGS" | python3 -c 'import sys,json; items=json.load(sys.stdin); print(items[0]["id"])')
echo "Registration ID: $REG_ID"

echo ""
echo "=== 4. Approve registration ==="
curl -s -X POST "http://localhost:8080/api/auth/registrations/$REG_ID/approve" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
echo ""

echo ""
echo "=== 5. Login as approved user ==="
CAPTCHA2=$(curl -s http://localhost:8080/api/auth/captcha)
TOKEN2=$(echo "$CAPTCHA2" | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')
sleep 2
curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"testuser1\",\"password\":\"test123\",\"captchaToken\":\"$TOKEN2\"}"
echo ""
