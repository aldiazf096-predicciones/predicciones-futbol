import Link from 'next/link';
import { notFound } from 'next/navigation';

const BASE = 'https://v3.football.api-sports.io';
const LEAGUE_IDS = [39, 140, 61, 78, 135, 262];
const TZ = 'America/Mexico_City';

const CONTEXTO_LIGA_MX = [
  'Liga MX juega torneos cortos: Apertura y Clausura, con 18 equipos y 17 jornadas. Con tan pocos partidos, cada punto pesa mucho.',
  'Varios estadios están a más de 2,000 metros sobre el nivel del mar (Toluca, Pachuca y Ciudad de México), lo que castiga a los equipos que no están acostumbrados.',
  'Las fechas FIFA y los torneos internacionales pueden dejar sin jugadores clave a algunos equipos; conviene revisar las bajas antes del partido.',
];

async function api(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'x-apisports-key': process.env.API_FOOTBALL_KEY },
    next: { revalidate: 21600 },
  });
  const data = await res.json();
  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(JSON.stringify(data.errors));
  }
  return data;
}

async function getData(id) {
  try {
    const fx = await api(`/fixtures?id=${id}`);
    const f = fx.response?.[0];
    if (!f || !LEAGUE_IDS.includes(f.league.id)) return null;

    const [pred, std] = await Promise.all([
      api(`/predictions?fixture=${id}`).catch(() => null),
      api(`/standings?league=${f.league.id}&season=${f.league.season}`).catch(() => null),
    ]);

    const p = pred?.response?.[0] || null;
    const table = std?.response?.[0]?.league?.standings?.[0] || [];
    const rowOf = (teamId) => table.find((t) => t.team?.id === teamId) || null;

    return {
      f,
      p,
      homeRow: rowOf(f.teams.home.id),
      awayRow: rowOf(f.teams.away.id),
    };
  } catch (e) {
    return null;
  }
}

const pct = (v) => {
  const n = parseFloat(v);
  return Number.isNaN(n) ? 0 : Math.round(n);
};

function goalsText(v) {
  if (!v) return null;
  const s = String(v);
  const n = s.replace(/[+-]/, '');
  return s.startsWith('-') ? `Menos de ${n} goles` : `Más de ${n} goles`;
}

function translateAdvice(text) {
  if (!text) return '';
  return text
    .replace(/-(\d+(?:\.\d+)?) goals/, 'menos de $1 goles')
    .replace(/\+(\d+(?:\.\d+)?) goals/, 'más de $1 goles')
    .replace('Combo Double chance', 'Combinada doble oportunidad')
    .replace('Combo Winner', 'Combinada ganador')
    .replace('Double chance', 'Doble oportunidad')
    .replace('Winner', 'Ganador')
    .replace(' or draw', ' o empate')
    .replace('draw or ', 'empate o ')
    .replace(' and ', ' y ')
    .replace(' : ', ': ');
}

const record = (r) => (r ? `${r.win}G ${r.draw}E ${r.lose}P` : '—');

