import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useCommissionStore } from '../../stores/commissionStore';
import { useEffect } from 'react';
import { parseBoostCSV } from '../../lib/csvParser';

export function CSVUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const setRecords = useCommissionStore((state) => state.setRecords || (() => {}));

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a CSV file',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const content = await file.text();
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const records = parseBoostCSV(content, fileId);

      if (records.length === 0) {
        toast({
          title: 'No records found',
          description: 'The CSV file contains no valid commission records',
          variant: 'destructive',
        });
        return;
      }

      // Log first parsed record for debugging
      console.log('First parsed record:', records[0]);

      // Send records to backend
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/commissions/upload`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });
      if (!response.ok) {
        throw new Error('Failed to upload records to backend');
      }

      // Fetch all records from backend after upload
      const fetchUrl = `${import.meta.env.VITE_API_URL}/api/commissions`;
      const fetchRes = await fetch(fetchUrl);
      if (!fetchRes.ok) {
        throw new Error('Failed to fetch records from backend');
      }
      const allRecords = await fetchRes.json();
      setRecords(allRecords);

      toast({
        title: 'CSV uploaded successfully',
        description: `Processed ${records.length} commission record(s) from "${file.name}"`,
      });
    } catch (error) {
      console.error('CSV parse error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to process CSV file',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload Boost Commission CSV
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload official Boost Mobile commission export files for automatic IMEI-based processing
        </p>
      </CardHeader>
      <CardContent>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center transition-all
            ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
            ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          {!isProcessing ? (
            <>
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Drop CSV file here</h3>
              <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>Select File</span>
                </Button>
              </label>
            </>
          ) : (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4" />
              <p className="text-sm font-medium">Processing CSV...</p>
              <p className="text-xs text-muted-foreground mt-1">Parsing IMEI-based records</p>
            </>
          )}
        </div>

        <div className="mt-6 bg-muted/50 rounded-lg p-4 border">
          <h4 className="text-sm font-semibold mb-2">Required CSV Columns:</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono text-muted-foreground">
            <div>• IMEI</div>
            <div>• Payment Date</div>
            <div>• Activation Date</div>
            <div>• Payment Type</div>
            <div>• Amount</div>
            <div>• Payment Description</div>
            <div>• Sale Type</div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            💡 The system will automatically extract month numbers from Payment Description
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
