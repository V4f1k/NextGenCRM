# Lead Generation Setup Guide

This guide will help you configure the Lead Generation system in NextGenCRM with the required API keys.

## Overview

The Lead Generation system replaces the N8N workflow with integrated Python services that provide:

- **Google Maps Business Discovery**: Find businesses by keyword and location
- **Website Scraping**: Extract contact information and business details
- **Czech Business Registry (ARES)**: Official business data enrichment
- **AI Quality Analysis**: OpenAI-powered prospect scoring and validation
- **Deduplication**: Advanced duplicate detection with fuzzy matching

## Required API Keys

### 1. Google Maps API Key

**Purpose**: Search for businesses, geocoding, and place details.

**Setup Instructions**:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Places API** (for business search)
   - **Geocoding API** (for address validation)
   - **Maps JavaScript API** (for map display)
4. Create credentials:
   - Go to "Credentials" → "Create Credentials" → "API Key"
   - Copy the generated API key
   - (Optional) Restrict the key to specific APIs and IP addresses

**Cost**: Google Maps APIs have free tier limits, then pay-per-use pricing.
- Places API: 1,000 requests/month free, then $17/$1,000 requests
- Geocoding API: $5/$1,000 requests

### 2. OpenAI API Key

**Purpose**: AI-powered prospect quality analysis, contact extraction, and data validation.

**Setup Instructions**:

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to "API Keys" section
4. Click "Create new secret key"
5. Copy the generated key (starts with `sk-`)

**Cost**: OpenAI uses token-based pricing:
- GPT-4o-mini: $0.15/$1M input tokens, $0.60/$1M output tokens
- Estimated cost: ~$0.01-0.05 per prospect analyzed

## Configuration

### Environment Variables

Add the API keys to your environment configuration:

**For Docker/Production** (`.env` file):
```bash
# Lead Generation Services API Keys
GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
```

**For Local Development** (`backend/.env` file):
```bash
# Lead Generation Services API Keys
GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
```

### Restart Services

After adding the API keys, restart the application:

```bash
# If using Docker
docker-compose restart backend

# If running locally
python manage.py runserver
```

## Verification

### Check API Key Configuration

1. **Backend Logs**: Look for warnings about missing API keys
   ```bash
   docker-compose logs backend | grep -i "api key"
   ```

2. **Django Admin**: API keys are logged at startup with warnings if missing

3. **Test Endpoints**: Use the Django REST API browser to test individual services

### Test Individual Services

You can test each service individually using the API endpoints:

**Google Maps Search**:
```bash
curl -X POST http://localhost:8000/api/v1/crm/lead-generation/search-businesses/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"keyword": "restaurace", "location": "Praha", "max_results": 5}'
```

**OpenAI Analysis**:
```bash
curl -X POST http://localhost:8000/api/v1/crm/lead-generation/analyze-quality/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"company_name": "Test Restaurant", "industry": "restaurant", "location": "Praha"}'
```

**Full Campaign**:
```bash
curl -X POST http://localhost:8000/api/v1/crm/lead-generation/campaign/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "keyword": "restaurace",
    "location": "Praha",
    "max_results": 10,
    "enable_ai_analysis": true,
    "enable_website_scraping": true,
    "enable_deduplication": true
  }'
```

## Usage

### Web Interface

1. Navigate to **Lead Generation** in the sidebar
2. Configure your campaign:
   - **Keyword**: Business type (e.g., "restaurace", "autoservis")
   - **Location**: City or region (e.g., "Praha", "Brno")
   - **Max Results**: Number of prospects to generate (1-100)
   - **Services**: Enable/disable specific features

3. Click **Generate Campaign**
4. Review results and **Save to Prospects**

### Campaign Workflow

1. **Google Maps Search**: Finds businesses matching your criteria
2. **Website Scraping**: Extracts contact info from business websites
3. **ARES Integration**: Enriches Czech businesses with official data
4. **AI Analysis**: Scores prospect quality (0-100%)
5. **Deduplication**: Removes duplicates against existing prospects
6. **Results**: Displays qualified prospects with quality scores

## Troubleshooting

### Common Issues

**"Google Maps API key not configured"**
- Verify API key is set in environment variables
- Check that Places API is enabled in Google Cloud Console
- Restart the backend service

**"OpenAI API key not configured"**
- Verify API key starts with `sk-`
- Check your OpenAI account has sufficient credits
- Restart the backend service

**"Failed to fetch" errors**
- Check backend logs for detailed error messages
- Verify API keys have proper permissions
- Check internet connectivity for API calls

**Poor quality results**
- Adjust search radius (try 1000-10000 meters)
- Use more specific keywords
- Enable all services for better data enrichment

### API Limits

**Google Maps**:
- 1,000 free requests/month per API
- Rate limit: ~100 requests/second
- Consider implementing API key rotation for high volume

**OpenAI**:
- Rate limits depend on usage tier
- Monitor usage in OpenAI dashboard
- Consider using GPT-3.5-turbo for cost savings

## Cost Estimation

For a typical campaign generating 50 prospects:

**Google Maps APIs**:
- Places search: ~1-3 requests = $0.02-0.05
- Geocoding: ~1 request = $0.005
- Total: ~$0.03-0.06 per campaign

**OpenAI**:
- Analysis per prospect: ~500-1000 tokens = $0.01-0.03
- Total: ~$0.50-1.50 per campaign

**Monthly cost for 100 campaigns**: ~$50-150

## Security

### API Key Protection

- Never commit API keys to version control
- Use environment variables only
- Restrict API keys by IP address when possible
- Rotate keys periodically
- Monitor usage for unexpected spikes

### Rate Limiting

The system includes built-in rate limiting:
- Google Maps: 1-2 requests per second
- OpenAI: Respects API tier limits
- Automatic retry with exponential backoff

## Support

For issues with the Lead Generation system:

1. Check backend logs: `docker-compose logs backend`
2. Verify API key configuration
3. Test individual service endpoints
4. Check API provider status pages
5. Review usage quotas and billing

The system is designed to gracefully handle API failures and provide detailed error messages for troubleshooting.