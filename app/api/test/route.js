export async function GET() {
  const today = new Date().toISOString().slice(0, 10);
  const res = await fetch(
    `https://v3.football.api-sports.io/fixtures?date=${today}&league=39&season=2026`,
    { headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY } }
  );
  const data = await res.json();
  return Response.json({
    date: today,
    errors: data.errors,
    results: data.results,
  });
}
