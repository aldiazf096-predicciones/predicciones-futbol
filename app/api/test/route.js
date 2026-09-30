export async function GET() {
  const res = await fetch(
    "https://v3.football.api-sports.io/predictions?fixture=1557417",
    { headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY } }
  );
  const data = await res.json();
  const p = data.response?.[0];
  return Response.json({
    errors: data.errors,
    local: p?.teams?.home?.name,
    visita: p?.teams?.away?.name,
    predictions: p?.predictions,
  });
}
