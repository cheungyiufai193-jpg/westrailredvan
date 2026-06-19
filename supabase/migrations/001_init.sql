-- 拼Van 数据库迁移脚本
-- 在 Supabase SQL Editor 中运行

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  role TEXT NOT NULL CHECK (role IN ('passenger', 'driver', 'admin')),
  rating NUMERIC(2,1) DEFAULT 5.0,
  total_trips INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 司机档案
CREATE TABLE IF NOT EXISTS driver_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online','offline','busy')),
  vehicle_plate TEXT DEFAULT '',
  vehicle_model TEXT DEFAULT '丰田 Coaster',
  total_seats INTEGER DEFAULT 16,
  verified BOOLEAN DEFAULT false,
  blocked BOOLEAN DEFAULT false,
  last_active_at TIMESTAMPTZ DEFAULT now(),
  today_trips INTEGER DEFAULT 0,
  today_passengers INTEGER DEFAULT 0
);

-- 路线表
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('passenger','driver')),
  creator_id UUID NOT NULL REFERENCES users(id),
  pickup_name TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION NOT NULL,
  pickup_lng DOUBLE PRECISION NOT NULL,
  pickup_address TEXT DEFAULT '',
  dropoff_name TEXT NOT NULL,
  dropoff_lat DOUBLE PRECISION NOT NULL,
  dropoff_lng DOUBLE PRECISION NOT NULL,
  dropoff_address TEXT DEFAULT '',
  passenger_count INTEGER DEFAULT 1,
  max_passengers INTEGER DEFAULT 4,
  preferred_time TIMESTAMPTZ,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','claimed','in_progress','completed','cancelled')),
  claimed_by UUID REFERENCES users(id),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(status);
CREATE INDEX IF NOT EXISTS idx_routes_created_at ON routes(created_at DESC);

-- 行程表
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id),
  driver_id UUID NOT NULL REFERENCES users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','picking_up','en_route','completed','cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 行程乘客
CREATE TABLE IF NOT EXISTS trip_passengers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting','picked_up','completed','no_show')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  picked_up_at TIMESTAMPTZ
);

-- 消息表
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id),
  sender_id UUID NOT NULL REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  type TEXT DEFAULT 'text' CHECK (type IN ('text','system')),
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_trip ON messages(trip_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);

-- 推送订阅表
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 启用 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE routes;
ALTER PUBLICATION supabase_realtime ADD TABLE trips;
ALTER PUBLICATION supabase_realtime ADD TABLE trip_passengers;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_profiles;

-- RLS 策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 用户策略
CREATE POLICY "users_read_all" ON users FOR SELECT USING (true);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_insert_auth" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- 司机档案策略
CREATE POLICY "drivers_read_all" ON driver_profiles FOR SELECT USING (true);
CREATE POLICY "drivers_update_own" ON driver_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "drivers_insert_auth" ON driver_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 路线策略
CREATE POLICY "routes_read_all" ON routes FOR SELECT USING (true);
CREATE POLICY "routes_insert_auth" ON routes FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "routes_update_own" ON routes FOR UPDATE USING (auth.uid() = creator_id OR auth.uid() = claimed_by);

-- 行程策略
CREATE POLICY "trips_read_all" ON trips FOR SELECT USING (true);
CREATE POLICY "trips_insert_auth" ON trips FOR INSERT WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "trips_update_driver" ON trips FOR UPDATE USING (auth.uid() = driver_id);

-- 行程乘客策略
CREATE POLICY "trip_passengers_read_all" ON trip_passengers FOR SELECT USING (true);
CREATE POLICY "trip_passengers_insert_auth" ON trip_passengers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "trip_passengers_update_driver" ON trip_passengers FOR UPDATE USING (
  auth.uid() IN (SELECT driver_id FROM trips WHERE id = trip_id)
);

-- 消息策略
CREATE POLICY "messages_read_participants" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "messages_insert_auth" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 推送订阅策略
CREATE POLICY "push_subscriptions_own" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);