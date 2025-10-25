import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { STORE_TAGS, StoreTag } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { PendingOrderItem } from '@/types';
import { Button } from '@/components/ui/button';  
import { Badge } from '@/components/ui/badge';
import { GripVertical } from 'lucide-react';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { DndContext, DragOverlay, closestCorners, DragEndEvent, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Item } from '@/types';
import { AddItemModal } from '@/components/AddItemModal';
import { PasteAndParseCard } from '@/pages/PasteAndParseCard';
import { KanbanHeader } from '@/pages/KanbanHeader';
import { SupplierDispatchCard } from '@/pages/SupplierDispatchCard';
import { useItemManagement } from '@/hooks/use-item-management';

export interface ParsedItem {
  id: string;
  rawText: string;
  name: string;
  quantity: number;
  matchedItem?: Item;
  supplier?: string;
  category?: string;
}

interface SupplierCard {
  id: string;
  supplier: string;
  items: ParsedItem[];
}

export default function BulkOrder() {
  const navigate = useNavigate();
  // Store selection dialog state
  const [storeDialogOpen, setStoreDialogOpen] = useState(false);
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false);
  const [storeSelectCardId, setStoreSelectCardId] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<StoreTag | null>(null);
  const { items, suppliers, addToOrder, addPendingOrder } = useApp();
  const { handleAddItem, handleAddSupplier } = useItemManagement();
  const [showFullText, setShowFullText] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [supplierCards, setSupplierCards] = useState<SupplierCard[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [collapsedCards, setCollapsedCards] = useState<Set<string>>(new Set());

  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [rawText, setRawText] = useState('');
  const [selectedCardForAddItem, setSelectedCardForAddItem] = useState<string | null>(null);
  const [showPasteSection, setShowPasteSection] = useState(true);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleCleanAndParse = () => {
    setTimeout(() => {
      // The rawText is updated by the onPaste, so we can just parse
      setTimeout(() => {
        parseAndMatch();
      }, 100);
    }, 100);
  };

  const UNITS = ['kg', 'g', 'l', 'ml', 'pc', 'pcs', 'can', 'cans', 'bt', 'bottle', 'bottles', 'pk', 'pack', 'packs', 'jar', 'jars', 'bag', 'bags', 'small', 'big', 'lb', 'lbs', 'oz'];

  const normalizeName = (name: string): string => {
    let normalized = name.toLowerCase().trim();
    UNITS.forEach(unit => {
      normalized = normalized.replace(new RegExp(`\\b${unit}\\b`, 'gi'), '');
    });
    // Remove common stopwords
    const stopwords = ['for', 'of', 'the', 'a', 'an', 'and', 'to'];
    stopwords.forEach(word => {
      normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
    });
    normalized = normalized.replace(/[^\w\s-]/g, '');
    normalized = normalized.replace(/s\b/g, ''); // remove plural 's' at end
    normalized = normalized.replace(/\s+|-/g, ' ').trim(); // keep as words for overlap
    return normalized;
  };

  const fuzzyMatch = (searchName: string, catalogItems: Item[]): Item | undefined => {
    const normalizedSearch = normalizeName(searchName);

    // 1. Exact match
    const exactMatch = catalogItems.find(
      item => normalizeName(item.name) === normalizedSearch
    );
    if (exactMatch) return exactMatch;

    // 2. Word overlap match (all words in search in item, or vice versa)
    const searchWords = normalizedSearch.split(' ').filter(Boolean);
    const overlapMatch = catalogItems.find(item => {
      const itemWords = normalizeName(item.name).split(' ').filter(Boolean);
      // All search words in item OR all item words in search
      return (
        searchWords.every(w => itemWords.includes(w)) ||
        itemWords.every(w => searchWords.includes(w))
      );
    });
    if (overlapMatch) return overlapMatch;

    // 3. Substring match (either direction)
    const substringMatch = catalogItems.find(item => {
      const normalizedItem = normalizeName(item.name).replace(/\s+/g, '');
      return (
        normalizedItem.includes(normalizedSearch.replace(/\s+/g, '')) ||
        normalizedSearch.replace(/\s+/g, '').includes(normalizedItem)
      );
    });
    if (substringMatch) return substringMatch;

    // 4. Levenshtein distance (lower threshold)
    const levenshteinDistance = (a: string, b: string): number => {
      const matrix: number[][] = [];
      for (let i = 0; i <= b.length; i++) matrix[i] = [i];
      for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }
      return matrix[b.length][a.length];
    };

    let bestMatch: Item | undefined;
    let bestScore = 0;
    catalogItems.forEach(item => {
      const normalizedItem = normalizeName(item.name).replace(/\s+/g, '');
      const maxLen = Math.max(normalizedSearch.replace(/\s+/g, '').length, normalizedItem.length);
      if (maxLen === 0) return;
      const distance = levenshteinDistance(normalizedSearch.replace(/\s+/g, ''), normalizedItem);
      const similarity = 1 - distance / maxLen;
      if (similarity > bestScore && similarity >= 0.5) {
        bestScore = similarity;
        bestMatch = item;
      }
    });

    // If no match, try removing the last word and match again (for trailing descriptors)
    if (!bestMatch && searchWords.length > 2) {
      const trimmed = searchWords.slice(0, -1).join(' ');
      return fuzzyMatch(trimmed, catalogItems);
    }
    return bestMatch;
  };

  const cleanText = () => {
    if (!rawText.trim()) {
      toast.error('No text to clean');
      return;
    }
    
    const cleaned = rawText
      .split('\n')
      .map(line => {
        let cleaned = line.trim();
        cleaned = cleaned.replace(/^[-•*●○■□▪▫⦿⦾]\s*/g, '');
        cleaned = cleaned.replace(/^\d+[.)-]\s*/g, '');
        cleaned = cleaned.replace(/^\[[ x]\]\s*/gi, '');
        
        UNITS.forEach(unit => {
          cleaned = cleaned.replace(new RegExp(`\\b${unit}\\b`, 'gi'), '');
        });
        
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
        return cleaned;
      })
      .filter(line => line.length > 0)
      .join('\n');
    
    setRawText(cleaned);
    toast.success('Text cleaned!');
  };

  const parseAndMatch = () => {
    if (!rawText.trim()) {
      toast.error('No text to parse');
      return;
    }
    
    const lines = rawText.split('\n').filter(line => line.trim().length > 0);
    const parsed: ParsedItem[] = [];
    let isStaffFoodSection = false;
    
    const isKhmerText = (text: string) => {
      return /[\u1780-\u17FF]/.test(text);
    };
    
    const isStaffFoodMarker = (text: string) => {
      const lowerText = text.toLowerCase();
      return lowerText.includes('staff food') ||
             lowerText.includes('food staff') ||
             lowerText.includes('food for staff');
    };

    lines.forEach((line, idx) => {
      const text = line.trim();

      if (isStaffFoodMarker(text)) {
        isStaffFoodSection = true;
        return;
      }

      let quantity = 1;
      let name = text;
      let category: string | undefined;
      let supplier: string | undefined;

      // Try different quantity formats in order of specificity
      
      // Format 1: Number with unit directly attached (e.g., "Egg30pcs", "Potato5kg")
      const attachedNumUnit = name.match(/^(.*?)(\d+\.?\d*)([a-zA-Z]*)$/);
      
      // Format 2: Number with optional unit separated by space (e.g., "Egg 30 pcs", "Potato 5 kg")
      const spaceNumUnit = name.match(/^(.*?)\s+(\d+\.?\d*)(?:\s*([a-zA-Z]+))?$/);
      
      // Format 3: Leading number with optional unit (e.g., "30 pcs Egg", "5 kg Potato")
      const leadingNumUnit = text.match(/^(\d+\.?\d*)(?:\s*([a-zA-Z]+))?\s+(.+)$/);

      if (attachedNumUnit) {
        name = attachedNumUnit[1].replace(/\s+$/,'');
        quantity = parseFloat(attachedNumUnit[2]);
        const unit = attachedNumUnit[3];
        if (unit) {
          // Remove unit from name if it's a known unit
          UNITS.forEach(u => {
            if (unit.toLowerCase().includes(u.toLowerCase())) {
              name = name.replace(new RegExp(`\\b${u}\\b`, 'gi'), '');
            }
          });
        }
      } else if (spaceNumUnit) {
        name = spaceNumUnit[1].replace(/\s+$/,'');
        quantity = parseFloat(spaceNumUnit[2]);
        const unit = spaceNumUnit[3];
        if (unit) {
          // Remove unit from name if it's a known unit
          UNITS.forEach(u => {
            if (unit.toLowerCase().includes(u.toLowerCase())) {
              name = name.replace(new RegExp(`\\b${u}\\b`, 'gi'), '');
            }
          });
        }
      } else if (leadingNumUnit) {
        name = leadingNumUnit[3];
        quantity = parseFloat(leadingNumUnit[1]);
        const unit = leadingNumUnit[2];
        if (unit) {
          // Remove unit from name if it's a known unit
          UNITS.forEach(u => {
            if (unit.toLowerCase().includes(u.toLowerCase())) {
              name = name.replace(new RegExp(`\\b${u}\\b`, 'gi'), '');
            }
          });
        }
      }

      // Clean up any remaining units from the name
      UNITS.forEach(unit => {
        name = name.replace(new RegExp(`\\b${unit}\\b`, 'gi'), '');
      });
      
      // Clean up multiple spaces and trim
      name = name.replace(/\s+/g, ' ').trim();
      
      // Ensure quantity is valid
      if (isNaN(quantity) || quantity <= 0) {
        quantity = 1;
      }

      const matchedItem = fuzzyMatch(name, items);

      if (isStaffFoodSection && isKhmerText(name) && !matchedItem) {
        category = 'Staff Food';
        supplier = 'Pisey';
      }

      const titleCaseName = matchedItem?.name || name;
      const finalQuantity = matchedItem ? quantity : quantity;

      parsed.push({
        id: `parsed-${idx}-${Date.now()}-${Math.random()}`,
        rawText: line,
        name: titleCaseName,
        quantity: finalQuantity,
        matchedItem: matchedItem,
        supplier: matchedItem?.supplier || supplier,
        category: matchedItem?.category || category,
      });
    });

    setParsedItems(parsed);

    const matched = parsed.filter(p => p.matchedItem);
    const newItems = parsed.filter(p => !p.matchedItem);
    const supplierGroups = new Set(matched.map(p => p.supplier).filter(Boolean));

    toast.success(
      `Found ${matched.length} items from ${supplierGroups.size} supplier${supplierGroups.size !== 1 ? 's' : ''} and ${newItems.length} new item${newItems.length !== 1 ? 's' : ''}`
    );
  };

  const dispatch = () => {
    if (parsedItems.length === 0) {
      toast.error('No items to dispatch');
      return;
    }

    // Group by supplier
    const groups: Record<string, ParsedItem[]> = {};
    const unsorted: ParsedItem[] = [];

    parsedItems.forEach(item => {
      if (item.supplier) {
        if (!groups[item.supplier]) {
          groups[item.supplier] = [];
        }
        groups[item.supplier].push(item);
      } else {
        unsorted.push(item);
      }
    });

    // Create cards
    const cards: SupplierCard[] = Object.entries(groups).map(([supplier, items]) => ({
      id: `supplier-${supplier}-${Date.now()}`,
      supplier,
      items,
    }));

    // Add unsorted card if there are new items
    if (unsorted.length > 0) {
      cards.push({
        id: `unsorted-${Date.now()}`,
        supplier: 'New Items',
        items: unsorted,
      });
    }

    setSupplierCards(cards);
    setShowPasteSection(false);
    toast.success(`Created ${cards.length} supplier cards`);
  };

  const [newCardIds, setNewCardIds] = useState<Set<string>>(new Set());

  const addSupplierCard = () => {
    const newCard: SupplierCard = {
      id: `supplier-new-${Date.now()}`,
      supplier: 'New Supplier',
      items: [],
    };
    setSupplierCards([...supplierCards, newCard]);
    setNewCardIds(prev => new Set([...prev, newCard.id]));
  };

  const removeCard = (cardId: string) => {
    setSupplierCards(supplierCards.filter(c => c.id !== cardId));
  };

  const updateCardSupplier = (cardId: string, supplier: string) => {
    // If this is a new supplier, add it
    if (!suppliers.some(s => s.name === supplier)) {
      handleAddSupplier({ name: supplier });
    }
    
    setSupplierCards(
      supplierCards.map(c => c.id === cardId ? { ...c, supplier } : c)
    );
  };

  const removeItemFromCard = (cardId: string, itemId: string) => {
    setSupplierCards(
      supplierCards.map(c => 
        c.id === cardId 
          ? { ...c, items: c.items.filter(i => i.id !== itemId) }
          : c
      )
    );
  };

  const updateItemQuantity = (cardId: string, itemId: string, quantity: number) => {
    setSupplierCards(
      supplierCards.map(c => 
        c.id === cardId 
          ? { 
              ...c, 
              items: c.items.map(i => i.id === itemId ? { ...i, quantity } : i) 
            }
          : c
      )
    );
  };

  const addItemToCard = (cardId: string, item: Item) => {
    const newParsedItem: ParsedItem = {
      id: nanoid(),
      rawText: item.name,
      name: item.name,
      quantity: 1,
      matchedItem: item,
      supplier: item.supplier,
      category: item.category,
    };

    setSupplierCards(
      supplierCards.map(c => 
        c.id === cardId 
          ? { ...c, items: [...c.items, newParsedItem] }
          : c
      )
    );

    toast.success(`Added ${item.name} to card`);
  };

  // Open store selection dialog for this card
  const moveCardToOrder = (cardId: string) => {
    const card = supplierCards.find(c => c.id === cardId);
    if (card && card.supplier === 'New Items') {
      toast.error('Cannot send new items card to order. Please assign items to a supplier first.');
      return;
    }
    setStoreSelectCardId(cardId);
    setStoreDialogOpen(true);
  };

  // Confirm store selection and add items to order
  const handleStoreSelectConfirm = () => {
    if (!storeSelectCardId || !selectedStore) return;
    const card = supplierCards.find(c => c.id === storeSelectCardId);
    if (!card || card.items.length === 0) {
      toast.error('No items in card to add to order');
      setStoreDialogOpen(false);
      return;
    }
    if (card.supplier === 'New Items') {
      toast.error('Cannot send new items card to order');
      setStoreDialogOpen(false);
      return;
    }
    let addedCount = 0;
    card.items.forEach(item => {
      if (item.matchedItem) {
        addToOrder(item.matchedItem, item.quantity, selectedStore);
        addedCount++;
      }
    });
    if (addedCount > 0) {
      toast.success(`Added ${addedCount} items to order for store ${selectedStore}`);
      removeCard(card.id);
    }
    setStoreDialogOpen(false);
    setStoreSelectCardId(null);
    setSelectedStore(null);
  };

  const handleSetStoreTag = (cardId: string, tag: string) => {
    const card = supplierCards.find(c => c.id === cardId);
    if (card) {
      updateCardSupplier(cardId, tag);
      toast.success(`Set supplier to "${tag}" for card "${card.supplier}"`);
    }
  };

  const openAddItemModal = (cardId: string) => {
    setSelectedCardForAddItem(cardId);
    setAddItemModalOpen(true);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    // Find which card the item is being dragged from
    const fromCard = supplierCards.find(card => 
      card.items.some(item => item.id === active.id)
    );

    if (!fromCard) return;

    const draggedItem = fromCard.items.find(i => i.id === active.id);
    if (!draggedItem) return;

    // Find which card it's being dragged to
    // First check if over.id is a card id
    let toCard = supplierCards.find(card => card.id === over.id);
    
    // If not, check if over.id is an item id and find its parent card
    if (!toCard) {
      toCard = supplierCards.find(card => 
        card.items.some(item => item.id === over.id)
      );
    }

    if (!toCard) return;

    // If dragging to a different card
    if (fromCard.id !== toCard.id) {
      // Update the item's supplier if moving to a named supplier
      const updatedItem = {
        ...draggedItem,
        supplier: toCard.supplier !== 'New Items' ? toCard.supplier : undefined,
      };

      // Create the item in the base if it's not already there and we have a valid supplier
      if (!draggedItem.matchedItem && toCard.supplier !== 'New Items') {
        handleAddItem({
          name: draggedItem.name,
          supplier: toCard.supplier,
          category: draggedItem.category || 'New Item'
        }, undefined, draggedItem.id);
      }

      setSupplierCards(
        supplierCards.map(card => {
          if (card.id === fromCard.id) {
            return { ...card, items: card.items.filter(i => i.id !== draggedItem.id) };
          }
          if (card.id === toCard.id) {
            return { ...card, items: [...card.items, updatedItem] };
          }
          return card;
        })
      );

      toast.success(`Moved to ${toCard.supplier}`);
    } else {
      // Reordering within the same card
      const oldIndex = fromCard.items.findIndex(i => i.id === active.id);
      const newIndex = fromCard.items.findIndex(i => i.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedItems = [...fromCard.items];
        const [movedItem] = reorderedItems.splice(oldIndex, 1);
        reorderedItems.splice(newIndex, 0, movedItem);
        
        setSupplierCards(
          supplierCards.map(card => 
            card.id === fromCard.id ? { ...card, items: reorderedItems } : card
          )
        );
      }
    }
  };

  const finalizeOrder = () => {
    if (supplierCards.length === 0) {
      toast.error('No supplier cards to approve');
      return;
    }

    // Prompt for store selection
    setFinalizeDialogOpen(true);
  };

  const handleFinalizeConfirm = () => {
    if (!selectedStore) {
      toast.error('Please select a store');
      return;
    }

    // Convert each supplier card into a pending order (sends to admin/order portal)
    const cards = [...supplierCards];
    cards.forEach(card => saveCardAsPendingOrder(card.id, selectedStore));

    // Clear remaining UI state
    setSupplierCards([]);
    setParsedItems([]);
    setRawText('');
    setFinalizeDialogOpen(false);
    setSelectedStore(null);

    // Navigate to order page pending tab
    navigate('/order');
  };

  const clearDispatch = () => {
    setSupplierCards([]);
    setParsedItems([]);
    setRawText('');
    setShowPasteSection(true);
    toast.success('Dispatch cleared');
  };

  const saveCardAsPendingOrder = (cardId: string, storeTag?: StoreTag) => {
    const card = supplierCards.find(c => c.id === cardId);
    if (!card || card.items.length === 0) return;

    const pendingItems: PendingOrderItem[] = [];
    let newItemsConfirmed = 0;
    let staffFoodItems = 0;

    card.items.forEach(item => {
      if (item.matchedItem) {
        pendingItems.push({
          item: item.matchedItem,
          quantity: item.quantity,
          isNewItem: false
        });
      } else {
        const newItemId = nanoid();
        const itemCategory = item.category || 'New Item';
        const itemSupplier = item.supplier || card.supplier;

        if (itemCategory === 'Staff Food') {
          staffFoodItems++;
        }

        handleAddItem({
          name: item.name,
          category: itemCategory,
          supplier: itemSupplier
        }, undefined, newItemId);
        pendingItems.push({
          item: { 
            name: item.name,
            category: itemCategory,
            supplier: itemSupplier,
            id: newItemId,
            tags: []
          },
          quantity: item.quantity,
          isNewItem: true
        });
        newItemsConfirmed++;
      }
    });

    // Get supplier defaults
    const supplier = suppliers.find(s => s.name === card.supplier);
    const defaultPaymentMethod = supplier?.defaultPaymentMethod;
    const defaultOrderType = supplier?.defaultOrderType;

    addPendingOrder({
      supplier: card.supplier,
      items: pendingItems,
      status: 'pending',
      storeTag: storeTag,
      paymentMethod: defaultPaymentMethod,
      orderType: defaultOrderType,
    });

    let message = `Saved order for ${card.supplier}`;
    if (newItemsConfirmed > 0) {
      message += ` (${newItemsConfirmed} new items confirmed`;
      if (staffFoodItems > 0) {
        message += `, ${staffFoodItems} staff food items`;
      }
      message += ')';
    }
    toast.success(message);
    
    removeCard(cardId);
  };

  const activeItem = supplierCards
    .flatMap(c => c.items)
    .find(i => i.id === activeId);

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="px-4 pt-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full p-2 bg-accent hover:bg-accent/80 active:bg-accent/60 text-accent-foreground transition-colors"
              onClick={() => navigate(-1)}
              aria-label="Back"
              data-testid="button-back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </Button>
            <h1 className="text-3xl font-bold">Dispatch</h1>
          </div>
        {/* Store selection dialog */}
        <Dialog open={storeDialogOpen} onOpenChange={(isOpen) => {
          setStoreDialogOpen(isOpen);
          if (!isOpen) {
            setStoreSelectCardId(null);
            setSelectedStore(null);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Store for Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Store</label>
                <Select value={selectedStore || ''} onValueChange={v => setSelectedStore(v as StoreTag)}>
                  <SelectTrigger data-testid="select-store-dialog">
                    <SelectValue placeholder="Select a store" />
                  </SelectTrigger>
                  <SelectContent>
                    {STORE_TAGS.map(tag => (
                      <SelectItem key={tag} value={tag}>{tag.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setStoreDialogOpen(false)} variant="outline">Cancel</Button>
              <Button onClick={handleStoreSelectConfirm} disabled={!selectedStore}>Add to Order</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Finalize dispatch dialog */}
        <Dialog open={finalizeDialogOpen} onOpenChange={setFinalizeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Store for Dispatch</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Store</label>
                <Select value={selectedStore || ''} onValueChange={v => setSelectedStore(v as StoreTag)}>
                  <SelectTrigger data-testid="select-store-finalize">
                    <SelectValue placeholder="Select a store" />
                  </SelectTrigger>
                  <SelectContent>
                    {STORE_TAGS.map(tag => (
                      <SelectItem key={tag} value={tag}>{tag.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setFinalizeDialogOpen(false)} variant="outline">Cancel</Button>
              <Button onClick={handleFinalizeConfirm} disabled={!selectedStore}>Approve Dispatch</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {showPasteSection && (
          <PasteAndParseCard
            rawText={rawText}
            setRawText={setRawText}
            onCleanAndParse={handleCleanAndParse}
            onDispatch={dispatch}
          />
        )}

        {/* Kanban Board */}
        {supplierCards.length > 0 && (
          <>
            <KanbanHeader
              onAddCard={addSupplierCard}
              onApproveDispatch={finalizeOrder}
              onClearDispatch={clearDispatch}
            />

            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-min">
                {supplierCards.map(card => {
                  const isCollapsed = collapsedCards.has(card.id);
                  const toggleCollapse = () => {
                    setCollapsedCards(prev => {
                      const next = new Set(prev);
                      if (isCollapsed) {
                        next.delete(card.id);
                      } else {
                        next.add(card.id);
                      }
                      return next;
                    });
                  };

                  return (
                    <SupplierDispatchCard
                      key={card.id}
                      card={card}
                      isCollapsed={isCollapsed}
                      onToggleCollapse={toggleCollapse}
                      onMoveToOrder={moveCardToOrder}
                      onOpenAddItem={openAddItemModal}
                      onRemove={removeCard}
                      onRemoveItem={removeItemFromCard}
                      onUpdateQuantity={updateItemQuantity}
                      onUpdateSupplier={updateCardSupplier}
                      isNewCard={newCardIds.has(card.id)}
                    />
                  );
                })}
              </div>

              <DragOverlay>
                {activeItem ? (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-lg border border-border shadow-lg">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium text-sm">
                      {activeItem.name}
                    </p>
                    <Badge variant="secondary" className="ml-auto">
                      {activeItem.quantity}
                    </Badge>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>

            <AddItemModal
              open={addItemModalOpen}
              onOpenChange={setAddItemModalOpen}
              supplier={selectedCardForAddItem ? supplierCards.find(c => c.id === selectedCardForAddItem)?.supplier || '' : ''}
              items={items}
              onAddItem={(item) => {
                if (selectedCardForAddItem) {
                  addItemToCard(selectedCardForAddItem, item);
                  setAddItemModalOpen(false);
                }
              }}
              onCreateNewItem={(name) => {
                const selectedCard = supplierCards.find(c => c.id === selectedCardForAddItem);
                const supplier = selectedCard?.supplier || '';
                handleAddItem({
                  name,
                  category: 'New Item',
                  supplier: supplier !== 'New Items' ? supplier : ''
                }, undefined);
              }}
            />
          </>
        )}
        </div>
      </div>
    </div>
  );
}
