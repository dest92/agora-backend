# Authentication Tests - Bruno Collection

Comprehensive test suite for authentication endpoints following Bruno best practices.

## 📋 Test Coverage

### 1. Register Endpoint (`POST /auth/register`)

**Tests Implemented (6 test groups):**

1. **Response Status Validation**
   - Accepts 201 (new user) or 400 (user exists)
   - Validates appropriate status codes

2. **Content-Type Verification**
   - Ensures JSON response format
   - Validates proper headers

3. **Response Time Check**
   - Maximum 3 seconds response time
   - Performance monitoring

4. **Successful Registration (201)**
   - User object structure validation
   - Email verification against request
   - UUID format validation for user ID
   - Session object with tokens
   - JWT format validation (3 parts)
   - Environment variable persistence
   - User metadata verification

5. **User Already Exists (400)**
   - Error message validation
   - Status code verification
   - Helpful console messages

6. **Security Validation**
   - No password in response
   - No sensitive data exposure

**Automatic Actions:**
- ✅ Saves `JWT` token
- ✅ Saves `REFRESH_TOKEN`
- ✅ Saves `USER_ID`

---

### 2. Login Endpoint (`POST /auth/login`)

**Tests Implemented (11 test groups):**

1. **Authentication Success**
   - 200 OK status validation
   - Successful login verification

2. **Content-Type Verification**
   - JSON response validation

3. **Response Time**
   - Maximum 2 seconds
   - Performance baseline

4. **User Object Validation**
   - Complete structure verification
   - Email matching
   - UUID format validation
   - Audience verification (authenticated)

5. **Session Object Validation**
   - Access token presence and format
   - Refresh token presence and format
   - Token type verification (bearer)

6. **JWT Format Validation**
   - 3-part structure (header.payload.signature)
   - Base64url encoding verification
   - Non-empty parts validation

7. **Token Expiration**
   - Expires_in field validation
   - Reasonable expiration time (max 24h)

8. **Environment Persistence**
   - JWT token saved
   - Refresh token saved
   - User ID saved
   - Verification of saved values
   - Console logging for confirmation

9. **User Metadata**
   - Timestamps validation (created_at, updated_at)
   - ISO date format verification
   - Role field validation

10. **Security Validation**
    - No password in response
    - No database credentials
    - No sensitive data exposure

11. **Session Consistency**
    - User ID consistency across objects

**Automatic Actions:**
- ✅ Saves `JWT` token
- ✅ Saves `REFRESH_TOKEN`
- ✅ Saves `USER_ID`
- ✅ Logs expiration time

---

### 3. Login Invalid Credentials (`POST /auth/login`)

**Tests Implemented (8 test groups):**

1. **Unauthorized Status**
   - 401 status code validation

2. **Content-Type**
   - JSON response format

3. **Error Structure**
   - Message field presence
   - StatusCode field validation

4. **Error Message Content**
   - Generic error message (security best practice)
   - No user enumeration

5. **Security - No Data Leak**
   - No "user not found" messages
   - No "email does not exist" messages
   - No password requirements in error

6. **No Session Data**
   - No session object returned
   - No access_token returned
   - No user object returned

7. **Response Time**
   - Similar to success case (prevents timing attacks)
   - Maximum 3 seconds

8. **Error Format Consistency**
   - NestJS standard error format
   - Consistent structure

**Security Features Validated:**
- ✅ No user enumeration
- ✅ Generic error messages
- ✅ Timing attack prevention
- ✅ No sensitive data in errors

---

### 4. Test Auth Endpoint (`GET /auth/test`)

**Purpose:** Verify JWT token validity

**Tests:**
- 200 status with valid JWT
- User info extraction from token
- User ID matching

---

### 5. Unauthorized Test (`GET /workspaces`)

**Purpose:** Verify auth enforcement

**Tests:**
- 401 without token
- Error message validation
- Auth guard functionality

---

### 6. Refresh Token (`POST /auth/refresh`)

**Tests Implemented (9+ test groups):**

1. **Refresh Success**
   - 200 OK or 401/404 if no token
   - Helpful console messages

2. **Content-Type** (if 200)
   - JSON response validation

3. **Response Time** (if 200)
   - Maximum 2 seconds

4. **New Session Data** (if 200)
   - New access token
   - New/same refresh token
   - Token type verification

5. **JWT Format** (if 200)
   - 3-part structure validation

6. **Token Expiration** (if 200)
   - New expires_in value
   - Positive expiration time

7. **Environment Update** (if 200)
   - JWT token updated
   - Refresh token updated (if rotated)
   - Verification of updates
   - Console logging

8. **User Data Consistency** (if 200)
   - User ID matching
   - Email consistency

