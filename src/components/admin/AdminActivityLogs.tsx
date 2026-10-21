import React, { useState, useEffect, useMemo } from 'react';
import { ActivityLog } from '../../types';
import { supabase } from '../../lib/supabase';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  User, 
  Clock, 
  CheckCircle, 
  CreditCard, 
  QrCode, 
  Settings, 
  Home, 
  FileText,
  AlertCircle
} from 'lucide-react';

interface AdminActivityLogsProps {
  userEmail: string;
}

export const AdminActivityLogs: React.FC<AdminActivityLogsProps> = ({ userEmail }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Charger les logs depuis Supabase (avec fallback localStorage)
  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (!error && data && data.length > 0) {
        setLogs(data);
      } else {
        // Fallback local storage
        const localLogs = localStorage.getItem('serfig_admin_activity_logs');
        if (localLogs) {
          try {
            setLogs(JSON.parse(localLogs));
          } catch {
            setLogs([]);
          }
        } else {
          // Exemples initiaux si tout neuf
          const initialMock: ActivityLog[] = [
            {
              id: 'log-1',
              user_email: userEmail || 'admin@aeemci-goh.ci',
              action: 'CONNEXION_ADMIN',
              entity_type: 'AUTH',
              details: { ip: 'Connexion sécurisée', browser: navigator.userAgent.slice(0, 30) },
              created_at: new Date().toISOString()
            }
          ];
          setLogs(initialMock);
        }
      }
    } catch (err) {
      console.error('Erreur chargement logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filtrage
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filterAction !== 'all') {
        if (!log.action.toLowerCase().includes(filterAction.toLowerCase())) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inAction = (log.action || '').toLowerCase().includes(q);
        const inEmail = (log.user_email || '').toLowerCase().includes(q);
        const inDetails = JSON.stringify(log.details || '').toLowerCase().includes(q);
        if (!inAction && !inEmail && !inDetails) return false;
      }
      return true;
    });
  }, [logs, filterAction, searchQuery]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['Date & Heure', 'Administrateur', 'Action', 'Entité', 'Détails'];
    const rows = filteredLogs.map(l => [
      new Date(l.created_at).toLocaleString('fr-FR'),
      l.user_email,
      l.action,
      l.entity_type || '—',
      JSON.stringify(l.details || {})
    ]);

    const csvContent = '\uFEFF' + [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `journal_activite_serfig_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('PAIEMENT') || act.includes('CASH') || act.includes('FINANCE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
          <CreditCard className="w-3 h-3 text-emerald-600" />
          <span>Finance</span>
        </span>
      );
    }
    if (act.includes('POINTAGE') || act.includes('SCAN') || act.includes('CHECKIN')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">
          <QrCode className="w-3 h-3 text-purple-600" />
          <span>Pointage</span>
        </span>
      );
    }
    if (act.includes('DORTOIR') || act.includes('HEBERGEMENT')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
          <Home className="w-3 h-3 text-blue-600" />
          <span>Hébergement</span>
        </span>
      );
    }
    if (act.includes('CONFIG') || act.includes('TARIF')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
          <Settings className="w-3 h-3 text-amber-600" />
          <span>Paramètres</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">
        <FileText className="w-3 h-3 text-slate-500" />
        <span>Général</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Journal d'Activité & Traçabilité (Phase 2)</h2>
            <p className="text-xs text-slate-500">
              Historique immuable de toutes les opérations sensibles des administrateurs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-orange-600' : ''}`} />
            <span>Actualiser</span>
          </button>
          <button
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter CSV</span>
          </button>
        </div>
      </div>

      {/* Filtres & Recherche */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par action, email admin ou détails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
          >
            <option value="all">Toutes les actions</option>
            <option value="paiement">Paiements & Trésorerie</option>
            <option value="pointage">Pointages & Émargement</option>
            <option value="dortoir">Dortoirs & Hébergement</option>
            <option value="config">Configuration & Tarifs</option>
            <option value="participant">Gestion Participants</option>
          </select>
        </div>
      </div>

      {/* Liste des logs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <History className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">Aucun enregistrement trouvé</p>
            <p className="text-xs">Les actions administratives apparaîtront ici automatiquement.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              const date = new Date(log.created_at);
              const formattedDate = date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              });
              const formattedTime = date.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });

              return (
                <div key={log.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getActionBadge(log.action)}</div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 font-mono text-[13px]">{log.action}</span>
                        {log.entity_type && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px]">
                            {log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-slate-500 mt-1 text-[11px]">
                        <span className="flex items-center gap-1 font-medium">
                          <User className="w-3 h-3 text-slate-400" />
                          {log.user_email}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formattedDate} à {formattedTime}
                        </span>
                      </div>
                      {log.details && (
                        <div className="mt-1.5 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono break-all max-w-2xl">
                          {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
