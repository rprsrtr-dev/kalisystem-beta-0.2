import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Unit, UNITS } from '@/types';

interface QuantitySelectorProps {
  quantity: number;
  unit?: Unit | null;
  onUpdate: (quantity: number, unit?: Unit) => void;
  disabled?: boolean;
}

export function QuantitySelector({
  quantity,
  unit,
  onUpdate,
  disabled = false,
}: QuantitySelectorProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [tempValue, setTempValue] = useState(quantity.toString());
  const [selectedUnit, setSelectedUnit] = useState<Unit | undefined>(unit || undefined);

  const handleNumberClick = (num: string) => {
    if (num === '.' && tempValue.includes('.')) return;
    setTempValue(tempValue === '0' ? num : tempValue + num);
  };

  const handleBackspace = () => {
    setTempValue(tempValue.length > 1 ? tempValue.slice(0, -1) : '0');
  };

  const handleClear = () => {
    setTempValue('0');
  };

  const handleConfirm = () => {
    const newQty = parseFloat(tempValue) || 0;
    onUpdate(newQty, selectedUnit);
    setShowDialog(false);
  };

  const handleOpen = () => {
    if (!disabled) {
      setTempValue(quantity.toString());
      setSelectedUnit(unit || undefined);
      setShowDialog(true);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpen}
        disabled={disabled}
        className="font-mono"
      >
        {quantity} {unit || ''}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Quantity</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-3xl font-mono text-center p-4 bg-muted rounded">
              {tempValue}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'C'].map((key) => (
                <Button
                  key={key}
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    if (key === 'C') handleClear();
                    else handleNumberClick(key);
                  }}
                  className="text-xl"
                >
                  {key}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBackspace} className="flex-1">
                ← Back
              </Button>
              <Button onClick={handleConfirm} className="flex-1">
                OK
              </Button>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">Unit</p>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {UNITS.map((u) => (
                  <Button
                    key={u}
                    variant={selectedUnit === u ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedUnit(u)}
                  >
                    {u}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
