const https = require('https');
const http = require('http');

const CRON_SECRET = process.env.CRON_SECRET || 'your-cron-secret-key-here';
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

async function testCronEndpoint(endpoint) {
  const url = `${BASE_URL}/api/cron/${endpoint}`;
  const isHttps = url.startsWith('https');
  const client = isHttps ? https : http;
  
  const options = {
    method: endpoint === 'health' ? 'GET' : 'POST',
    headers: {
      'Authorization': `Bearer ${CRON_SECRET}`,
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = client.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: response
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function main() {
  console.log('Testing cron endpoints...\n');

  try {
    console.log('1. Testing health endpoint...');
    const healthResult = await testCronEndpoint('health');
    console.log(`Status: ${healthResult.status}`);
    console.log('Response:', JSON.stringify(healthResult.data, null, 2));
    console.log();

    console.log('2. Testing streak-update endpoint...');
    const updateResult = await testCronEndpoint('streak-update');
    console.log(`Status: ${updateResult.status}`);
    console.log('Response:', JSON.stringify(updateResult.data, null, 2));
    console.log();

  } catch (error) {
    console.error('Error testing cron endpoints:', error.message);
  }
}

if (require.main === module) {
  main();
}