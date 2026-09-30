'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Target, Clock, LogOut } from 'lucide-react';

export default function PredictionsPage() {
  const [activeTab, setActiveTab] = useState('today');
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/matches')
      .then((res) => res.json())
      .then((data) => {
        setMatches((data.matches || []).map((m) => ({ ...m, date: new Date(m.date) })));
        if (data.error) setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const leagues = ['all', 'Premier League', 'La Liga', 'Ligue 1', 'Bundesliga', 'Serie A', 'Liga MX'];

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => selectedLeague === 'all' || m.league === selectedLeague);
  }, [matches, selectedLeague]);

  const getPredictionColor = (value) => {
    if (value >= 60) return 'from-green-500 to-emerald-500';
    if (value >= 45) return 'from-blue-500 to-cyan-500';
    return 'from-amber-500 to-orange-500';
  };

  const translateAdvice = (text) => {
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
  };

  const formatDate = (date) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('es-MX', options).toUpperCase();
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  const LoginModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 max-w-md w-full border border-gray-700">
        <h2 className="text-2xl font-bold mb-6">Acceso Premium</h2>

        <div className="space-y-4 mb-6">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-500"
          />
        </div>

        <button
          onClick={() => {
            setIsLoggedIn(true);
            setIsPremium(true);
            setShowLoginModal(false);
          }}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-2 rounded-lg mb-3"
        >
          Acceder Premium
        </button>

        <button
          onClick={() => setShowLoginModal(false)}
          className="w-full bg-gray-800 text-white font-bold py-2 rounded-lg"
        >
          Cerrar
        </button>

        <p className="text-center text-sm text-gray-400 mt-4">
          Premium: $4.99 MXN/mes
        </p>
      </div>
    </div>
  );

  const renderTabContent = (match) => {
    const { predictions } = match;

    switch (activeTab) {
      case 'today':
        return (
          <div className="space-y-3 mt-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-3 border border-gray-700">
                <p className="text-xs text-gray-400 mb-2">Local</p>
                <span className={`text-xl font-bold bg-gradient-to-r ${getPredictionColor(predictions.home)} bg-clip-text text-transparent`}>
                  {predictions.home}%
                </span>
              </div>
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-3 border border-gray-700">
                <p className="text-xs text-gray-400 mb-2">Empate</p>
                <span className={`text-xl font-bold bg-gradient-to-r ${getPredictionColor(predictions.draw)} bg-clip-text text-transparent`}>
                  {predictions.draw}%
                </span>
              </div>
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-3 border border-gray-700">
                <p className="text-xs text-gray-400 mb-2">Visitante</p>
                <span className={`text-xl font-bold bg-gradient-to-r ${getPredictionColor(predictions.away)} bg-clip-text text-transparent`}>
                  {predictions.away}%
                </span>
              </div>
            </div>
          </div>
        );
      case 'over-under':
        return (
          <div className="mt-3">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-3 border border-gray-700">
              <p className="text-xs text-gray-400 mb-2">Goles totales</p>
              <span className="text-xl font-bold text-cyan-300">
                {predictions.goals || 'Sin pronóstico'}
              </span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const MatchCard = ({ match }) => (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl border border-gray-700 overflow-hidden shadow-lg hover:shadow-xl hover:border-gray-600 transition">
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{match.country}</span>
            <span className="text-xs font-medium text-gray-400">{match.league}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <Clock size={14} />
            {formatTime(match.date)}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-white text-sm">{match.homeTeam}</span>
            <span className="text-xs text-gray-500">Local</span>
          </div>
          <div className="w-full h-0.5 bg-gradient-to-r from-gray-700 to-transparent"></div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-white text-sm">{match.awayTeam}</span>
            <span className="text-xs text-gray-500">Visitante</span>
          </div>
        </div>

        {renderTabContent(match)}

        {isPremium && match.premiumAnalysis && (
          <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <p className="text-xs text-purple-200">
              <strong>Recomendación:</strong> {translateAdvice(match.premiumAnalysis)}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const groupedMatches = useMemo(() => {
    const grouped = {};
    filteredMatches.forEach((match) => {
      const dateKey = formatDate(match.date);
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(match);
    });
    return grouped;
  }, [filteredMatches]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black text-white pb-20">
      <div className="sticky top-0 z-50 bg-gradient-to-b from-black to-gray-950 border-b border-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Target className="text-purple-500" size={32} />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  Predicciones
                </h1>
                <p className="text-xs text-gray-400">Análisis de fútbol profesional</p>
              </div>
            </div>
            <div className="flex gap-2">
              {!isLoggedIn ? (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:shadow-lg transition"
                >
                  Premium
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsLoggedIn(false);
                    setIsPremium(false);
                  }}
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-700 transition flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Salir
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
            {[
              { id: 'today', label: '1X2' },
              { id: 'over-under', label: 'Over/Under' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {leagues.map((league) => (
              <button
                key={league}
                onClick={() => setSelectedLeague(league)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  selectedLeague === league
                    ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {league === 'all' ? 'Todas' : league}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-4">
        {loading && (
          <p className="text-center text-gray-400 py-10">Cargando partidos...</p>
        )}
        {!loading && error && (
          <p className="text-center text-gray-400 py-10">
            No se pudieron cargar los partidos. Intenta de nuevo más tarde.
          </p>
        )}
        {!loading && !error && filteredMatches.length === 0 && (
          <p className="text-center text-gray-400 py-10">
            No hay partidos próximos para esta liga.
          </p>
        )}

        {Object.entries(groupedMatches).map(([dateKey, matchesForDate]) => (
          <div key={dateKey} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-sm font-bold text-gray-300 uppercase tracking-wide">{dateKey}</span>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-700 to-transparent"></div>
            </div>

            <div className="space-y-3">
              {matchesForDate.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8 mb-4">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center text-gray-500 text-sm">
          {!isPremium && <p>🔔 Espacio para publicidad de Google Ads</p>}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 border-t border-gray-800 pt-6 pb-4 text-center text-xs text-gray-500">
        <p className="mb-2">📊 Predicciones basadas en análisis matemático e histórico</p>
        <p className="mb-4">Premium: Análisis completo + Sin publicidad + Notificaciones</p>
        <p>© {new Date().getFullYear()} Predicciones.com.mx | Todos los derechos reservados</p>
      </div>

      {showLoginModal && <LoginModal />}
    </div>
  );
}
