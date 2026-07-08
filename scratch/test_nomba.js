import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('apps/api/.env') });
dotenv.config({ path: path.resolve('.env') });
dotenv.config({ path: path.resolve(__dirname, '../apps/api/.env') });

const clientId = process.env.NOMBA_CLIENT_ID;
const clientSecret = process.env.NOMBA_CLIENT_SECRET;
const accountId = process.env.NOMBA_ACCOUNT_ID;
const baseUrl = process.env.NOMBA_BASE_URL || 'https://sandbox.nomba.com';

async function testNomba() {
  console.log('Using config:', { clientId, baseUrl, accountId });
  try {
    // 1. Authenticate
    const tokenRes = await axios.post(`${baseUrl}/v1/auth/token/issue`, {
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }, {
      headers: {
        'Content-Type': 'application/json',
        accountId: accountId,
      }
    });

    const token = tokenRes.data.data.access_token;
    console.log('Auth successful. Token length:', token.length);

    const headers = {
      Authorization: `Bearer ${token}`,
      accountId: accountId,
    };

    // Try Endpoint 1: /v1/accounts/${accountId}/transactions
    try {
      console.log('Testing Endpoint 1: /v1/accounts/${accountId}/transactions');
      const res1 = await axios.get(`${baseUrl}/v1/accounts/${accountId}/transactions`, { headers });
      console.log('Endpoint 1 Success! Keys in data:', Object.keys(res1.data));
    } catch (e) {
      console.log('Endpoint 1 Failed:', e.response?.data || e.message);
    }

    // Try Endpoint 2: /v1/transactions/accounts
    try {
      console.log('Testing Endpoint 2: /v1/transactions/accounts');
      const res2 = await axios.get(`${baseUrl}/v1/transactions/accounts`, { headers });
      console.log('Endpoint 2 Success! Keys in data:', Object.keys(res2.data));
    } catch (e) {
      console.log('Endpoint 2 Failed:', e.response?.data || e.message);
    }

    // Try Endpoint 3: /v1/transactions/virtual
    try {
      console.log('Testing Endpoint 3: /v1/transactions/virtual (without params)');
      const res3 = await axios.get(`${baseUrl}/v1/transactions/virtual`, { headers });
      console.log('Endpoint 3 Success! Keys in data:', Object.keys(res3.data));
    } catch (e) {
      console.log('Endpoint 3 Failed:', e.response?.data || e.message);
    }

  } catch (err) {
    console.error('Auth failed:', err.response?.data || err.message);
  }
}

testNomba();
