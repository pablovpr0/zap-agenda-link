
-- Inserir configurações padrão da empresa para usuários existentes
INSERT INTO company_settings (
  company_id,
  slug,
  working_days,
  working_hours_start,
  working_hours_end,
  appointment_interval,
  max_simultaneous_appointments,
  advance_booking_limit,
  theme_color
)
SELECT 
  p.id as company_id,
  LOWER(REGEXP_REPLACE(COALESCE(p.company_name, 'empresa-' || substring(p.id::text, 1, 8)), '[^a-zA-Z0-9]', '-', 'g')) as slug,
  ARRAY[1,2,3,4,5,6] as working_days,
  '09:00:00'::time as working_hours_start,
  '18:00:00'::time as working_hours_end,
  30 as appointment_interval,
  1 as max_simultaneous_appointments,
  30 as advance_booking_limit,
  '#22c55e' as theme_color
FROM profiles p
WHERE p.id NOT IN (SELECT company_id FROM company_settings)
ON CONFLICT (company_id) DO NOTHING;

-- Garantir que o slug seja único adicionando um número se necessário
UPDATE company_settings 
SET slug = slug || '-' || row_number() OVER (PARTITION BY slug ORDER BY created_at)
WHERE company_id IN (
  SELECT company_id 
  FROM company_settings 
  GROUP BY slug 
  HAVING COUNT(*) > 1
);
