const token = "eyJhbGciOiJIUzI1NiIsImtpZCI6IjN6SEpSTWZHYlk2ODZWOUoiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL252eXhlY3Vtbmhrc3hrYXlkZnhpLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI4YTIyZTEwNi1kNDBkLTQwNTEtYmRlMS0xMDg5M2RmZDI5ZjkiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYyMjEyMDAyLCJpYXQiOjE3NjIyMDg0MDIsImVtYWlsIjoidGVzdEBhZ29yYS5kZXYiLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoidGVzdEBhZ29yYS5kZXYiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiI4YTIyZTEwNi1kNDBkLTQwNTEtYmRlMS0xMDg5M2RmZDI5ZjkifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc2MjIwODQwMn1dLCJzZXNzaW9uX2lkIjoiN2ZlMGY0NDctOWY1MS00YWEwLTk1ODMtMjQ4MTlmNjIwOGJkIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.vn8o6bN32q2epnghy_VMz3xgCdP3CVsZKB207jVtiF4";

// Decode JWT payload
const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

console.log('JWT Payload:');
console.log(JSON.stringify(payload, null, 2));

// Check expiration
const now = Math.floor(Date.now() / 1000);
const exp = payload.exp;

console.log('\nExpiration Check:');
console.log('Current time (Unix):', now);
console.log('Token expires (Unix):', exp);
console.log('Token expired:', now > exp);
console.log('Time until expiry:', exp - now, 'seconds');

// Check other important fields
console.log('\nToken Details:');
console.log('Issuer:', payload.iss);
console.log('Audience:', payload.aud);
console.log('Subject (User ID):', payload.sub);
console.log('Email:', payload.email);
