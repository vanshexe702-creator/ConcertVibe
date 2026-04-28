-- ============================================================
-- Concert Ticket Booking System — Database Schema
-- MySQL 8.0+
-- ============================================================

-- Create database
CREATE DATABASE IF NOT EXISTS concert_booking;
USE concert_booking;

-- ============================================================
-- USERS TABLE
-- Stores registered user information
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  UNIQUE NOT NULL,
  password      VARCHAR(255)  NOT NULL,       -- bcrypt hashed
  phone         VARCHAR(20)   DEFAULT NULL,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- ADMINS TABLE
-- Admin accounts for the management panel
-- ============================================================
CREATE TABLE IF NOT EXISTS admins (
  admin_id      INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(100)  UNIQUE NOT NULL,
  password      VARCHAR(255)  NOT NULL,       -- bcrypt hashed
  role          ENUM('superadmin','admin') DEFAULT 'admin',
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- CONCERTS TABLE
-- All concert/event listings
-- ============================================================
CREATE TABLE IF NOT EXISTS concerts (
  concert_id      INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(200)   NOT NULL,
  artist          VARCHAR(200)   NOT NULL,
  venue           VARCHAR(200)   NOT NULL,
  city            VARCHAR(100)   NOT NULL,
  category        VARCHAR(50)    DEFAULT 'General',
  date            DATE           NOT NULL,
  time            TIME           NOT NULL,
  price           DECIMAL(10,2)  NOT NULL,
  vip_price       DECIMAL(10,2)  DEFAULT NULL,
  total_seats     INT            NOT NULL,
  available_seats INT            NOT NULL,
  image_url       VARCHAR(500)   DEFAULT NULL,
  description     TEXT           DEFAULT NULL,
  status          ENUM('upcoming','ongoing','completed','cancelled') DEFAULT 'upcoming',
  created_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_city (city),
  INDEX idx_date (date),
  INDEX idx_status (status),
  INDEX idx_artist (artist)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- SEATS TABLE
-- Per-concert seat layout and status tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS seats (
  seat_id       INT AUTO_INCREMENT PRIMARY KEY,
  concert_id    INT            NOT NULL,
  seat_label    VARCHAR(10)    NOT NULL,       -- e.g. "A1", "B12"
  seat_row      CHAR(2)        NOT NULL,       -- e.g. "A", "B"
  seat_number   INT            NOT NULL,
  seat_type     ENUM('regular','vip','blocked') DEFAULT 'regular',
  status        ENUM('available','locked','booked','blocked') DEFAULT 'available',
  locked_by     INT            DEFAULT NULL,
  locked_at     TIMESTAMP      NULL DEFAULT NULL,
  FOREIGN KEY (concert_id) REFERENCES concerts(concert_id) ON DELETE CASCADE,
  FOREIGN KEY (locked_by)  REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_concert_status (concert_id, status),
  UNIQUE KEY unique_seat (concert_id, seat_label)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- BOOKINGS TABLE
-- All ticket bookings / transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  booking_id      VARCHAR(20)    PRIMARY KEY,   -- e.g. "TKT-20260428-001"
  user_id         INT            NOT NULL,
  concert_id      INT            NOT NULL,
  seats           JSON           NOT NULL,       -- ["A1","A2","A3"]
  seat_count      INT            NOT NULL,
  total_amount    DECIMAL(10,2)  NOT NULL,
  payment_method  VARCHAR(50)    DEFAULT NULL,
  payment_status  ENUM('pending','completed','failed','refunded') DEFAULT 'pending',
  booking_status  ENUM('confirmed','cancelled') DEFAULT 'confirmed',
  promo_code      VARCHAR(30)    DEFAULT NULL,
  discount        DECIMAL(10,2)  DEFAULT 0.00,
  booking_date    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(user_id),
  FOREIGN KEY (concert_id) REFERENCES concerts(concert_id),
  INDEX idx_user (user_id),
  INDEX idx_concert (concert_id),
  INDEX idx_booking_date (booking_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- REVIEWS TABLE (Bonus Feature)
-- User reviews and ratings for concerts
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  review_id     INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT            NOT NULL,
  concert_id    INT            NOT NULL,
  rating        INT            NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT           DEFAULT NULL,
  created_at    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(user_id),
  FOREIGN KEY (concert_id) REFERENCES concerts(concert_id),
  UNIQUE KEY unique_review (user_id, concert_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- PROMO CODES TABLE (Bonus Feature)
-- Discount codes for bookings
-- ============================================================
CREATE TABLE IF NOT EXISTS promo_codes (
  promo_id          INT AUTO_INCREMENT PRIMARY KEY,
  code              VARCHAR(30)    UNIQUE NOT NULL,
  discount_percent  DECIMAL(5,2)   NOT NULL,
  max_uses          INT            DEFAULT 100,
  used_count        INT            DEFAULT 0,
  valid_until       DATE           DEFAULT NULL,
  is_active         TINYINT(1)     DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- FAVORITES TABLE (Bonus Feature)
-- User-favorited concerts
-- ============================================================
CREATE TABLE IF NOT EXISTS favorites (
  user_id       INT NOT NULL,
  concert_id    INT NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, concert_id),
  FOREIGN KEY (user_id)    REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (concert_id) REFERENCES concerts(concert_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- SEED DATA
-- ============================================================

-- Default admin (password: admin123 — bcrypt hash)
INSERT IGNORE INTO admins (username, password, role) VALUES
('admin', '$2b$10$0xICvBRispXnbaR97Et34ecSRsmt3u/WtU1KEL6f7bZ7XJgGoGvAe', 'superadmin');

-- Sample concerts
INSERT IGNORE INTO concerts (title, artist, venue, city, category, date, time, price, vip_price, total_seats, available_seats, image_url, description, status) VALUES
('Neon Nights Tour',        'The Lumineers',     'Madison Square Garden', 'New York',    'Rock',        '2026-06-15', '20:00:00', 85.00,  150.00, 150, 150, '/assets/concert1.jpg', 'An electrifying night of indie rock anthems under neon lights. The Lumineers bring their award-winning sound to the heart of NYC.', 'upcoming'),
('Echoes of Summer',        'Dua Lipa',          'Hollywood Bowl',        'Los Angeles', 'Pop',         '2026-07-22', '19:30:00', 120.00, 250.00, 150, 150, '/assets/concert2.jpg', 'Pop superstar Dua Lipa lights up Hollywood Bowl with her chart-topping hits and dazzling visual production.', 'upcoming'),
('Bass Drop Festival',      'Marshmello',        'Wembley Arena',         'London',      'Electronic',  '2026-08-05', '21:00:00', 95.00,  180.00, 150, 150, '/assets/concert3.jpg', 'The ultimate EDM experience — massive drops, insane visuals, and non-stop energy from the masked maestro.', 'upcoming'),
('Soulful Evenings',        'Adele',             'Royal Albert Hall',     'London',      'Soul',        '2026-09-10', '19:00:00', 200.00, 400.00, 150, 150, '/assets/concert4.jpg', 'An intimate evening with the voice of a generation. Adele performs her greatest hits in an iconic venue.', 'upcoming'),
('Rhythm & Blues Carnival',  'Bruno Mars',        'Staples Center',        'Los Angeles', 'R&B',         '2026-07-04', '20:30:00', 110.00, 220.00, 150, 150, '/assets/concert5.jpg', 'Bruno Mars brings the funk, the groove, and the showmanship for an unforgettable Independence Day celebration.', 'upcoming'),
('Midnight Serenade',       'Coldplay',          'Soldier Field',         'Chicago',     'Alternative', '2026-10-01', '20:00:00', 99.00,  200.00, 150, 150, '/assets/concert6.jpg', 'Coldplay\'s legendary live show — a kaleidoscope of color, emotion, and music under the Chicago skyline.', 'upcoming'),
('Indie Vibes Live',        'Arctic Monkeys',    'The O2 Arena',          'London',      'Indie',       '2026-08-20', '19:00:00', 75.00,  140.00, 150, 150, '/assets/concert7.jpg', 'Sheffield\'s finest bring their razor-sharp riffs and atmospheric soundscapes to London\'s biggest stage.', 'upcoming'),
('Golden Hour Festival',    'Taylor Swift',      'MetLife Stadium',       'New York',    'Pop',         '2026-11-15', '18:00:00', 150.00, 350.00, 150, 150, '/assets/concert8.jpg', 'The Eras Tour continues — Taylor Swift delivers a three-hour spectacle of music, storytelling, and magic.', 'upcoming');

-- Sample promo codes
INSERT IGNORE INTO promo_codes (code, discount_percent, max_uses, valid_until) VALUES
('WELCOME10', 10.00, 500, '2026-12-31'),
('SUMMER20',  20.00, 200, '2026-08-31'),
('VIP15',     15.00, 100, '2026-12-31');
