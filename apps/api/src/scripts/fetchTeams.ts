// import fs from 'fs';
// import path from 'path';

// import axios from 'axios';
// import dotenv from 'dotenv';
// // Load env from apps/api
// dotenv.config({ path: path.join(__dirname, '../../.env') });

// const apiKey = process.env.FOOTBALL_API_KEY;

// if (!apiKey) {
//   console.error('Error: FOOTBALL_API_KEY is not defined in env.');
//   process.exit(1);
// }

// async function run() {
//   try {
//     console.log('Fetching teams for Premier League (league 39, season 2024)...');
//     const response = await axios.get('https://v3.football.api-sports.io/teams', {
//       params: {
//         league: 39,
//         season: 2024,
//       },
//       headers: {
//         'x-apisports-key': apiKey,
//       },
//     });

//     if (!response.data || !response.data.response) {
//       console.error('Unexpected response format:', response.data);
//       process.exit(1);
//     }

//     console.log('Raw response data:', response.data);
//     const teams = response.data.response.map((item: any) => ({
//       id: item.team.id,
//       name: item.team.name,
//       logo: item.team.logo,
//       country: item.team.country,
//     }));

//     console.log(`Found ${teams.length} teams.`);

//     const outputDir = path.join(__dirname, '../../../../data');
//     if (!fs.existsSync(outputDir)) {
//       fs.mkdirSync(outputDir, { recursive: true });
//     }

//     const content = `export interface Team {
//   id: number;
//   name: string;
//   logo: string;
//   country: string;
// }

// export const teams: Team[] = ${JSON.stringify(teams, null, 2)};
// `;

//     const outputPath = path.join(outputDir, 'team.data.ts');
//     fs.writeFileSync(outputPath, content, 'utf8');
//     console.log(`Successfully saved teams data to ${outputPath}`);
//   } catch (error: any) {
//     console.error('Error fetching teams:', error.message);
//     if (error.response) {
//       console.error('Response data:', error.response.data);
//     }
//   }
// }

// run();
