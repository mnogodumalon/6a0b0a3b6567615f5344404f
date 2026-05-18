import type { Eintraege, Kategorien } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { IconPencil } from '@tabler/icons-react';

interface EintraegeViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Eintraege | null;
  onEdit: (record: Eintraege) => void;
  kategorienList: Kategorien[];
}

export function EintraegeViewDialog({ open, onClose, record, onEdit, kategorienList }: EintraegeViewDialogProps) {
  function getKategorienDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return kategorienList.find(r => r.record_id === id)?.fields.name ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Einträge anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kategorie</Label>
            <p className="text-sm">{getKategorienDisplayName(record.fields.kategorie)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Notizen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.notizen ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Titel</Label>
            <p className="text-sm">{record.fields.titel ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}