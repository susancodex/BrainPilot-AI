# AI Provider System - Configuration Guide

## Overview

BrainPilot AI uses a robust multi-provider AI system with automatic failover. The system routes requests through providers in priority order:

1. **Primary:** Google Gemini (free tier)
2. **Fallback 1:** Groq (very fast, free tier)
3. **Fallback 2:** OpenRouter (free models)

## Architecture

### Components

- **AIGateway** (`ai/gateway.py`) - Intelligent router with health monitoring and automatic failover
- **AI Factory** (`ai/factory.py`) - Singleton factory that returns the shared gateway instance
- **Providers** (`ai/providers/`) - Individual provider implementations
- **Circuit Breaker** (`ai/types.py`) - Health tracking with automatic cooldown

### Features

- ✅ Automatic failover between providers
- ✅ Circuit breaker pattern for unhealthy providers
- ✅ Health monitoring with success rate tracking
- ✅ Rate limit detection and handling
- ✅ Timeout protection (30-45 seconds)
- ✅ Prompt injection prevention
- ✅ Structured JSON output support
- ✅ Streaming chat support
- ✅ Thread-safe implementation

## Configuration

### Environment Variables

Set these in your `.env` file or deployment environment:

```bash
# Primary Provider (Required for best performance)
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.5-flash  # Default: gemini-2.5-flash

# Fallback Provider 1 (Optional but recommended)
GROQ_API_KEY=your-groq-api-key-here
GROQ_MODEL=llama-3.3-70b-versatile  # Default: llama-3.3-70b-versatile

# Fallback Provider 2 (Optional)
OPENROUTER_API_KEY=your-openrouter-api-key-here
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free  # Optional
```

### Getting API Keys

#### Google Gemini (Primary)
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and set `GEMINI_API_KEY`
5. Free tier: 15 requests per minute, 1,500 requests per day

#### Groq (Fallback 1)
1. Go to https://console.groq.com/keys
2. Sign up for a free account
3. Create a new API key
4. Copy the key and set `GROQ_API_KEY`
5. Free tier: Very fast inference, generous limits

#### OpenRouter (Fallback 2)
1. Go to https://openrouter.ai/keys
2. Sign up for a free account
3. Create a new API key
4. Copy the key and set `OPENROUTER_API_KEY`
5. Free tier: Access to multiple free models

## Usage

### Basic Usage

```python
from ai.factory import get_gateway

# Get the shared gateway instance
gateway = get_gateway()

# Generate text
response = gateway.generate_text("Explain quantum computing")

# Generate JSON
data = gateway.generate_json("Return a JSON object with name and age")

# Chat with system prompt
messages = [
    {"role": "user", "content": "What is the capital of France?"}
]
response = gateway.chat("You are a helpful assistant", messages)

# Streaming chat
for chunk in gateway.stream_chat("You are a helpful assistant", messages):
    print(chunk, end="")
```

### Health Monitoring

```python
from ai.factory import get_gateway

gateway = get_gateway()

# Get health report for all providers
health_report = gateway.health_report()
for provider in health_report:
    print(f"{provider['provider']}:")
    print(f"  Healthy: {provider['healthy']}")
    print(f"  Success Rate: {provider['success_rate']}")
    print(f"  Avg Latency: {provider['avg_latency_ms']}ms")
    print(f"  Circuit State: {provider['circuit_state']}")
```

## Provider Details

### Google Gemini (Primary)

**Model:** `gemini-2.5-flash` (default)

**Advantages:**
- Free tier available
- Fast inference
- Good for general tasks
- JSON mode support

**Timeout:** Built-in to client library

**Rate Limits:** 15 requests/minute, 1,500 requests/day (free tier)

### Groq (Fallback 1)

**Model:** `llama-3.3-70b-versatile` (default)

**Advantages:**
- Extremely fast inference
- OpenAI-compatible API
- Good for real-time applications
- Free tier available

**Timeout:** 30 seconds

**Rate Limits:** Generous free tier

### OpenRouter (Fallback 2)