function FormChips({ form }) {
  const letters = (form || '').slice(-5).split('');
  if (letters.length === 0) return <span className="text-xs text-gray-500">Sin datos</span>;
  return (
    <div className="flex gap-1">
      {letters.map((r, i) => (
        <span
          key={i}
          className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${
            r === 'W'
              ? 'bg-green-500/30 text-green-300'
              : r === 'D'
              ? 'bg-gray-500/30 text-gray-300'
              : 'bg-red-500/30 text-red-300'
          }`}
        >
          {r === 'W' ? 'G' : r === 'D' ? 'E' : 'P'}
        </span>
      ))}
    </div>
  );
}

function CompareBar({ label, home, away }) {
  const total = home + away || 1;
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{home}%</span>
        <span>{label}</span>
        <span>{away}%</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-gray-800">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${(home / total) * 100}%` }} />
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${(away / total) * 100}%` }} />
      </div>
    </div>
  );
}

function TeamColumn({ name, row, p, side }) {
  const last5 = p?.teams?.[side]?.last_5;
  const seasonForm = p?.teams?.[side]?.league?.form;
  const form = seasonForm || (row?.form ? row.form.split('').reverse().join('') : '');
  const own = side === 'home' ? row?.home : row?.away;
  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 border border-gray-700">
      <p className="font-semibold text-white mb-3">{name}</p>
      <div className="space-y-2 text-xs text-gray-300">
        <p>
          Posición: <span className="text-white font-bold">{row ? `${row.rank}º` : '—'}</span>
          {row ? ` · ${row.points} pts en ${row.all?.played} partidos` : ''}
        </p>
        <p>
          Balance: <span className="text-white">{record(row?.all)}</span>
          {row?.all?.goals ? ` · GF ${row.all.goals.for} / GC ${row.all.goals.against}` : ''}
        </p>
        <p>
          {side === 'home' ? 'De local' : 'De visita'}: <span className="text-white">{record(own)}</span>
        </p>
        {last5?.goals?.for?.average != null && (
          <p>
            Últimos partidos: {last5.goals.for.average} goles a favor y {last5.goals.against.average} en contra por juego
          </p>
        )}
        <div className="pt-1">
          <p className="mb-1">Últimos 5 (más reciente a la derecha):</p>
          <FormChips form={form} />
        </div>
      </div>
    </div>
  );
}

function buildReading(f, homeRow, awayRow, p) {
  const home = f.teams.home.name;
  const away = f.teams.away.name;
  const out = [];
  if (homeRow && awayRow) {
    out.push(
      `${home} es ${homeRow.rank}º de la tabla con ${homeRow.points} puntos, y ${away} es ${awayRow.rank}º con ${awayRow.points}.`
    );
  }
  const hl = p?.teams?.home?.last_5;
  const al = p?.teams?.away?.last_5;
  if (hl?.goals?.for?.average != null && al?.goals?.for?.average != null) {
    out.push(
      `En sus últimos partidos, ${home} promedia ${hl.goals.for.average} goles a favor y ${hl.goals.against.average} en contra; ${away} promedia ${al.goals.for.average} a favor y ${al.goals.against.average} en contra.`
    );
  }
  const att = pct(p?.comparison?.att?.home);
  const def = pct(p?.comparison?.def?.home);
  if (att && def) {
    out.push(
      att >= 55 ? `${home} tiene ventaja en ataque.` : att <= 45 ? `${away} tiene ventaja en ataque.` : 'El ataque está parejo entre ambos.'
    );
    out.push(
      def >= 55 ? `${home} llega mejor parado en defensa.` : def <= 45 ? `${away} llega mejor parado en defensa.` : 'La defensa está pareja entre ambos.'
    );
  }
  return out;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const data = /^\d+$/.test(id) ? await getData(id) : null;
  if (!data) return { title: 'Partido no encontrado' };
  const { f } = data;
  const title = `${f.teams.home.name} vs ${f.teams.away.name}: pronóstico y previa (${f.league.name})`;
  return {
    title,
    description: `Previa de ${f.teams.home.name} vs ${f.teams.away.name} por ${f.league.name}: cómo llegan, posición en la tabla, probabilidades 1X2 y pronóstico de goles.`,
    alternates: { canonical: `/partido/${id}` },
    openGraph: { title, url: `/partido/${id}`, type: 'article' },
  };
}

export default async function PartidoPage({ params }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const data = await getData(id);
  if (!data) notFound();

  const { f, p, homeRow, awayRow } = data;
  const home = f.teams.home.name;
  const away = f.teams.away.name;
  const date = new Date(f.fixture.date);
  const fecha = date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ });
  const hora = date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
  const jornada = /-\s*(\d+)$/.exec(f.league.round || '')?.[1];
  const sede = [f.fixture.venue?.name, f.fixture.venue?.city].filter(Boolean).join(', ');

  const percent = p?.predictions?.percent;
  const goles = goalsText(p?.predictions?.under_over);
  const consejo = translateAdvice(p?.predictions?.advice);
  const reading = buildReading(f, homeRow, awayRow, p);
  const comp = p?.comparison;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black text-white pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <Link href="/" className="text-sm text-cyan-300 hover:underline">
          ← Todos los partidos
        </Link>

        <div className="mt-4 mb-6">
          <p className="text-xs text-gray-400 mb-2">
            {f.league.name}
            {jornada ? ` · Jornada ${jornada}` : ''}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            {home} vs {away}
          </h1>
          <p className="text-sm text-gray-400 mt-2 capitalize">
            {fecha} · {hora} (hora del centro de México)
          </p>
          {sede && <p className="text-xs text-gray-500 mt-1">{sede}</p>}
        </div>

        {percent && (
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-3">Pronóstico</h2>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: `Gana ${home}`, v: pct(percent.home) },
                { label: 'Empate', v: pct(percent.draw) },
                { label: `Gana ${away}`, v: pct(percent.away) },
              ].map((x) => (
                <div key={x.label} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-3 border border-gray-700">
                  <p className="text-xs text-gray-400 mb-2">{x.label}</p>
                  <span className="text-xl font-bold text-cyan-300">{x.v}%</span>
                </div>
              ))}
            </div>
            {goles && (
              <p className="text-sm text-gray-300 mb-2">
                Goles totales: <span className="font-bold text-cyan-300">{goles}</span>
              </p>
            )}
            {consejo && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <p className="text-xs text-purple-200">
                  <strong>Recomendación:</strong> {consejo}
                </p>
              </div>
            )}
          </section>
        )}

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">Cómo llegan</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <TeamColumn name={home} row={homeRow} p={p} side="home" />
            <TeamColumn name={away} row={awayRow} p={p} side="away" />
          </div>
        </section>

        {comp && (
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-3">Comparativa</h2>
            <div className="flex justify-between text-xs mb-3">
              <span className="text-pink-300 font-semibold">{home}</span>
              <span className="text-cyan-300 font-semibold">{away}</span>
            </div>
            <CompareBar label="Forma" home={pct(comp.form?.home)} away={pct(comp.form?.away)} />
            <CompareBar label="Ataque" home={pct(comp.att?.home)} away={pct(comp.att?.away)} />
            <CompareBar label="Defensa" home={pct(comp.def?.home)} away={pct(comp.def?.away)} />
          </section>
        )}

        {reading.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-3">Lectura del partido</h2>
            <div className="space-y-2 text-sm text-gray-300">
              {reading.map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </div>
          </section>
        )}

        {f.league.id === 262 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-3">Qué considerar en Liga MX</h2>
            <ul className="space-y-2 text-sm text-gray-300 list-disc pl-5">
              {CONTEXTO_LIGA_MX.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-xs text-gray-500 border-t border-gray-800 pt-4">
          Contenido informativo y de entretenimiento. Las predicciones no garantizan resultados. Este sitio no es una
          casa de apuestas ni promueve el juego. Solo para mayores de 18 años.
        </p>
      </div>
    </div>
  );
}
