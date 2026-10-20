---
name: ai-provider-eval
description: Test, benchmark, and maintain multi-provider LLM integrations (Google Gemini, Anthropic Claude, OpenAI GPT, Ollama) and BYOK encrypted key storage in CodeMind.
---

# AI Provider Evaluation & Maintenance Skill

This skill guides agents in testing, debugging, and extending AI providers within `backend/src/ai/ai.service.ts`.

## Architecture Principles
1. **Fallback Priority Chain**:
   `Gemini` (Default/Native) &rarr; `Claude` &rarr; `OpenAI` &rarr; `Ollama` (Local).
2. **BYOK Routing vs. Server Fallback**:
   - If user has a valid key in their `Preference` record: decrypt with AES-256-GCM and bypass server quotas.
   - If user relies on server key: check that daily usage is under `AI_DAILY_FREE_LIMIT` (default 50 requests/day).
3. **Key Security**:
   - Always encrypt keys via `encrypt()` from `backend/src/common/crypto.util.ts`.
   - Never return plaintext keys in API responses; always mask (e.g. `sk-•••••••`).

## Verification Procedures

### 1. Test Connection Endpoint
Test an individual provider via `POST /ai/test-connection`:
```bash
curl -X POST "https://code-mind-k63e.onrender.com/ai/test-connection" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gemini"
  }'
```
Expected response:
```json
{
  "success": true,
  "provider": "gemini",
  "latencyMs": 420,
  "message": "Successfully connected to Google Gemini"
}
```

### 2. Run Automated AI Unit Tests
```bash
npm run test:backend -- -t "AIService"
```

### 3. Adding a New AI Provider
When adding a new provider (e.g. DeepSeek or Mistral):
1. Add provider identifier to `AIProvider` type in `shared/src/types.ts` and `desktop/react/src/types/index.ts`.
2. Add optional encrypted key column to `Preference` model in `backend/prisma/schema.prisma`.
3. Implement `chat()` and `stream()` methods inside `backend/src/ai/ai.service.ts`.
4. Add provider connection test in `testConnection()` method.
5. Update `SettingsModal.tsx` in React with input fields and test button.
