import { footballAPI } from '../config/football.js';

export async function getNextFixture(teamId: number) {
  const season = new Date().getFullYear();

  const { data } = await footballAPI.get('/fixtures', {
    params: {
      team: teamId,
      next: 1,
      season,
    },
  });

  if (!data.response.length) return null;

  const fixture = data.response[0];

  return {
    fixtureId: fixture.fixture.id,
    date: fixture.fixture.date,
    league: fixture.league.name,
    home: fixture.teams.home.name,
    away: fixture.teams.away.name,
    status: fixture.fixture.status.short,
  };
}

export async function getFixtureResult(fixtureId: number) {
  const { data } = await footballAPI.get('/fixtures', {
    params: {
      id: fixtureId,
    },
  });

  return data.response[0];
}

export async function hasFixtureFinished(fixtureId: number) {
  const fixture = await getFixtureResult(fixtureId);

  const status = fixture.fixture.status.short;

  return ['FT', 'AET', 'PEN'].includes(status);
}

export async function didTeamWin(fixtureId: number, teamId: number) {
  const fixture = await getFixtureResult(fixtureId);

  const home = fixture.teams.home;
  const away = fixture.teams.away;

  const homeGoals = fixture.goals.home;
  const awayGoals = fixture.goals.away;

  if (home.id === teamId) {
    if (homeGoals > awayGoals) return 'WIN';
    if (homeGoals < awayGoals) return 'LOSS';
    return 'DRAW';
  }

  if (away.id === teamId) {
    if (awayGoals > homeGoals) return 'WIN';
    if (awayGoals < homeGoals) return 'LOSS';
    return 'DRAW';
  }

  return null;
}
