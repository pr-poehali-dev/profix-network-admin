CREATE TABLE IF NOT EXISTS t_p83689144_profix_network_admin.shop_product_images (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES t_p83689144_profix_network_admin.shop_products(id),
  image_url TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p83689144_profix_network_admin.shop_product_reviews (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES t_p83689144_profix_network_admin.shop_products(id),
  author_name VARCHAR(200) NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);