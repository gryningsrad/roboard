PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS rob;
DROP TABLE IF EXISTS wishlist;
DROP TABLE IF EXISTS location_overrides;
DROP TABLE IF EXISTS parts;
DROP TABLE IF EXISTS orders;

CREATE TABLE parts (
  number TEXT PRIMARY KEY,
  name TEXT,
  qa_grading TEXT,
  maker_code TEXT,
  makers_reference TEXT,
  unit TEXT,
  pref_vendor_code TEXT,
  order_status TEXT,
  default_location TEXT,
  stock_class TEXT,
  stock_class_description TEXT,
  reserved INTEGER,
  price_class TEXT,
  asset TEXT,
  hm TEXT,
  attachments TEXT,
  weight_unit TEXT,
  weight REAL,
  alternative_available TEXT,
  imported_at TEXT,
  ean TEXT
);

CREATE TABLE orders (
  number TEXT PRIMARY KEY,
  title TEXT,
  vendor TEXT,
  del_address TEXT,
  form_type TEXT,
  form_status TEXT,
  created TEXT,
  approved TEXT,
  ordered TEXT,
  confirmed TEXT,
  received TEXT,
  service_order TEXT,
  details TEXT,
  estimate_total REAL,
  created_by TEXT,
  approved_by TEXT,
  ordered_by TEXT,
  imported_at TEXT
);

CREATE TABLE wishlist (
  part_number TEXT PRIMARY KEY,
  toggled_at TEXT,
  FOREIGN KEY(part_number) REFERENCES parts(number) ON DELETE CASCADE
);

CREATE TABLE rob (
  part_number TEXT PRIMARY KEY,
  rob REAL NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(part_number) REFERENCES parts(number) ON DELETE CASCADE
);

CREATE TABLE location_overrides (
  part_number TEXT PRIMARY KEY,
  new_location TEXT NOT NULL,
  note TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(part_number) REFERENCES parts(number) ON DELETE CASCADE
);

-- -------------------------------------
-- NEW: EAN TABLE
-- -------------------------------------
CREATE TABLE part_ean_overrides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_number TEXT NOT NULL,
  ean TEXT NOT NULL,
  source TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY(part_number)
    REFERENCES parts(number)
    ON DELETE CASCADE,

  UNIQUE(ean)
);

CREATE INDEX idx_location_overrides_updated_at
ON location_overrides(updated_at);

CREATE INDEX idx_location_overrides_new_location
ON location_overrides(new_location);

CREATE INDEX idx_part_ean_overrides_part_number
ON part_ean_overrides(part_number);

CREATE INDEX idx_part_ean_overrides_ean
ON part_ean_overrides(ean);