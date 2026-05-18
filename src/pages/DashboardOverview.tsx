import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichEintraege } from '@/lib/enrich';
import type { EnrichedEintraege } from '@/types/enriched';
import type { Kategorien } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KategorienDialog } from '@/components/dialogs/KategorienDialog';
import { EintraegeDialog } from '@/components/dialogs/EintraegeDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import {
  IconAlertCircle, IconTool, IconRefresh, IconCheck,
  IconPlus, IconPencil, IconTrash, IconSearch, IconFolder,
  IconFolderOpen, IconNote, IconTag,
} from '@tabler/icons-react';

const APPGROUP_ID = '6a0b0a3b6567615f5344404f';
const REPAIR_ENDPOINT = '/claude/build/repair';

export default function DashboardOverview() {
  const {
    kategorien, eintraege,
    kategorienMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedEintraege = enrichEintraege(eintraege, { kategorienMap });

  // All hooks BEFORE early returns
  const [selectedKategorieId, setSelectedKategorieId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Dialog states
  const [katDialogOpen, setKatDialogOpen] = useState(false);
  const [katEditRecord, setKatEditRecord] = useState<Kategorien | null>(null);
  const [eintragDialogOpen, setEintragDialogOpen] = useState(false);
  const [eintragEditRecord, setEintragEditRecord] = useState<EnrichedEintraege | null>(null);
  const [eintragDefaultKategorie, setEintragDefaultKategorie] = useState<string | undefined>(undefined);

  // Confirm delete
  const [deleteKatTarget, setDeleteKatTarget] = useState<Kategorien | null>(null);
  const [deleteEintragTarget, setDeleteEintragTarget] = useState<EnrichedEintraege | null>(null);

  const filteredEintraege = useMemo(() => {
    let list = enrichedEintraege;
    if (selectedKategorieId) {
      list = list.filter(e => {
        const url = e.fields.kategorie;
        if (!url) return false;
        return url.endsWith(selectedKategorieId);
      });
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(e =>
        (e.fields.titel ?? '').toLowerCase().includes(s) ||
        (e.fields.notizen ?? '').toLowerCase().includes(s) ||
        e.kategorieName.toLowerCase().includes(s)
      );
    }
    return list;
  }, [enrichedEintraege, selectedKategorieId, search]);

  const countByKategorie = useMemo(() => {
    const m = new Map<string, number>();
    enrichedEintraege.forEach(e => {
      const url = e.fields.kategorie;
      if (!url) return;
      const id = url.split('/').pop() ?? '';
      m.set(id, (m.get(id) ?? 0) + 1);
    });
    return m;
  }, [enrichedEintraege]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const handleCreateKat = async (fields: Kategorien['fields']) => {
    await LivingAppsService.createKategorienEntry(fields);
    fetchAll();
  };

  const handleEditKat = async (fields: Kategorien['fields']) => {
    if (!katEditRecord) return;
    await LivingAppsService.updateKategorienEntry(katEditRecord.record_id, fields);
    fetchAll();
    setKatEditRecord(null);
  };

  const handleDeleteKat = async () => {
    if (!deleteKatTarget) return;
    await LivingAppsService.deleteKategorienEntry(deleteKatTarget.record_id);
    if (selectedKategorieId === deleteKatTarget.record_id) setSelectedKategorieId(null);
    fetchAll();
    setDeleteKatTarget(null);
  };

  const handleCreateEintrag = async (fields: EnrichedEintraege['fields']) => {
    await LivingAppsService.createEintraegeEntry(fields);
    fetchAll();
  };

  const handleEditEintrag = async (fields: EnrichedEintraege['fields']) => {
    if (!eintragEditRecord) return;
    await LivingAppsService.updateEintraegeEntry(eintragEditRecord.record_id, fields);
    fetchAll();
    setEintragEditRecord(null);
  };

  const handleDeleteEintrag = async () => {
    if (!deleteEintragTarget) return;
    await LivingAppsService.deleteEintraegeEntry(deleteEintragTarget.record_id);
    fetchAll();
    setDeleteEintragTarget(null);
  };

  const openCreateEintrag = (kategorieId?: string) => {
    setEintragEditRecord(null);
    setEintragDefaultKategorie(
      kategorieId ? createRecordUrl(APP_IDS.KATEGORIEN, kategorieId) : undefined
    );
    setEintragDialogOpen(true);
  };

  const selectedKat = selectedKategorieId ? kategorienMap.get(selectedKategorieId) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground truncate">Einträge</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {enrichedEintraege.length} {enrichedEintraege.length === 1 ? 'Eintrag' : 'Einträge'} · {kategorien.length} {kategorien.length === 1 ? 'Kategorie' : 'Kategorien'}
          </p>
        </div>
        <Button onClick={() => openCreateEintrag(selectedKategorieId ?? undefined)} className="shrink-0">
          <IconPlus size={16} className="mr-1.5 shrink-0" />
          Neuer Eintrag
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 min-h-0">
        {/* Sidebar: Kategorien */}
        <aside className="lg:w-64 shrink-0 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kategorien</span>
            <button
              onClick={() => { setKatEditRecord(null); setKatDialogOpen(true); }}
              className="p-1 rounded-md hover:bg-muted transition-colors"
              title="Neue Kategorie"
            >
              <IconPlus size={14} className="text-muted-foreground" />
            </button>
          </div>

          {/* Alle Einträge */}
          <button
            onClick={() => setSelectedKategorieId(null)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
              selectedKategorieId === null
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted text-foreground'
            }`}
          >
            <IconNote size={16} className="shrink-0" />
            <span className="flex-1 truncate">Alle Einträge</span>
            <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${selectedKategorieId === null ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {enrichedEintraege.length}
            </span>
          </button>

          {kategorien.length === 0 && (
            <p className="text-xs text-muted-foreground px-3 py-2">Noch keine Kategorien.</p>
          )}

          {kategorien.map(kat => {
            const isActive = selectedKategorieId === kat.record_id;
            const count = countByKategorie.get(kat.record_id) ?? 0;
            return (
              <div key={kat.record_id} className="group relative">
                <button
                  onClick={() => setSelectedKategorieId(isActive ? null : kat.record_id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  {isActive
                    ? <IconFolderOpen size={16} className="shrink-0" />
                    : <IconFolder size={16} className="shrink-0" />
                  }
                  <span className="flex-1 truncate min-w-0">{kat.fields.name ?? '—'}</span>
                  <span className={`text-xs rounded-full px-2 py-0.5 font-semibold shrink-0 ${isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {count}
                  </span>
                </button>
                {/* Edit / Delete always visible */}
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
                  <button
                    onClick={e => { e.stopPropagation(); setKatEditRecord(kat); setKatDialogOpen(true); }}
                    className={`p-1 rounded transition-colors ${isActive ? 'hover:bg-primary-foreground/20 text-primary-foreground' : 'hover:bg-muted-foreground/20 text-muted-foreground'}`}
                    title="Bearbeiten"
                  >
                    <IconPencil size={12} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteKatTarget(kat); }}
                    className={`p-1 rounded transition-colors ${isActive ? 'hover:bg-destructive/30 text-primary-foreground' : 'hover:bg-destructive/10 text-muted-foreground hover:text-destructive'}`}
                    title="Löschen"
                  >
                    <IconTrash size={12} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Nicht kategorisiert */}
          {(() => {
            const uncategorized = enrichedEintraege.filter(e => !e.fields.kategorie);
            if (uncategorized.length === 0) return null;
            return (
              <button
                onClick={() => setSelectedKategorieId('__none__')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                  selectedKategorieId === '__none__'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                <IconTag size={16} className="shrink-0" />
                <span className="flex-1 truncate">Ohne Kategorie</span>
                <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${selectedKategorieId === '__none__' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {uncategorized.length}
                </span>
              </button>
            );
          })()}
        </aside>

        {/* Main: Einträge */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Search + context bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-0 max-w-sm">
              <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0" />
              <Input
                placeholder="Einträge suchen..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            {selectedKat && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/8 border border-primary/20">
                <IconFolderOpen size={14} className="text-primary shrink-0" />
                <span className="text-sm font-medium text-primary truncate max-w-[160px]">{selectedKat.fields.name}</span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => openCreateEintrag(selectedKategorieId && selectedKategorieId !== '__none__' ? selectedKategorieId : undefined)}
              className="shrink-0"
            >
              <IconPlus size={14} className="mr-1 shrink-0" />
              <span className="hidden sm:inline">Eintrag</span>
            </Button>
          </div>

          {/* Selected category description */}
          {selectedKat?.fields.beschreibung && (
            <p className="text-sm text-muted-foreground bg-muted/40 rounded-xl px-4 py-3 border border-border">
              {selectedKat.fields.beschreibung}
            </p>
          )}

          {/* Entry cards */}
          {filteredEintraege.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border-2 border-dashed border-border">
              <IconNote size={40} className="text-muted-foreground" stroke={1.5} />
              <div className="text-center">
                <p className="font-medium text-foreground">
                  {search ? 'Keine Treffer gefunden' : 'Noch keine Einträge'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {search ? 'Suchbegriff anpassen' : 'Klicke auf „Neuer Eintrag" um zu starten'}
                </p>
              </div>
              {!search && (
                <Button size="sm" onClick={() => openCreateEintrag(selectedKategorieId && selectedKategorieId !== '__none__' ? selectedKategorieId : undefined)}>
                  <IconPlus size={14} className="mr-1" /> Ersten Eintrag erstellen
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredEintraege.map(eintrag => (
                <EintragCard
                  key={eintrag.record_id}
                  eintrag={eintrag}
                  onEdit={() => { setEintragEditRecord(eintrag); setEintragDefaultKategorie(undefined); setEintragDialogOpen(true); }}
                  onDelete={() => setDeleteEintragTarget(eintrag)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Kategorien Dialog */}
      <KategorienDialog
        open={katDialogOpen}
        onClose={() => { setKatDialogOpen(false); setKatEditRecord(null); }}
        onSubmit={katEditRecord ? handleEditKat : handleCreateKat}
        defaultValues={katEditRecord?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Kategorien']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Kategorien']}
      />

      {/* Einträge Dialog */}
      <EintraegeDialog
        open={eintragDialogOpen}
        onClose={() => { setEintragDialogOpen(false); setEintragEditRecord(null); setEintragDefaultKategorie(undefined); }}
        onSubmit={eintragEditRecord ? handleEditEintrag : handleCreateEintrag}
        defaultValues={eintragEditRecord ? eintragEditRecord.fields : (eintragDefaultKategorie ? { kategorie: eintragDefaultKategorie } : undefined)}
        kategorienList={kategorien}
        enablePhotoScan={AI_PHOTO_SCAN['Eintraege']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Eintraege']}
      />

      {/* Confirm delete kategorie */}
      <ConfirmDialog
        open={!!deleteKatTarget}
        title="Kategorie löschen"
        description={`Kategorie „${deleteKatTarget?.fields.name ?? ''}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        onConfirm={handleDeleteKat}
        onClose={() => setDeleteKatTarget(null)}
      />

      {/* Confirm delete eintrag */}
      <ConfirmDialog
        open={!!deleteEintragTarget}
        title="Eintrag löschen"
        description={`Eintrag „${deleteEintragTarget?.fields.titel ?? 'Ohne Titel'}" wirklich löschen?`}
        onConfirm={handleDeleteEintrag}
        onClose={() => setDeleteEintragTarget(null)}
      />
    </div>
  );
}

function EintragCard({
  eintrag,
  onEdit,
  onDelete,
}: {
  eintrag: EnrichedEintraege;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const titel = eintrag.fields.titel ?? 'Ohne Titel';
  const notizen = eintrag.fields.notizen ?? '';
  const kategorieName = eintrag.kategorieName;

  return (
    <div className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 hover:shadow-md transition-shadow overflow-hidden">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-foreground text-base leading-snug line-clamp-2 min-w-0 flex-1">{titel}</h3>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Bearbeiten"
          >
            <IconPencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
            title="Löschen"
          >
            <IconTrash size={14} />
          </button>
        </div>
      </div>

      {notizen && (
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed min-w-0">{notizen}</p>
      )}

      {kategorieName && (
        <div className="mt-auto pt-1 flex items-center gap-1.5 min-w-0">
          <IconFolder size={12} className="text-primary shrink-0" />
          <span className="text-xs font-medium text-primary truncate">{kategorieName}</span>
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="lg:w-64 space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) {
            setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          }
          if (content.startsWith('[DONE]')) {
            setRepairDone(true);
            setRepairing(false);
          }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) {
            setRepairFailed(true);
          }
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}
