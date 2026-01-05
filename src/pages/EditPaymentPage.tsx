import { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { ArrowLeft, Save, Calendar } from 'lucide-react';
import { useCommissionStore } from '../stores/commissionStore';
import { useToast } from '../hooks/use-toast';

interface EditPaymentPageProps {
  recordId: string;
  onBack: () => void;
}

export function EditPaymentPage({ recordId, onBack }: EditPaymentPageProps) {
  const { toast } = useToast();
  const records = useCommissionStore((state) => state.records);
  const updateRecord = useCommissionStore((state) => state.updateRecord);
  
  const record = records.find(r => r.id === recordId);
  
  const [paymentDate, setPaymentDate] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [paymentType, setPaymentType] = useState('');

  useEffect(() => {
    if (record) {
      setPaymentDate(record.paymentDate || '');
      setAmount(record.amount.toString());
      setPaymentReceived(!!record.paymentDate);
      setPaymentType(record.paymentType);
    }
  }, [record]);

  if (!record) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button variant="ghost" onClick={onBack} className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <p className="text-muted-foreground">Record not found</p>
        </main>
      </div>
    );
  }

  const handleSave = () => {
    const updates: any = {
      amount: parseFloat(amount),
      paymentType,
    };

    if (paymentReceived && paymentDate) {
      updates.paymentDate = paymentDate;
    }

    updateRecord(recordId, updates);
    
    toast({
      title: 'Payment updated',
      description: 'Commission record has been updated successfully',
    });
    
    onBack();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={onBack} className="gap-2 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Card className="max-w-2xl border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Edit Payment Record
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              IMEI: {record.imei} • Month {record.monthNumber || 'N/A'}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="activation-date">Activation Date</Label>
                <Input
                  id="activation-date"
                  type="text"
                  value={record.activationDate}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="month">Month Number</Label>
                <Input
                  id="month"
                  type="text"
                  value={record.monthNumber || 'N/A'}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-type">Payment Type</Label>
              <Input
                id="payment-type"
                type="text"
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                placeholder="e.g., New Activation Bounty - Month 2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="payment-received"
                  checked={paymentReceived}
                  onCheckedChange={(checked) => setPaymentReceived(checked as boolean)}
                />
                <Label
                  htmlFor="payment-received"
                  className="text-sm font-medium cursor-pointer"
                >
                  Payment Received
                </Label>
              </div>

              {paymentReceived && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="payment-date">Payment Date</Label>
                  <Input
                    id="payment-date"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={onBack}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
