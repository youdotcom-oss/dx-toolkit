# Azure Deployment Guide

This guide covers deploying a Microsoft Teams bot with You.com MCP integration to Azure.

## Prerequisites

- Azure account with active subscription
- Azure CLI installed (`az --version`)
- Node.js >= 18 or Bun >= 1.2.21
- You.com API key from [you.com/platform/api-keys](https://you.com/platform/api-keys)
- Teams bot already registered in Azure Bot Service

## Deployment Options

### Option 1: Azure App Service (Recommended)
- Managed hosting with auto-scaling
- Built-in monitoring and logging
- Easy configuration management
- Best for production workloads

### Option 2: Azure Container Instances
- Docker-based deployment
- Pay-per-second billing
- Good for moderate traffic

### Option 3: Azure Functions
- Serverless deployment
- Auto-scaling
- Cost-effective for low/variable traffic

## Option 1: Deploy to Azure App Service

### Step 1: Create Azure Resources

```bash
# Login to Azure
az login

# Set your subscription
az account set --subscription "Your-Subscription-Name"

# Create resource group
az group create \
  --name teams-bot-rg \
  --location eastus

# Create App Service plan
az appservice plan create \
  --name teams-bot-plan \
  --resource-group teams-bot-rg \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --name your-teams-bot \
  --resource-group teams-bot-rg \
  --plan teams-bot-plan \
  --runtime "NODE|18-lts"
```

### Step 2: Configure Environment Variables

```bash
# Set environment variables
az webapp config appsettings set \
  --name your-teams-bot \
  --resource-group teams-bot-rg \
  --settings \
    YDC_API_KEY="your-you-com-api-key" \
    MICROSOFT_APP_ID="your-bot-app-id" \
    MICROSOFT_APP_PASSWORD="your-bot-app-password" \
    NODE_ENV="production"
```

### Step 3: Prepare Application for Deployment

**Update `package.json`**:

```json
{
  "name": "teams-mcp-bot",
  "version": "1.0.0",
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc",
    "postinstall": "npm run build"
  },
  "dependencies": {
    "@youdotcom-oss/teams-mcp-client": "^0.1.0",
    "@microsoft/teams.ai": "^1.5.0",
    "botbuilder": "^4.20.0",
    "restify": "^11.0.0"
  }
}
```

**Create `web.config` (for Windows App Service)**:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="dist/index.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="DynamicContent">
          <match url="/*" />
          <action type="Rewrite" url="dist/index.js"/>
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <hiddenSegments>
          <remove segment="bin"/>
        </hiddenSegments>
      </requestFiltering>
    </security>
  </system.webServer>
</configuration>
```

**Create `.deployment`** (for Linux App Service):

```
[config]
SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

### Step 4: Deploy Application

**Option A: Deploy from Local**:

```bash
# Build application
npm run build

# Create deployment package
zip -r deploy.zip . -x "*.git*" -x "node_modules/*"

# Deploy to Azure
az webapp deployment source config-zip \
  --name your-teams-bot \
  --resource-group teams-bot-rg \
  --src deploy.zip
```

**Option B: Deploy from GitHub** (Recommended):

```bash
# Configure GitHub Actions deployment
az webapp deployment github-actions add \
  --name your-teams-bot \
  --resource-group teams-bot-rg \
  --repo "your-org/your-repo" \
  --branch main \
  --runtime nodejs \
  --runtime-version 18
```

This creates a GitHub Actions workflow file: `.github/workflows/azure-webapps-node.yml`

**Update the workflow to include MCP configuration**:

```yaml
name: Deploy to Azure App Service

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  AZURE_WEBAPP_NAME: your-teams-bot
  NODE_VERSION: '18.x'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: node-app
          path: |
            .
            !node_modules

  deploy:
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: 'Production'
      url: ${{ steps.deploy.outputs.webapp-url }}

    steps:
      - name: Download artifact
        uses: actions/download-artifact@v3
        with:
          name: node-app

      - name: 'Deploy to Azure Web App'
        id: deploy
        uses: azure/webapps-deploy@v2
        with:
          app-name: ${{ env.AZURE_WEBAPP_NAME }}
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: .
```

### Step 5: Configure Bot Endpoint

```bash
# Get the Web App URL
az webapp show \
  --name your-teams-bot \
  --resource-group teams-bot-rg \
  --query defaultHostName \
  --output tsv
```

Update your bot registration:
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Bot Service
3. Under "Configuration", set Messaging endpoint to: `https://your-teams-bot.azurewebsites.net/api/messages`

### Step 6: Verify Deployment

```bash
# Check application logs
az webapp log tail \
  --name your-teams-bot \
  --resource-group teams-bot-rg

# Test the health endpoint
curl https://your-teams-bot.azurewebsites.net/api/health
```

## Option 2: Deploy to Azure Container Instances

### Step 1: Create Dockerfile

```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3978

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3978/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["npm", "start"]
```

### Step 2: Build and Push Container

```bash
# Create Azure Container Registry
az acr create \
  --name yourteamsbot \
  --resource-group teams-bot-rg \
  --sku Basic \
  --admin-enabled true

# Login to ACR
az acr login --name yourteamsbot

# Build and push image
docker build -t yourteamsbot.azurecr.io/teams-bot:latest .
docker push yourteamsbot.azurecr.io/teams-bot:latest
```

### Step 3: Deploy Container

```bash
# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name yourteamsbot --query username --output tsv)
ACR_PASSWORD=$(az acr credential show --name yourteamsbot --query passwords[0].value --output tsv)

# Create container instance
az container create \
  --name teams-bot-container \
  --resource-group teams-bot-rg \
  --image yourteamsbot.azurecr.io/teams-bot:latest \
  --cpu 1 \
  --memory 1 \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --dns-name-label your-teams-bot \
  --ports 3978 \
  --environment-variables \
    YDC_API_KEY="your-api-key" \
    MICROSOFT_APP_ID="your-app-id" \
    MICROSOFT_APP_PASSWORD="your-app-password" \
    NODE_ENV="production"
```

## Monitoring and Diagnostics

### Enable Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --app teams-bot-insights \
  --location eastus \
  --resource-group teams-bot-rg \
  --application-type web

# Get instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app teams-bot-insights \
  --resource-group teams-bot-rg \
  --query instrumentationKey \
  --output tsv)

