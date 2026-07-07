import axios from 'axios';

async function main() {
  const url = 'http://localhost:5000/api/nomba/webhook/payment';

  // Test case 1: Wrapped Nomba payload with Plan ID
  console.log('Sending Test Case 1...');
  try {
    const res1 = await axios.post(url, {
      event_type: 'payment_success',
      data: {
        accountNumber: '2467780660',
        amount: 2500,
        narration: 'ba7a3b06-752e-469d-942a-948cd1bd4755',
      },
    });
    console.log('Response 1:', res1.status, res1.data);
  } catch (e: any) {
    console.error('Error 1:', e.response?.status, e.response?.data || e.message);
  }

  // Test case 2: Flat direct data payload with Plan Name
  console.log('\nSending Test Case 2...');
  try {
    const res2 = await axios.post(url, {
      accountNumber: '2467780660',
      amount: 1500,
      narration: 'Topup for Birthday Gift',
    });
    console.log('Response 2:', res2.status, res2.data);
  } catch (e: any) {
    console.error('Error 2:', e.response?.status, e.response?.data || e.message);
  }
  // Test case 3: Dashless UUID in narration
  console.log('\nSending Test Case 3...');
  try {
    const res3 = await axios.post(url, {
      accountNumber: '2467780660',
      amount: 1000,
      narration: 'ba7a3b06752e469d942a948cd1bd4755',
    });
    console.log('Response 3:', res3.status, res3.data);
  } catch (e: any) {
    console.error('Error 3:', e.response?.status, e.response?.data || e.message);
  }
}

main();
