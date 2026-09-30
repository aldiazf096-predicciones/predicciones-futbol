const BASE = "https://v3.football.api-sports.io";

const LEAGUES = [
  { id: 39, name: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { id: 140, name: "La Liga", flag: "🇪🇸" },
  { id: 61, name: "Ligue 1", flag: "🇫🇷" },
  { id: 78, name: "Bundesliga", flag: "🇩🇪" },
  { id: 135, name: "Serie A", flag: "🇮🇹" },
  { id: 262, name: "Liga MX", flag: "🇲🇽" },
];

async function api(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY },
    next: { revalidate: 21600 },
  });
  const data = await res.json();
  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(JSON.stringify(data.errors));
  }
  return data;
}

function parsePercent(v) {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? 0 : n;
}

function parseGoals(v) {
  if (!v) return null;
  const s = String(v);
  const n = s.replace(/[+-]/, "");
  return s.startsWith("-") ? `Menos de ${n} goles` : `Más de ${n} goles`;
}

export async function GET() {
  try {
    const lists = await Promise.all(
      LEAGUES.map((l) => api(`/fixtures?league=${l.id}&next=5`))
    );

    const fixtures = lists.flatMap((data, i) =>
      (data.response || []).map((f) => ({ f, league: LEAGUES[i] }))
    );

    const matches = await Promise.all(
      fixtures.map(async ({ f, league }) => {
        try {
          const p = await api(`/predictions?fixture=${f.fixture.id}`);
          const pred = p.response?.[0]?.predictions;
          if (!pred?.percent) return null;
          return {
            id: f.fixture.id,
            date: f.fixture.date,
            homeTeam: f.teams.home.name,
            awayTeam: f.teams.away.name,
            league: league.name,
            country: league.flag,
            predictions: {
              home: parsePercent(pred.percent.home),
              draw: parsePercent(pred.percent.draw),
              away: parsePercent(pred.percent.away),
              goals: parseGoals(pred.under_over),
            },
            premiumAnalysis: pred.advice || "",
          };
        } catch (e) {
          return null;
        }
      })
    );

    const result = matches
      .filter(Boolean)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return Response.json({ matches: result });
  } catch (e) {
    return Response.json(
      { matches: [], error: "No se pudieron cargar los partidos" },
      { status: 500 }
    );
  }
}