# Add to Web App settings
az webapp config appsettings set \
  --name your-teams-bot \
  --resource-group teams-bot-rg \
  --settings \
    APPINSIGHTS_INSTRUMENTATIONKEY=$INSTRUMENTATION_KEY
```

### Add Monitoring Code

```typescript
import { createMcpPlugin } from '@youdotcom-oss/teams-mcp-client';
import { TelemetryClient } from 'applicationinsights';

// Initialize Application Insights
const appInsights = require('applicationinsights');
appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY)
  .setAutoDependencyCorrelation(true)
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true)
  .setAutoCollectExceptions(true)
  .setAutoCollectDependencies(true)
  .start();

const telemetryClient = appInsights.defaultClient;

// Track MCP plugin initialization
try {
  const startTime = Date.now();
  const { plugin, config } = createMcpPlugin({
    apiKey: process.env.YDC_API_KEY,
  });
  const duration = Date.now() - startTime;

  telemetryClient.trackMetric({
    name: 'MCP Plugin Initialization',
    value: duration,
  });

  telemetryClient.trackEvent({
    name: 'MCP Plugin Created',
    properties: {
      mcpUrl: config.mcpUrl,
      timeout: config.timeout,
    },
  });
} catch (err) {
  telemetryClient.trackException({
    exception: err,
    properties: {
      component: 'MCP Plugin',
      operation: 'initialization',
    },
  });
}
```

### Configure Alerts

```bash
# Create alert for high error rate
az monitor metrics alert create \
  --name high-error-rate \
  --resource-group teams-bot-rg \
  --scopes /subscriptions/{subscription-id}/resourceGroups/teams-bot-rg/providers/Microsoft.Web/sites/your-teams-bot \
  --condition "count requests/failed > 10" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action email your-email@example.com
```

## Performance Optimization

### Enable Caching

```typescript
import { createMcpPlugin } from '@youdotcom-oss/teams-mcp-client';

// Use Azure Redis Cache for response caching
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.AZURE_REDIS_URL,
  password: process.env.AZURE_REDIS_KEY,
});

await redisClient.connect();

