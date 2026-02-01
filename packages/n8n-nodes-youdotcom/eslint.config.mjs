import n8nConfig from '@n8n/node-cli/eslint'

// The n8n config exports { config, configWithoutCloudSupport, default: config }
// We need to export the actual config array, not the module
export default n8nConfig.config
