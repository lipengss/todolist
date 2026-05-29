#!/bin/bash
# Try both passwords
for pw in admin123456 admin; do
  CAPTCHA=$(curl -s http://localhost:8080/api/auth/captcha)
  TOKEN=$(echo "$CAPTCHA" | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')
  sleep 2
  printf '{"username":"admin","password":"%s","captchaToken":"%s"}' "$pw" "$TOKEN" > /tmp/login.json
  echo "Testing password: $pw"
  curl -s -X POST http://localhost:8080/api/auth/login -H 'Content-Type: application/json' -d @/tmp/login.json
  echo ""
done
