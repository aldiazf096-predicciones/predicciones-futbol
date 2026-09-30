export async function GET() {
  const from = new Date();
  const to = new Date(Date.now() + 7 * 86400000);
  const f = (d) => d.toISOString().slice(0, 10);
  const res = await fetch(
    `https://v3.football.api-sports.io/fixtures?league=39&season=2026&from=${f(from)}&to=${f(to)}`,
    { headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY } }
  );
  const data = await res.json();
  return Response.json({
    errors: data.errors,
    results: data.results,
    primero: data.response?.[0]?.teams,
    fecha: data.response?.[0]?.fixture?.date,
  });
}
