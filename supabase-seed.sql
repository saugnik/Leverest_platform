-- ============================================================
-- Quick-start SEED data for development/demo
-- Run AFTER supabase-schema.sql
-- ============================================================

-- Insert demo Leverest team users (passwords set via Supabase Auth Dashboard)
INSERT INTO users (email, name, role, employee_type, branch, is_admin) VALUES
  ('admin@leverestfin.com',        'Arjun Sharma',      'relation_partner',    'supervision', 'both',    TRUE),
  ('rajesh.rp@leverestfin.com',    'Rajesh Kumar',      'relation_partner',    'deal_team',   'kolkata', FALSE),
  ('priya.rm@leverestfin.com',     'Priya Mehta',       'relation_manager',    'deal_team',   'kolkata', FALSE),
  ('deepak.ep@leverestfin.com',    'Deepak Banerjee',   'engagement_partner',  'deal_team',   'kolkata', FALSE),
  ('sneha.em@leverestfin.com',     'Sneha Das',         'engagement_manager',  'deal_team',   'kolkata', FALSE),
  ('rohit.exec@leverestfin.com',   'Rohit Ghosh',       'executive',           'deal_team',   'kolkata', FALSE),
  ('anita.accounts@leverestfin.com','Anita Roy',         'accounts',            'supervision', 'kolkata', FALSE),
  ('suresh.mis@leverestfin.com',   'Suresh Patel',      'mis',                 'supervision', 'kolkata', FALSE),
  ('amit.rm2@leverestfin.com',     'Amit Verma',        'relation_manager',    'deal_team',   'delhi',   FALSE)
ON CONFLICT (email) DO NOTHING;
