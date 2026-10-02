export async function GET() {
  const headers = { "x-apisports-key": process.env.API_FOOTBALL_KEY };
  const base = "https://v3.football.api-sports.io";
  const get = async (p) => (await fetch(`${base}${p}`, { headers })).json();

  const fixture = 1550985;
  const [pred, inj, std] = await Promise.all([
    get(`/predictions?fixture=${fixture}`),
    get(`/injuries?fixture=${fixture}`),
    get(`/standings?league=262&season=2026`),
  ]);

  const p = pred.response?.[0];
  const table = std.response?.[0]?.league?.standings;
  const lado = (t) => t && { nombre: t.name, ultimos5: t.last_5, forma: t.league?.form };

  return Response.json({
    errores: { pred: pred.errors, inj: inj.errors, std: std.errors },
    claves: p && Object.keys(p),
    local: lado(p?.teams?.home),
    visita: lado(p?.teams?.away),
    comparacion: p?.comparison,
    h2h_partidos: p?.h2h?.length,
    lesionados: inj.results,
    lesionados_muestra: inj.response?.slice(0, 3).map((i) => ({
      jugador: i.player?.name,
      equipo: i.team?.name,
      tipo: i.player?.type,
      razon: i.player?.reason,
    })),
    tabla_grupos: table?.length,
    tabla_muestra: table?.[0]?.slice(0, 3).map((t) => ({
      pos: t.rank,
      equipo: t.team?.name,
      pts: t.points,
      forma: t.form,
      grupo: t.group,
    })),
  });
}
