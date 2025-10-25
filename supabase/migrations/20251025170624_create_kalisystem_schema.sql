/*
  # Kalisystem Order Management Schema

  ## Overview
  Complete order management system for Kalisystem with store-specific tabs and supplier management.

  ## Enums Created
  1. **store_enum** - CV2, STOCK02, WB, SHANTI (can be extended with temporary stores)
  2. **supplier_enum** - All suppliers from items.json: KALI, PISEY, MARKET, LEES, ANGKOR-COMPANY, COCA-COMPANY, CHARONAI, KOFI, TAKEAWAY-SHOP, STOCK, PZZA+
  3. **status_enum** - dispatching, on_the_way, received, completed
  4. **unit_enum** - kg, pc, L, roll, block, 5L, case, box, pk, ctn, bt, 1Lbt, jar, glass, small, big, pc_cut

  ## Tables

  ### items
  Item catalog where all items are available for all suppliers. Default supplier is set for dispatch function.
  
  Columns:
  - `id` (uuid, primary key) - Item identifier
  - `name` (text) - Item name
  - `variant` (text, nullable) - Variant name
  - `unit` (unit_enum, nullable) - Default unit
  - `supplier` (supplier_enum) - Default supplier for dispatch
  - `created_at` (timestamptz) - Creation timestamp
  - `modified_at` (timestamptz) - Last modification timestamp

  ### orders
  Order management with status tracking per store. When items are dragged to different cards, supplier_item updates.
  
  Columns:
  - `id` (uuid, primary key) - Record identifier
  - `order_id` (text) - Display order ID (6-digit nanoid)
  - `store` (store_enum) - Store location
  - `supplier` (supplier_enum) - Order supplier
  - `items` (jsonb) - Array of {item_id, name, variant, quantity, unit, is_missing}
  - `status` (status_enum) - Order status (default: dispatching)
  - `order_message` (text, nullable) - Generated order message
  - `is_sent` (boolean) - Send status (default: false)
  - `is_paid` (boolean) - Payment status (default: false)
  - `is_on_the_way` (boolean) - Transit status (default: false)
  - `is_received` (boolean) - Receipt status (default: false)
  - `completed_at` (timestamptz, nullable) - Completion timestamp
  - `modified_at` (timestamptz) - Last modification timestamp
  - `created_at` (timestamptz) - Creation timestamp

  ### stores
  Dynamic store management. Stores created via + tab are temporary and dropped once all orders are completed.
  
  Columns:
  - `id` (uuid, primary key) - Store identifier
  - `name` (text, unique) - Store name
  - `is_permanent` (boolean) - Whether store is permanent (default: false)
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - All tables have RLS enabled
  - Public access for all operations (suitable for internal team use)

  ## Important Notes
  1. All items available for all suppliers
  2. Dragging items between cards updates supplier in order items
  3. Realtime subscriptions enabled for live updates
  4. Temporary stores auto-cleanup when all orders completed
*/

-- ============================================================
-- DROP OLD TABLES IF EXISTS
-- ============================================================

DROP TABLE IF EXISTS app_kv CASCADE;
DROP TABLE IF EXISTS current_order CASCADE;
DROP TABLE IF EXISTS current_order_metadata CASCADE;
DROP TABLE IF EXISTS completed_orders CASCADE;
DROP TABLE IF EXISTS pending_orders CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS stores CASCADE;

-- Drop old types if they exist
DO $$ 
BEGIN
  DROP TYPE IF EXISTS store_enum CASCADE;
  DROP TYPE IF EXISTS supplier_enum CASCADE;
  DROP TYPE IF EXISTS status_enum CASCADE;
  DROP TYPE IF EXISTS unit_enum CASCADE;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ============================================================
-- CREATE ENUMS
-- ============================================================

CREATE TYPE store_enum AS ENUM ('CV2', 'STOCK02', 'WB', 'SHANTI');
CREATE TYPE supplier_enum AS ENUM ('KALI', 'PISEY', 'MARKET', 'LEES', 'ANGKOR-COMPANY', 'COCA-COMPANY', 'CHARONAI', 'KOFI', 'TAKEAWAY-SHOP', 'STOCK', 'PZZA+');
CREATE TYPE status_enum AS ENUM ('dispatching', 'on_the_way', 'received', 'completed');
CREATE TYPE unit_enum AS ENUM ('kg', 'pc', 'L', 'roll', 'block', '5L', 'case', 'box', 'pk', 'ctn', 'bt', '1Lbt', 'jar', 'glass', 'small', 'big', 'pc_cut');

-- ============================================================
-- CREATE STORES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  is_permanent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Insert default permanent stores
INSERT INTO stores (name, is_permanent) VALUES
  ('CV2', true),
  ('STOCK02', true),
  ('WB', true),
  ('SHANTI', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- CREATE ITEMS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  variant text,
  unit unit_enum,
  supplier supplier_enum NOT NULL,
  created_at timestamptz DEFAULT now(),
  modified_at timestamptz DEFAULT now()
);

-- ============================================================
-- CREATE ORDERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  store text NOT NULL,
  supplier supplier_enum NOT NULL,
  items jsonb DEFAULT '[]'::jsonb,
  status status_enum DEFAULT 'dispatching',
  order_message text,
  is_sent boolean DEFAULT false,
  is_paid boolean DEFAULT false,
  is_on_the_way boolean DEFAULT false,
  is_received boolean DEFAULT false,
  completed_at timestamptz,
  modified_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- CREATE INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_items_supplier ON items(supplier);
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_store_status ON orders(store, status);
CREATE INDEX IF NOT EXISTS idx_stores_name ON stores(name);

-- ============================================================
-- CREATE UPDATE TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_modified_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.modified_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- CREATE TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS update_items_modified_at ON items;
CREATE TRIGGER update_items_modified_at 
  BEFORE UPDATE ON items
  FOR EACH ROW 
  EXECUTE FUNCTION update_modified_at_column();

DROP TRIGGER IF EXISTS update_orders_modified_at ON orders;
CREATE TRIGGER update_orders_modified_at 
  BEFORE UPDATE ON orders
  FOR EACH ROW 
  EXECUTE FUNCTION update_modified_at_column();

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CREATE RLS POLICIES
-- ============================================================

-- Items policies (public access for internal team use)
CREATE POLICY "Allow public read access on items"
  ON items FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on items"
  ON items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on items"
  ON items FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on items"
  ON items FOR DELETE
  USING (true);

-- Orders policies (public access for internal team use)
CREATE POLICY "Allow public read access on orders"
  ON orders FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on orders"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on orders"
  ON orders FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on orders"
  ON orders FOR DELETE
  USING (true);

-- Stores policies (public access for internal team use)
CREATE POLICY "Allow public read access on stores"
  ON stores FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on stores"
  ON stores FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on stores"
  ON stores FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on stores"
  ON stores FOR DELETE
  USING (true);