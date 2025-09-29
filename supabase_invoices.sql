-- Table: invoices
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  client_name TEXT,
  client_phone TEXT,
  client_address TEXT,
  supplier_name TEXT,
  supplier_phone TEXT,
  supplier_address TEXT,
  date TIMESTAMP,
  currency TEXT,
  total NUMERIC,
  lines JSONB
);
