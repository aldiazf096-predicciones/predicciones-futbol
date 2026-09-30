export async function GET() {
  const headers = { "x-apisports-key": process.env.API_FOOTBALL_KEY };
  const base = "https://v3.football.api-sports.io";

  const l = await (await fetch(`${base}/leagues?id=39&current=true`, { headers })).json();
  const n = await (await fetch(`${base}/fixtures?league=39&next=3`, { headers })).json();

  const s = l.response?.[0]?.seasons?.[0];
  return Response.json({
    temporada: s && { year: s.year, start: s.start, end: s.end, predicciones: s.coverage?.predictions },
    errorLiga: l.errors,
    proximos: n.results,
    errorProximos: n.errors,
    primero: n.response?.[0] && {
      id: n.response[0].fixture.id,
      fecha: n.response[0].fixture.date,
      local: n.response[0].teams.home.name,
      visita: n.response[0].teams.away.name,
    },
  });
}
