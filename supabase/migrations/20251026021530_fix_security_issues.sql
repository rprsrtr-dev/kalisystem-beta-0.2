/*
  # Fix Security Issues

  ## Changes
  1. Remove unused indexes
     - Drop idx_items_supplier
     - Drop idx_items_order_count  
     - Drop idx_orders_store
     - Drop idx_orders_status
     - Drop idx_stores_name
  
  2. Keep only actively used indexes
     - idx_items_name (used for searching items)
     - idx_orders_store_status (used for filtering orders by store and status)

  3. Fix function search path security
     - Set search_path for update_modified_at_column function to be immutable

  ## Security Notes
  - Unused indexes consume storage and slow down write operations
  - Mutable search_path in functions can be exploited for privilege escalation
  - Setting search_path explicitly prevents search path injection attacks
*/

-- Drop unused indexes
DROP INDEX IF EXISTS idx_items_supplier;
DROP INDEX IF EXISTS idx_items_order_count;
DROP INDEX IF EXISTS idx_orders_store;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_stores_name;

-- Recreate the update trigger function with secure search_path
CREATE OR REPLACE FUNCTION update_modified_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.modified_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public;
