import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ParsedItem } from './BulkOrder';

interface PasteAndParseCardProps {
  rawText: string;
  setRawText: (text: string) => void;
  onCleanAndParse: () => void;
  onDispatch: () => void;
}

export function PasteAndParseCard({
  rawText,
  setRawText,
  onCleanAndParse,
  onDispatch,
}: PasteAndParseCardProps) {

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paste Your Order</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Paste your order list here..."
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          className="min-h-[200px] font-mono text-sm"
          data-testid="textarea-raw-text"
        />

        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={onCleanAndParse}
            disabled={!rawText.trim()}
            data-testid="button-clean-parse"
          >
            Clean & Parse
          </Button>
          <Button
            onClick={onDispatch}
            disabled={!rawText.trim()}
            variant="secondary"
            data-testid="button-dispatch"
          >
            Dispatch
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
