/*
  # Kalisystem Order Management Schema with Order Count

  ## Overview
  Complete order management system for Kalisystem with store-specific tabs and supplier management.

  ## Enums Created
  1. **store_enum** - CV2, STOCK02, WB, SHANTI
  2. **supplier_enum** - KALI, PISEY, MARKET, LEES, ANGKOR-COMPANY, COCA-COMPANY, CHARONAI, KOFI, TAKEAWAY-SHOP, STOCK, PZZA+
  3. **status_enum** - dispatching, on_the_way, received, completed
  4. **unit_enum** - kg, pc, L, roll, block, 5L, case, box, pk, ctn, bt, 1Lbt, jar, glass, small, big, pc_cut

  ## Tables

  ### items
  - `id` (uuid, primary key)
  - `name` (text)
  - `variant` (text, nullable)
  - `unit` (unit_enum, nullable)
  - `supplier` (supplier_enum)
  - `order_count` (integer) - Tracks usage frequency
  - `created_at` (timestamptz)
  - `modified_at` (timestamptz)

  ### orders
  - `id` (uuid, primary key)
  - `order_id` (text)
  - `store` (text)
  - `supplier` (supplier_enum)
  - `items` (jsonb)
  - `status` (status_enum)
  - `order_message` (text, nullable)
  - `is_sent` (boolean)
  - `is_paid` (boolean)
  - `is_on_the_way` (boolean)
  - `is_received` (boolean)
  - `completed_at` (timestamptz, nullable)
  - `modified_at` (timestamptz)
  - `created_at` (timestamptz)

  ### stores
  - `id` (uuid, primary key)
  - `name` (text, unique)
  - `is_permanent` (boolean)
  - `created_at` (timestamptz)

  ## Security
  - All tables have RLS enabled with public access
*/

-- Create types
CREATE TYPE store_enum AS ENUM ('CV2', 'STOCK02', 'WB', 'SHANTI');
CREATE TYPE supplier_enum AS ENUM ('KALI', 'PISEY', 'MARKET', 'LEES', 'ANGKOR-COMPANY', 'COCA-COMPANY', 'CHARONAI', 'KOFI', 'TAKEAWAY-SHOP', 'STOCK', 'PZZA+');
CREATE TYPE status_enum AS ENUM ('dispatching', 'on_the_way', 'received', 'completed');
CREATE TYPE unit_enum AS ENUM ('kg', 'pc', 'L', 'roll', 'block', '5L', 'case', 'box', 'pk', 'ctn', 'bt', '1Lbt', 'jar', 'glass', 'small', 'big', 'pc_cut');

-- Create stores table
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  is_permanent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

INSERT INTO stores (name, is_permanent) VALUES
  ('CV2', true),
  ('STOCK02', true),
  ('WB', true),
  ('SHANTI', true)
ON CONFLICT (name) DO NOTHING;

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  variant text,
  unit unit_enum,
  supplier supplier_enum NOT NULL,
  order_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  modified_at timestamptz DEFAULT now()
);

-- Create orders table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_items_supplier ON items(supplier);
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
CREATE INDEX IF NOT EXISTS idx_items_order_count ON items(order_count DESC);
CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_store_status ON orders(store, status);
CREATE INDEX IF NOT EXISTS idx_stores_name ON stores(name);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_modified_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.modified_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
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

-- Enable RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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
