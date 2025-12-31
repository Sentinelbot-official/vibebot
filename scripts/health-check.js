/**
 * Health Check Script
 * Can be used by Docker, Kubernetes, or monitoring systems
 * Exit code 0 = healthy, Exit code 1 = unhealthy
 */

const http = require('http');
const https = require('https');

const HEALTH_CHECK_URL = process.env.HEALTH_CHECK_URL || 'http://localhost:3000/health';
const TIMEOUT = parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000');

/**
 * Perform health check
 */
async function checkHealth() {
  return new Promise((resolve, reject) => {
    const url = new URL(HEALTH_CHECK_URL);
    const client = url.protocol === 'https:' ? https : http;

    const req = client.get(url, { timeout: TIMEOUT }, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const health = JSON.parse(data);
            resolve(health);
          } catch (error) {
            reject(new Error('Invalid health check response'));
          }
        } else {
          reject(new Error(`Health check failed with status ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Health check timeout'));
    });
  });
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Performing health check...');
    const health = await checkHealth();

    console.log('Health check result:');
    console.log(JSON.stringify(health, null, 2));

    if (health.status === 'healthy') {
      console.log('✅ Service is healthy');
      process.exit(0);
    } else {
      console.error('❌ Service is unhealthy');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    process.exit(1);
  }
}

// Run health check
main();