9. **Token Rotation Detection** (if 200)
   - Detects if refresh token changed
   - Logs rotation (enhanced security)

10. **Error Handling** (if 401)
    - Proper error structure
    - Status code validation

**Automatic Actions:**
- ✅ Updates `JWT` token
- ✅ Updates `REFRESH_TOKEN` (if rotated)
- ✅ Preserves `USER_ID`
- ✅ Logs new expiration time

---

## 🎯 Test Philosophy

### Following Bruno Best Practices

1. **Descriptive Test Names**
   - Clear "Should..." format
   - Explains expected behavior

2. **Comprehensive Assertions**
   - Multiple checks per test
   - Type validation
   - Format validation
   - Value validation

3. **Environment Integration**
   - Automatic variable saving
   - Variable verification
   - Console logging for feedback

4. **Security Focus**
   - No sensitive data exposure
   - Timing attack prevention
   - User enumeration prevention
   - Generic error messages

5. **Documentation**
   - Inline docs for each endpoint
   - Expected responses documented
   - Automatic actions listed
   - Usage notes included

6. **Error Handling**
   - Multiple status codes handled
   - Conditional test execution
   - Helpful error messages

---

## 📊 Test Statistics

### Total Tests by Endpoint

| Endpoint | Test Groups | Individual Assertions | Auto Actions |
|----------|-------------|----------------------|--------------|
| Register | 6 | 20+ | 3 |
| Login | 11 | 35+ | 3 |
| Login Invalid | 8 | 15+ | 0 |
| Test Auth | 4 | 8+ | 0 |
| Unauthorized | 3 | 5+ | 0 |
| Refresh Token | 9+ | 25+ | 2-3 |

**Total:** 41+ test groups, 108+ individual assertions

---

## 🔒 Security Validations

All authentication tests include:

- ✅ **No Password Exposure**: Passwords never in responses
- ✅ **No User Enumeration**: Generic error messages
- ✅ **Timing Attack Prevention**: Consistent response times
- ✅ **Token Format Validation**: JWT structure verification
- ✅ **Secure Token Storage**: Environment variables only
- ✅ **No Credential Leaks**: Database/Redis credentials filtered
- ✅ **Token Rotation Support**: Refresh token rotation detection

---

## 🚀 Usage

### Running Tests

```bash
# Run all auth tests
bruno run --env dev --folder "Auth"

# Run specific test
bruno run --env dev "Auth/Login.bru"

# Run with detailed output
bruno run --env dev --folder "Auth" --output detailed
```

### Test Flow

1. **First Time Setup:**
   ```
   Auth/Register → Creates user + saves tokens
   ```

2. **Subsequent Runs:**
   ```
   Auth/Login → Authenticates + saves tokens
   ```

3. **Token Refresh:**
   ```
   Auth/Refresh Token → Renews access token
   ```

4. **Validation:**
   ```
   Auth/Test Auth → Verifies token works
   Auth/Unauthorized Test → Verifies protection
   ```

---

## 📝 Environment Variables

### Required
- `EMAIL`: User email for authentication
- `PASSWORD`: User password

### Auto-Populated
- `JWT`: Access token (auto-saved)
- `REFRESH_TOKEN`: Refresh token (auto-saved)
- `USER_ID`: User UUID (auto-saved)

### Optional
- `BASE_URL`: API endpoint (default: http://localhost:3000)
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key

---

## 🎓 Best Practices Implemented

1. **Chai Assertions**: Using expect() with descriptive messages
2. **Response Validation**: Status, headers, body structure
3. **Performance Monitoring**: Response time checks
4. **Security Testing**: No sensitive data exposure
5. **Environment Management**: Automatic variable persistence
6. **Error Scenarios**: Invalid credentials, missing tokens
7. **Documentation**: Inline docs for each endpoint
8. **Console Feedback**: Helpful messages during execution
9. **Format Validation**: UUID, JWT, ISO dates
10. **Conditional Testing**: Different paths for different responses

---

## 🔄 Token Lifecycle

```
┌─────────────┐
│   Register  │ → JWT + Refresh Token (saved)
└─────────────┘
       ↓
┌─────────────┐
│    Login    │ → JWT + Refresh Token (saved)
└─────────────┘
       ↓
┌─────────────┐
│  Use Token  │ → Protected API calls
└─────────────┘
       ↓
┌─────────────┐
│   Expired?  │ → Yes → Refresh Token
└─────────────┘           ↓
       ↓              New JWT (saved)
       No                 ↓
       ↓              Continue
┌─────────────┐
│  Continue   │
└─────────────┘
```

---

## 📚 References

- [Bruno Testing Documentation](https://docs.usebruno.com/testing/tests/introduction)
- [Chai Assertion Library](https://www.chaijs.com/api/bdd/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
