import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const baseUrl = process.env.NOMBA_BASE_URL || 'https://api.nomba.com';
const clientId = process.env.NOMBA_CLIENT_ID;
const clientSecret = process.env.NOMBA_CLIENT_SECRET;
const accountId = process.env.NOMBA_ACCOUNT_ID;

async function run() {
  if (!clientId || !clientSecret || !accountId) {
    console.error('Missing configuration');
    return;
  }

  try {
    const authResponse = await axios.post(
      `${baseUrl}/v1/auth/token/issue`,
      {
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          accountId: accountId,
        },
      },
    );

    const token = authResponse.data.data.access_token;
    console.log('Token issued successfully!');

    // Test GET mandates
    console.log('\nTesting GET mandates...');
    try {
      const res = await axios.get(`${baseUrl}/v1/direct-debits/mandates`, {
        headers: {
          Authorization: `Bearer ${token}`,
          accountId: accountId,
        },
      });
      console.log(`GET mandates Success! Status: ${res.status}`);
      console.log('Data:', JSON.stringify(res.data, null, 2));
    } catch (e: any) {
      if (e.response) {
        console.log(
          `GET mandates Failed. Status: ${e.response.status}. Data:`,
          JSON.stringify(e.response.data),
        );
      } else {
        console.log(`GET mandates Failed. Error: ${e.message}`);
      }
    }

    // Test GET virtual accounts to verify credentials can make requests
    console.log('\nTesting GET virtual accounts...');
    try {
      const res = await axios.get(`${baseUrl}/v1/accounts/virtual`, {
        headers: {
          Authorization: `Bearer ${token}`,
          accountId: accountId,
        },
      });
      console.log(`GET virtual accounts Success! Status: ${res.status}`);
      console.log('Data:', JSON.stringify(res.data, null, 2));
    } catch (e: any) {
      if (e.response) {
        console.log(
          `GET virtual accounts Failed. Status: ${e.response.status}. Data:`,
          JSON.stringify(e.response.data),
        );
      } else {
        console.log(`GET virtual accounts Failed. Error: ${e.message}`);
      }
    }
  } catch (error: any) {
    console.error('Auth/General Error:', error.message);
  }
}

run();