**Models (tried in order):**
1. `meta-llama/llama-3.3-70b-instruct:free`
2. `meta-llama/llama-3.2-3b-instruct:free`
3. `google/gemma-4-31b-it:free`
4. `moonshotai/kimi-k2.6:free`
5. `nousresearch/hermes-3-llama-3.1-405b:free`

**Advantages:**
- Multiple free models
- Automatic model fallback
- OpenAI-compatible API
- Good for cost-sensitive applications

**Timeout:** 45 seconds

**Rate Limits:** Varies by model

## Circuit Breaker

The system uses a circuit breaker pattern to prevent cascading failures:

**Configuration:**
- Failure threshold: 3 consecutive failures
- Cooldown period: 300 seconds (5 minutes)
- Half-open max calls: 2

**States:**
- **Closed:** Normal operation, all requests go through
- **Open:** Provider is unhealthy, requests are skipped
- **Half-open:** Testing if provider has recovered

## Error Handling

The system automatically handles:

- **Rate Limit Errors (429):** Logs with alert metadata, tries next provider
- **Authentication Errors (401/403):** Fatal error, does not retry
- **Timeout Errors:** Logs warning, tries next provider
- **Server Errors (502/504):** Logs warning, tries next provider
- **Invalid Responses:** Logs error, tries next provider

## Security

### Prompt Validation

The gateway validates prompts before sending to providers:

- Maximum length: 50,000 characters
- Minimum length: 1 character
- Injection pattern detection (ignores instructions, role changes, etc.)

### API Key Security

- API keys are read from environment variables only
- Never hardcoded in source code
- Logged as configured/unconfigured only (never the actual key)

## Monitoring

### Logging

The system logs at different levels:

- **INFO:** Successful requests, provider selection
- **WARNING:** Provider failures, rate limits, circuit breaker state changes
- **ERROR:** Authentication errors, all providers exhausted

### Health Endpoint

The system provides a health report via `gateway.health_report()` which includes:

- Provider availability
- Circuit breaker state
- Success rate
- Average latency
- Total requests

## Best Practices

1. **Always use the factory:** Import `get_gateway()` from `ai.factory`
2. **Configure at least one provider:** Gemini is recommended as primary
3. **Monitor health reports:** Check `gateway.health_report()` periodically
4. **Handle exceptions:** Catch `AllProvidersUnavailableError` for user feedback
5. **Use streaming for long responses:** `stream_chat()` for better UX

## Troubleshooting

### No Providers Configured

**Error:** "AI Gateway: NO providers are configured"

**Solution:** Set at least one of `GEMINI_API_KEY`, `GROQ_API_KEY`, or `OPENROUTER_API_KEY`

### All Providers Unavailable

**Error:** "All AI providers are currently unavailable"

**Solution:** 
1. Check API keys are valid
2. Check rate limits haven't been exceeded
3. Check network connectivity
4. Review health report for specific provider issues

### Rate Limit Errors

**Error:** "RATE_LIMIT_ALERT: Provider hit rate limit"

**Solution:**
1. Wait for rate limit to reset
2. Configure additional fallback providers
3. Consider upgrading to paid tier

### Circuit Breaker Open

**Error:** Provider skipped due to circuit breaker

**Solution:**
1. Wait for cooldown period (5 minutes)
2. Check provider health
3. Circuit will automatically recover after cooldown

## Testing

### Test Script

```python
from ai.factory import get_gateway, reset_gateway

# Reset gateway to pick up new environment variables
reset_gateway()

# Get gateway
gateway = get_gateway()

# Test health
print("Health Report:")
for provider in gateway.health_report():
    print(f"  {provider['provider']}: {provider['healthy']}")

# Test generation
try:
    response = gateway.generate_text("Hello, world!")
    print(f"Response: {response}")
except Exception as e:
    print(f"Error: {e}")
```

## Production Considerations

1. **Monitoring:** Set up alerts for rate limit errors
2. **Scaling:** Configure multiple providers for high availability
3. **Cost:** Monitor API usage across all providers
4. **Performance:** Track latency and success rates
5. **Failover:** Test failover scenarios regularly

## Support

For issues or questions:
- Check the health report for provider-specific issues
- Review logs for detailed error information
- Verify API keys are valid and have sufficient quota
- Check network connectivity to provider endpoints
