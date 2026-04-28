CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES t_p83689144_profix_network_admin.clients(id),
    ticket_id INTEGER REFERENCES t_p83689144_profix_network_admin.tickets(id),
    client_name VARCHAR(255),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    text TEXT,
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
