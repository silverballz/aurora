-- ========================================================================
-- AURORA — Seed Data for Kaltarang 2026 at RGIPT
-- Initial Events, Campus Gates, and Operator Roles
-- ========================================================================

-- Insert Official Campus Gates
INSERT INTO public.gates (name, location, status)
VALUES
  ('MAIN GATE', 'Campus North Entrance / Administrative Block', 'ACTIVE'),
  ('HOSTEL GATE', 'South Campus / Student Residence Entrance', 'ACTIVE'),
  ('OAT / ARENA GATE', 'Open Air Theatre & Sports Complex Ground', 'ACTIVE'),
  ('BACK GATE', 'East Service Road & Logistics', 'ACTIVE')
ON CONFLICT (name) DO NOTHING;

-- Insert Official Kaltarang 2026 Events
INSERT INTO public.events (name, description, date, start_time, end_time, venue, status)
VALUES
  (
    'Battle of the Bands (Rocktaves)',
    'Flagship western and fusion rock band competition featuring top colleges across India.',
    '2026-10-14',
    '18:00:00',
    '22:00:00',
    'Main Arena (OAT)',
    'ACTIVE'
  ),
  (
    'Step Up (Western Group Dance)',
    'Inter-college group dance competition celebrating street, hip-hop, and contemporary choreographies.',
    '2026-10-15',
    '14:00:00',
    '18:00:00',
    'Auditorium Hall A',
    'ACTIVE'
  ),
  (
    'Digital Arts & Generative Design Showcase',
    'Interactive digital media, generative graphics, and algorithmic creative workshop.',
    '2026-10-15',
    '10:30:00',
    '13:30:00',
    'Academic Block 2 - Studio 3',
    'ACTIVE'
  ),
  (
    'Pronite: Modern Folk & Electronic Fusion',
    'Headlining musical festival night with celebrated artists and live production.',
    '2026-10-16',
    '19:30:00',
    '23:30:00',
    'Main Ground Arena',
    'ACTIVE'
  ),
  (
    'Rhapsody: Classical & Semi-Classical Solo',
    'Vocal and instrumental classical music symposium.',
    '2026-10-16',
    '11:00:00',
    '14:00:00',
    'Auditorium Hall B',
    'ACTIVE'
  )
ON CONFLICT DO NOTHING;
