-- Посты (новости, статьи, форум, видео)
CREATE TABLE IF NOT EXISTS t_p83689144_profix_network_admin.posts (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL DEFAULT 'news',
  title VARCHAR(300) NOT NULL,
  slug VARCHAR(300),
  content TEXT,
  excerpt TEXT,
  cover_url TEXT,
  video_url TEXT,
  author_id INTEGER,
  author_name VARCHAR(100),
  tags TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Комментарии к постам
CREATE TABLE IF NOT EXISTS t_p83689144_profix_network_admin.post_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL,
  client_id INTEGER,
  author_name VARCHAR(100) NOT NULL DEFAULT 'Гость',
  text TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Реакции на посты и комменты
CREATE TABLE IF NOT EXISTS t_p83689144_profix_network_admin.post_reactions (
  id SERIAL PRIMARY KEY,
  post_id INTEGER,
  comment_id INTEGER,
  session_id VARCHAR(64) NOT NULL,
  reaction VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_type ON t_p83689144_profix_network_admin.posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_published ON t_p83689144_profix_network_admin.posts(is_published);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON t_p83689144_profix_network_admin.post_comments(post_id);
