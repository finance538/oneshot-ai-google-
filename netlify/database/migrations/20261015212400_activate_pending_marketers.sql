UPDATE account_registrations
SET status = 'approved', updated_at = now()
WHERE role = 'marketer' AND status = 'pending';
