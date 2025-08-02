-- Insert default services
INSERT INTO services (id, name, description, base_price, price_per_sqft, duration_minutes, category, features, requirements, is_active, sort_order) VALUES
(
  gen_random_uuid(),
  'Standard Cleaning',
  'Regular house cleaning including all rooms, perfect for weekly or bi-weekly maintenance.',
  60.00,
  0.08,
  120,
  'standard',
  ARRAY[
    'Vacuum all floors and carpets',
    'Dust all surfaces and furniture',
    'Clean and sanitize bathrooms',
    'Kitchen cleaning and appliances',
    'Empty trash and replace liners',
    'Make beds and tidy rooms'
  ],
  ARRAY[
    'Basic cleaning supplies provided',
    'Access to all rooms',
    'Clear walkways and surfaces'
  ],
  true,
  1
),
(
  gen_random_uuid(),
  'Deep Cleaning',
  'Thorough cleaning including baseboards, inside appliances, and detailed work.',
  120.00,
  0.15,
  240,
  'deep',
  ARRAY[
    'Everything in standard cleaning',
    'Clean baseboards and window sills',
    'Inside oven and refrigerator',
    'Light fixtures and ceiling fans',
    'Cabinet fronts and interiors',
    'Detailed bathroom deep clean',
    'Behind and under furniture'
  ],
  ARRAY[
    'Extended time access (4+ hours)',
    'Clear access to all areas',
    'Remove personal items from surfaces'
  ],
  true,
  2
),
(
  gen_random_uuid(),
  'Move-in/Move-out Cleaning',
  'Complete cleaning for moving situations, ensuring your space is spotless.',
  180.00,
  0.20,
  300,
  'move_in',
  ARRAY[
    'Deep clean all areas',
    'Cabinet and drawer interiors',
    'Appliance deep clean inside/out',
    'Window cleaning (interior)',
    'Detailed bathroom and kitchen',
    'Floor deep cleaning and mopping',
    'Light fixture cleaning'
  ],
  ARRAY[
    'Empty or mostly empty space',
    'Full day access',
    'Utilities connected (water, electricity)'
  ],
  true,
  3
),
(
  gen_random_uuid(),
  'Post-Construction Cleanup',
  'Specialized cleaning after construction or renovation work.',
  200.00,
  0.25,
  360,
  'deep',
  ARRAY[
    'Dust and debris removal',
    'Window cleaning (interior/exterior)',
    'Floor cleaning and polishing',
    'Fixture and surface cleaning',
    'Paint splatter removal',
    'Detailed sanitization'
  ],
  ARRAY[
    'Construction work completed',
    'Safe access to all areas',
    'Debris pre-removal by contractor'
  ],
  true,
  4
);

-- Insert add-on services
INSERT INTO services (id, name, description, base_price, price_per_sqft, duration_minutes, category, features, requirements, is_active, sort_order) VALUES
(
  gen_random_uuid(),
  'Inside Oven Cleaning',
  'Deep cleaning of oven interior, racks, and glass door.',
  25.00,
  0.00,
  30,
  'add_on',
  ARRAY[
    'Remove and clean oven racks',
    'Scrub oven interior',
    'Clean oven door and glass',
    'Eco-friendly degreasing'
  ],
  ARRAY[
    'Oven must be cool',
    'Access to oven'
  ],
  true,
  5
),
(
  gen_random_uuid(),
  'Inside Refrigerator Cleaning',
  'Complete cleaning of refrigerator interior, shelves, and drawers.',
  30.00,
  0.00,
  45,
  'add_on',
  ARRAY[
    'Remove and clean shelves',
    'Clean drawers and compartments',
    'Sanitize interior surfaces',
    'Clean door seals and handles'
  ],
  ARRAY[
    'Remove all food items',
    'Defrost if needed'
  ],
  true,
  6
),
(
  gen_random_uuid(),
  'Window Cleaning (Interior)',
  'Professional cleaning of interior windows and sills.',
  4.00,
  0.00,
  5,
  'add_on',
  ARRAY[
    'Clean window glass',
    'Wipe window sills',
    'Clean window tracks',
    'Streak-free finish'
  ],
  ARRAY[
    'Access to all windows',
    'Clear window areas'
  ],
  true,
  7
),
(
  gen_random_uuid(),
  'Garage Cleaning',
  'Organization and cleaning of garage space.',
  50.00,
  0.05,
  90,
  'add_on',
  ARRAY[
    'Sweep and mop floors',
    'Dust surfaces and shelving',
    'Organize items',
    'Remove cobwebs',
    'Clean garage door tracks'
  ],
  ARRAY[
    'Clear access to garage',
    'Sort items beforehand'
  ],
  true,
  8
),
(
  gen_random_uuid(),
  'Basement Cleaning',
  'Deep cleaning of basement areas including storage spaces.',
  40.00,
  0.06,
  75,
  'add_on',
  ARRAY[
    'Dust and vacuum all areas',
    'Clean storage areas',
    'Remove cobwebs',
    'Mop floors',
    'Organize if requested'
  ],
  ARRAY[
    'Safe access to basement',
    'Adequate lighting',
    'Clear walkways'
  ],
  true,
  9
);

-- Create some sample addresses for testing (these would normally be created by users)
-- Note: These are just for development/testing purposes

-- Create admin user for testing
INSERT INTO users (id, email, phone, role, email_verified, phone_verified, is_active) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'admin@cleanconnect.com',
  '+1-555-0001',
  'admin',
  true,
  true,
  true
);

-- Create sample customer
INSERT INTO users (id, email, phone, role, email_verified, phone_verified, is_active) VALUES
(
  '00000000-0000-0000-0000-000000000002',
  'customer@example.com',
  '+1-555-0002',
  'customer',
  true,
  true,
  true
);

INSERT INTO customer_profiles (user_id, first_name, last_name, preferences) VALUES
(
  '00000000-0000-0000-0000-000000000002',
  'John',
  'Doe',
  '{
    "notifications": {
      "email": true,
      "sms": true,
      "push": true
    },
    "cleaningPreferences": {
      "ecoFriendly": true,
      "petFriendly": false,
      "allergyFriendly": false
    }
  }'::jsonb
);

-- Create sample provider
INSERT INTO users (id, email, phone, role, email_verified, phone_verified, is_active) VALUES
(
  '00000000-0000-0000-0000-000000000003',
  'provider@example.com',
  '+1-555-0003',
  'provider',
  true,
  true,
  true
);

INSERT INTO provider_profiles (user_id, business_name, description, hourly_rate, service_radius, verification_status, availability, rating, review_count) VALUES
(
  '00000000-0000-0000-0000-000000000003',
  'Sparkle Clean Services',
  'Professional cleaning service with 5+ years of experience. We specialize in residential cleaning and use eco-friendly products.',
  35.00,
  25,
  'verified',
  '{
    "monday": [{"start": "08:00", "end": "17:00"}],
    "tuesday": [{"start": "08:00", "end": "17:00"}],
    "wednesday": [{"start": "08:00", "end": "17:00"}],
    "thursday": [{"start": "08:00", "end": "17:00"}],
    "friday": [{"start": "08:00", "end": "17:00"}],
    "saturday": [{"start": "09:00", "end": "15:00"}],
    "sunday": [],
    "exceptions": []
  }'::jsonb,
  4.8,
  127
);

-- Create sample address
INSERT INTO addresses (id, user_id, label, street_address, apartment, city, state, zip_code, country, is_default) VALUES
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000002',
  'Home',
  '123 Main Street',
  'Apt 4B',
  'San Francisco',
  'CA',
  '94102',
  'US',
  true
);