async function getCachedResponse(query: string) {
  const cacheKey = `mcp:${query}`;
  const cached = await redisClient.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  // Process with MCP
  const response = await processWithMcp(query);

  // Cache for 5 minutes
  await redisClient.setEx(cacheKey, 300, JSON.stringify(response));

  return response;
}
```

### Configure Auto-Scaling

```bash
# Enable auto-scale based on CPU
az monitor autoscale create \
  --name teams-bot-autoscale \
  --resource-group teams-bot-rg \
  --resource /subscriptions/{subscription-id}/resourceGroups/teams-bot-rg/providers/Microsoft.Web/serverFarms/teams-bot-plan \
  --min-count 1 \
  --max-count 5 \
  --count 1

# Add scale-out rule (CPU > 70%)
az monitor autoscale rule create \
  --autoscale-name teams-bot-autoscale \
  --resource-group teams-bot-rg \
  --condition "Percentage CPU > 70 avg 5m" \
  --scale out 1

# Add scale-in rule (CPU < 30%)
az monitor autoscale rule create \
  --autoscale-name teams-bot-autoscale \
  --resource-group teams-bot-rg \
  --condition "Percentage CPU < 30 avg 5m" \
  --scale in 1
```

## Security Best Practices

### Use Azure Key Vault

```bash
# Create Key Vault
az keyvault create \
  --name teams-bot-vault \
  --resource-group teams-bot-rg \
  --location eastus

# Add secrets
az keyvault secret set \
  --vault-name teams-bot-vault \
  --name YDC-API-KEY \
  --value "your-api-key"

az keyvault secret set \
  --vault-name teams-bot-vault \
  --name MICROSOFT-APP-PASSWORD \
  --value "your-app-password"

# Grant Web App access to Key Vault
az webapp identity assign \
  --name your-teams-bot \
  --resource-group teams-bot-rg

# Get the principal ID
PRINCIPAL_ID=$(az webapp identity show \
  --name your-teams-bot \
  --resource-group teams-bot-rg \
  --query principalId \
  --output tsv)

# Set Key Vault access policy
az keyvault set-policy \
  --name teams-bot-vault \
  --object-id $PRINCIPAL_ID \
  --secret-permissions get list
```

**Update application to use Key Vault**:

```typescript
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

const credential = new DefaultAzureCredential();
const vaultUrl = `https://teams-bot-vault.vault.azure.net`;
const client = new SecretClient(vaultUrl, credential);

// Get API key from Key Vault
const ydcApiKeySecret = await client.getSecret('YDC-API-KEY');
const ydcApiKey = ydcApiKeySecret.value;

const { plugin, config } = createMcpPlugin({
  apiKey: ydcApiKey,
});
```

### Enable HTTPS Only

```bash
az webapp update \
  --name your-teams-bot \
  --resource-group teams-bot-rg \
  --https-only true
```

## Troubleshooting

### View Logs

```bash
# Stream application logs
az webapp log tail \
  --name your-teams-bot \
  --resource-group teams-bot-rg

# Download logs
az webapp log download \
  --name your-teams-bot \
  --resource-group teams-bot-rg \
  --log-file logs.zip
```

### Common Issues

**Issue: Bot not responding**

Check:
1. Web App is running: `az webapp show --name your-teams-bot --resource-group teams-bot-rg`
2. Environment variables are set correctly
3. Bot messaging endpoint is configured correctly
4. Review application logs

**Issue: MCP connection failing**

Check:
1. `YDC_API_KEY` is set and valid
2. Outbound network connections are allowed
3. Timeout settings are appropriate
4. Review Application Insights for errors

**Issue: High latency**

Solutions:
1. Enable response caching (Redis)
2. Increase timeout values
3. Scale up App Service plan
4. Enable auto-scaling

## Cost Optimization

### Recommended Service Tiers

**Development/Testing**:
- App Service: B1 (Basic)
- Estimated cost: ~$13/month

**Production (Low Traffic)**:
- App Service: S1 (Standard)
- Redis Cache: C0 (Basic)
- Estimated cost: ~$75/month

**Production (High Traffic)**:
- App Service: P1v2 (Premium) with auto-scale
- Redis Cache: C1 (Standard)
- Estimated cost: ~$200-500/month

## Additional Resources

- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Azure Bot Service Documentation](https://docs.microsoft.com/en-us/azure/bot-service/)
- [Application Insights](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)
- [Basic Bot Example](./basic-bot.md)
- [Advanced Patterns](./advanced-patterns.md)
- [API Documentation](../API.md)
