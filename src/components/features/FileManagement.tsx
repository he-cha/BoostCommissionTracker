import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { FileText, Trash2, Calendar, Database } from 'lucide-react';
import { useCommissionStore } from '../../stores/commissionStore';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useToast } from '../../hooks/use-toast';

export function FileManagement() {
  const { toast } = useToast();
  const uploadedFiles = useCommissionStore((state) => state.uploadedFiles);
  const deleteFile = useCommissionStore((state) => state.deleteFile);

  const handleDeleteFile = (fileId: string, filename: string) => {
    if (confirm(`Delete "${filename}" and all its ${uploadedFiles.find(f => f.id === fileId)?.recordCount} records?`)) {
      deleteFile(fileId);
      toast({
        title: 'File deleted',
        description: `"${filename}" and all associated records have been removed`,
        variant: 'destructive',
      });
    }
  };

  if (uploadedFiles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Uploaded Files
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage your uploaded CSV files
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No files uploaded yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Uploaded Files
          <Badge variant="secondary" className="ml-2">
            {uploadedFiles.length}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage your uploaded CSV files and their records
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{file.filename}</h4>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(file.uploadedAt)}
                    </span>
                    <span>•</span>
                    <span>{file.recordCount} records</span>
                    <span>•</span>
                    <span className={file.totalAmount >= 0 ? 'text-success' : 'text-destructive'}>
                      {formatCurrency(file.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteFile(file.id, file.filename)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
          <p className="text-xs text-muted-foreground">
            💡 Deleting a file will remove all associated records from your dashboard. This action cannot be undone.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
