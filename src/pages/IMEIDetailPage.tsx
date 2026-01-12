import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { ArrowLeft, Smartphone, Calendar, DollarSign, Save, Plus, CheckCircle2 } from 'lucide-react';
import { useCommissionStore } from '../stores/commissionStore';
import { formatCurrency, formatDate, calculateExpectedPaymentDate } from '../lib/utils';
import { useToast } from '../hooks/use-toast';
import { cn } from '../lib/utils';

interface IMEIDetailPageProps {
  imei: string;
  onBack: () => void;
  onEdit: (recordId: string) => void;
}

export function IMEIDetailPage({ imei, onBack, onEdit }: IMEIDetailPageProps) {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const { toast } = useToast();
  const getRecordsByIMEI = useCommissionStore((state) => state.getRecordsByIMEI);
  const updateIMEINotes = useCommissionStore((state) => state.updateIMEINotes);
  const updateWithholdingResolved = useCommissionStore((state) => state.updateWithholdingResolved);
  const getIMEINotes = useCommissionStore((state) => state.getIMEINotes);
  const addMonthPayment = useCommissionStore((state) => state.addMonthPayment);
  const updateRecord = useCommissionStore((state) => state.updateRecord);
  
  const records = getRecordsByIMEI(imei);
  const imeiNotes = getIMEINotes(imei);
  
  const [notes, setNotes] = useState(imeiNotes?.notes || '');
  const [withholdingResolved, setWithholdingResolved] = useState(imeiNotes?.withholdingResolved || false);
  const [suspended, setSuspended] = useState(imeiNotes?.suspended || false);
  const [deactivated, setDeactivated] = useState(imeiNotes?.deactivated || false);
  const [blacklisted, setBlacklisted] = useState(imeiNotes?.blacklisted || false);
  const [byodSwap, setByodSwap] = useState(imeiNotes?.byodSwap || false);
  const [customerName, setCustomerName] = useState(imeiNotes?.customerName || '');
  const [customerNumber, setCustomerNumber] = useState(imeiNotes?.customerNumber || '');
  const [customerEmail, setCustomerEmail] = useState(imeiNotes?.customerEmail || '');
  
  // Month payment states (for manual entry)
  const [monthPayments, setMonthPayments] = useState<{ [key: number]: { amount: string; received: boolean; date: string } }>({});

  // Enforce mutual exclusivity for suspended and deactivated
  const handleSuspendedChange = (checked: boolean) => {
    setSuspended(checked);
    if (checked) {
      setDeactivated(false); // Uncheck deactivated when suspended is checked
    }
  };

  const handleDeactivatedChange = (checked: boolean) => {
    setDeactivated(checked);
    if (checked) {
      setSuspended(false); // Uncheck suspended when deactivated is checked
    }
  };

  // Helper functions
  const handleSaveNotes = () => {
    updateIMEINotes(
      imei,
      notes,
      suspended,
      deactivated,
      blacklisted,
      byodSwap,
      customerName,
      customerNumber,
      customerEmail
    );
    updateWithholdingResolved(imei, withholdingResolved);
    toast({
      title: 'Saved successfully',
      description: 'IMEI notes and status have been updated',
    });
  };

  const handleUpdateMonthPayment = (month: number, recordId: string, amount: number, received: boolean, date: string) => {
    updateRecord(recordId, {
      amount,
      paymentReceived: received,
      paymentDate: date,
    });
    
    toast({
      title: 'Payment updated',
      description: `Month ${month} payment has been updated`,
    });
  };

  const handleAddMonthPayment = (month: number) => {
    const monthData = monthPayments[month];
    if (!monthData || !monthData.amount) {
      toast({
        title: 'Missing information',
        description: 'Please enter an amount',
        variant: 'destructive',
      });
      return;
    }
    
    const amount = parseFloat(monthData.amount);
    if (isNaN(amount) || amount === 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }
    
    addMonthPayment(
      imei,
      month,
      amount,
      monthData.received,
      monthData.date || new Date().toISOString().split('T')[0]
    );
    
    // Clear the form
    setMonthPayments(prev => {
      const newState = { ...prev };
      delete newState[month];
      return newState;
    });
    
    toast({
      title: 'Payment added',
      description: `Month ${month} payment has been added`,
    });
  };

  // CONDITIONAL RETURN - AFTER ALL HOOKS
  if (records.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button variant="ghost" onClick={onBack} className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <p className="text-muted-foreground">No records found for this IMEI</p>
        </main>
      </div>
    );
  }

  // Data calculations
  const activationRecord = records.find(r => r.activationDate) || records[0];
  const totalEarned = records.filter(r => r.amount > 0).reduce((sum, r) => sum + r.amount, 0);
  const totalWithheld = Math.abs(records.filter(r => r.amount < 0).reduce((sum, r) => sum + r.amount, 0));
  const netAmount = totalEarned - totalWithheld;
  const hasWithholding = totalWithheld > 0;

  const renderMonthCard = (month: number) => {
    const expectedDate = calculateExpectedPaymentDate(activationRecord.activationDate, month);
    // Get ALL records for this month (including withholdings)
    const monthRecords = records.filter(r => r.monthNumber === month);
    const positivePayments = monthRecords.filter(r => r.amount > 0);
    const negativePayments = monthRecords.filter(r => r.amount < 0);
    const hasPayments = monthRecords.length > 0;
    const isEditing = monthPayments[month] !== undefined;
    
    const totalMonthEarned = positivePayments.reduce((sum, r) => sum + r.amount, 0);
    const totalMonthWithheld = Math.abs(negativePayments.reduce((sum, r) => sum + r.amount, 0));
    const netMonthAmount = totalMonthEarned - totalMonthWithheld;
    
    return (
      <Card key={month} className={cn(
        'border-2',
        hasPayments ? 'border-success/30 bg-success/5' : 'border-border'
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              Month {month}
              {hasPayments && <CheckCircle2 className="h-4 w-4 text-success" />}
            </CardTitle>
            {!hasPayments && !isEditing && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setMonthPayments(prev => ({
                  ...prev,
                  [month]: { amount: '', received: false, date: expectedDate }
                }))}
                className="h-7 gap-1"
              >
                <Plus className="h-3 w-3" />
                Add
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Expected: {formatDate(expectedDate)}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasPayments ? (
            <>
              {/* Payment Breakdown */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Payment Breakdown</Label>
                <div className="space-y-1.5">
                  {positivePayments.map((payment) => (
                    <div key={payment.id} className="bg-success/10 border border-success/20 rounded-md p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-success">{payment.paymentType}</span>
                        <span className="text-sm font-bold text-success">{formatCurrency(payment.amount)}</span>
                      </div>
                      {payment.paymentDescription && (
                        <div className="text-[10px] text-muted-foreground mb-1 line-clamp-1">
                          {payment.paymentDescription}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Paid: {formatDate(payment.paymentDate)}</span>
                        {payment.paymentReceived && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1 bg-success/10 text-success border-success/30">
                            Received
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {negativePayments.map((payment) => (
                    <div key={payment.id} className="bg-destructive/10 border border-destructive/20 rounded-md p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-destructive">{payment.paymentType}</span>
                        <span className="text-sm font-bold text-destructive">{formatCurrency(payment.amount)}</span>
                      </div>
                      {payment.adjustmentReason && (
                        <div className="text-[10px] text-destructive/80 mb-1 font-medium">
                          Reason: {payment.adjustmentReason}
                        </div>
                      )}
                      {payment.paymentDescription && (
                        <div className="text-[10px] text-muted-foreground mb-1 line-clamp-1">
                          {payment.paymentDescription}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {formatDate(payment.paymentDate)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Net Total */}
              <div className="border-t pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Net Amount</span>
                  <span className={cn(
                    "text-base font-bold",
                    netMonthAmount >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {formatCurrency(netMonthAmount)}
                  </span>
                </div>
              </div>
              
              {/* Add Another Payment Button */}
              {!isEditing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMonthPayments(prev => ({
                    ...prev,
                    [month]: { amount: '', received: false, date: new Date().toISOString().split('T')[0] }
                  }))}
                  className="w-full h-7 gap-1 text-xs"
                >
                  <Plus className="h-3 w-3" />
                  Add Another Payment
                </Button>
              )}
            </>
          ) : isEditing ? (
            <>
              <div className="space-y-2">
                <Label className="text-xs">Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={monthPayments[month].amount}
                  onChange={(e) => setMonthPayments(prev => ({
                    ...prev,
                    [month]: { ...prev[month], amount: e.target.value }
                  }))}
                  className="h-8"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Payment Date</Label>
                <Input
                  type="date"
                  value={monthPayments[month].date}
                  onChange={(e) => setMonthPayments(prev => ({
                    ...prev,
                    [month]: { ...prev[month], date: e.target.value }
                  }))}
                  className="h-8"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`new-received-${month}`}
                  checked={monthPayments[month].received}
                  onCheckedChange={(checked) => setMonthPayments(prev => ({
                    ...prev,
                    [month]: { ...prev[month], received: checked as boolean }
                  }))}
                />
                <Label htmlFor={`new-received-${month}`} className="text-xs cursor-pointer">
                  Payment Received
                </Label>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAddMonthPayment(month)}
                  className="h-7 text-xs flex-1"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setMonthPayments(prev => {
                    const newState = { ...prev };
                    delete newState[month];
                    return newState;
                  })}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              No payment recorded
            </p>
          )}
          
          {/* Show editing form when adding another payment to existing month */}
          {hasPayments && isEditing && (
            <div className="border-t pt-3 space-y-2">
              <Label className="text-xs font-semibold">Add New Payment</Label>
              <div className="space-y-2">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={monthPayments[month].amount}
                  onChange={(e) => setMonthPayments(prev => ({
                    ...prev,
                    [month]: { ...prev[month], amount: e.target.value }
                  }))}
                  className="h-8"
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="date"
                  value={monthPayments[month].date}
                  onChange={(e) => setMonthPayments(prev => ({
                    ...prev,
                    [month]: { ...prev[month], date: e.target.value }
                  }))}
                  className="h-8"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`add-received-${month}`}
                  checked={monthPayments[month].received}
                  onCheckedChange={(checked) => setMonthPayments(prev => ({
                    ...prev,
                    [month]: { ...prev[month], received: checked as boolean }
                  }))}
                />
                <Label htmlFor={`add-received-${month}`} className="text-xs cursor-pointer">
                  Payment Received
                </Label>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAddMonthPayment(month)}
                  className="h-7 text-xs flex-1"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setMonthPayments(prev => {
                    const newState = { ...prev };
                    delete newState[month];
                    return newState;
                  })}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={onBack} className="gap-2 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2 border-primary/20">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Smartphone className="h-6 w-6 text-primary" />
                    {imei}
                  </CardTitle>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Activated: {formatDate(activationRecord.activationDate)}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline">{activationRecord.saleType}</Badge>
                      {activationRecord.store && (
                        <Badge variant="outline">{activationRecord.store}</Badge>
                      )}
                      {suspended && <Badge variant="destructive">Suspended</Badge>}
                      {deactivated && <Badge variant="destructive">Deactivated</Badge>}
                      {blacklisted && <Badge variant="destructive">Blacklisted</Badge>}
                      {byodSwap && <Badge variant="outline">BYOD Swap</Badge>}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Commission Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Earned</span>
                <span className="font-bold text-success">{formatCurrency(totalEarned)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Withheld</span>
                <span className="font-bold text-destructive">
                  {totalWithheld > 0 ? `-${formatCurrency(totalWithheld)}` : '—'}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-semibold">Net Commission</span>
                <span className={`font-bold text-lg ${netAmount >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(netAmount)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Month Payment Cards */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Monthly Payments (1-6)</CardTitle>
            <p className="text-sm text-muted-foreground">
              Track and manage commission payments for each month
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(month => renderMonthCard(month))}
            </div>
          </CardContent>
        </Card>

        {/* Withholding Section */}
        {hasWithholding && (
          <Card className="mb-6 border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive">Withholding / Clawback</CardTitle>
              <p className="text-sm text-muted-foreground">
                Total withheld: {formatCurrency(totalWithheld)}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="withholding-resolved"
                  checked={withholdingResolved}
                  onCheckedChange={(checked) => setWithholdingResolved(checked as boolean)}
                />
                <Label htmlFor="withholding-resolved" className="cursor-pointer">
                  Mark as Resolved (removes from alerts)
                </Label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status & Notes Section */}
        <Card>
          <CardHeader>
            <CardTitle>Status & Notes</CardTitle>
            <p className="text-sm text-muted-foreground">
              Update IMEI status, customer information, and notes
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Checkboxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="imei-suspended" 
                  checked={suspended} 
                  onCheckedChange={handleSuspendedChange} 
                />
                <Label htmlFor="imei-suspended" className="cursor-pointer font-semibold">Suspended</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="imei-deactivated" 
                  checked={deactivated} 
                  onCheckedChange={handleDeactivatedChange} 
                />
                <Label htmlFor="imei-deactivated" className="cursor-pointer font-semibold">Deactivated</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="imei-blacklisted" 
                  checked={blacklisted} 
                  onCheckedChange={(checked) => setBlacklisted(!!checked)} 
                />
                <Label htmlFor="imei-blacklisted" className="cursor-pointer font-semibold">Blacklist</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="imei-byod" 
                  checked={byodSwap} 
                  onCheckedChange={(checked) => setByodSwap(!!checked)} 
                />
                <Label htmlFor="imei-byod" className="cursor-pointer font-semibold">BYOD SWAP</Label>
              </div>
            </div>

            {/* Customer Information (shown if suspended, deactivated, or blacklisted) */}
            {(suspended || deactivated || blacklisted) && (
              <div className="border-t pt-4 space-y-3">
                <Label className="text-sm font-semibold">Customer Information</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Customer Name</Label>
                    <Input
                      type="text"
                      placeholder="Full name"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Customer Number</Label>
                    <Input
                      type="tel"
                      placeholder="Phone number"
                      value={customerNumber}
                      onChange={e => setCustomerNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Customer Email</Label>
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notes Section */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Enter notes here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <Button onClick={handleSaveNotes} className="gap-2">
              <Save className="h-4 w-4" />
              Save All Changes
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
