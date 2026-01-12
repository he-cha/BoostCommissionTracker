import { useMemo, useState } from 'react';
import { IMEINotes } from '../../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

interface IMEIStatusTableProps {
  notesList: IMEINotes[];
  type: 'notes' | 'status';
  onIMEIClick?: (imei: string) => void;
}

export function IMEIStatusTable({ notesList, type, onIMEIClick }: IMEIStatusTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return notesList.filter(n =>
      n.imei.toLowerCase().includes(lower) ||
      (n.notes && n.notes.toLowerCase().includes(lower)) ||
      (n.suspendedInfo && n.suspendedInfo.toLowerCase().includes(lower)) ||
      (n.deactivatedInfo && n.deactivatedInfo.toLowerCase().includes(lower))
    );
  }, [notesList, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search by IMEI, Notes, or Info..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-64"
        />
      </div>
      <div className="border rounded-lg overflow-hidden mt-2">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">IMEI</TableHead>
                {type === 'status' && <TableHead className="font-semibold">Status</TableHead>}
                {type === 'status' && <TableHead className="font-semibold">Info</TableHead>}
                {type === 'notes' && <TableHead className="font-semibold">Notes</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={type === 'status' ? 3 : 2} className="text-center py-8 text-muted-foreground">
                    No IMEIs found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(n => (
                  <TableRow key={n.imei} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-sm font-medium">
                      {onIMEIClick ? (
                        <button className="text-primary hover:underline cursor-pointer" onClick={() => onIMEIClick(n.imei)}>{n.imei}</button>
                      ) : n.imei}
                    </TableCell>
                    {type === 'status' && (
                      <TableCell>
                        {n.deactivated ? <Badge variant="outline" className="bg-red-500 text-white border">Deactivated</Badge> : null}
                        {n.suspended ? <Badge variant="outline" className="bg-white text-black border">Suspended</Badge> : null}
                        {!n.deactivated && !n.suspended ? <span className="text-muted-foreground">Active</span> : null}
                      </TableCell>
                    )}
                    {type === 'status' && (
                      <TableCell>
                        {n.deactivated && n.deactivatedInfo}
                        {n.suspended && n.suspendedInfo}
                      </TableCell>
                    )}
                    {type === 'notes' && (
                      <TableCell>
                        {n.notes ? n.notes : <span className="text-destructive">Pending</span>}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
