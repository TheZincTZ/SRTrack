-- RLS Policies for trainees table

-- Commanders can view their company's trainees
CREATE POLICY "commanders_view_company_trainees"
ON trainees
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM commanders
    WHERE commanders.id = auth.uid()
    AND commanders.company = trainees.company
    AND commanders.is_active = true
  )
);

-- Admins can view all trainees
CREATE POLICY "admins_view_all_trainees"
ON trainees
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM commanders
    WHERE commanders.id = auth.uid()
    AND commanders.role = 'admin'
    AND commanders.is_active = true
  )
);

-- Service role can insert (for bot registration)
CREATE POLICY "service_role_insert_trainees"
ON trainees
FOR INSERT
TO service_role
WITH CHECK (true);

-- Service role can update (for bot operations)
CREATE POLICY "service_role_update_trainees"
ON trainees
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- RLS Policies for attendance_logs table

-- Commanders can view their company's attendance
CREATE POLICY "commanders_view_company_attendance"
ON attendance_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM commanders
    JOIN trainees ON trainees.company = commanders.company
    WHERE commanders.id = auth.uid()
    AND attendance_logs.trainee_id = trainees.id
    AND commanders.is_active = true
  )
);

-- Admins can view all attendance
CREATE POLICY "admins_view_all_attendance"
ON attendance_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM commanders
    WHERE commanders.id = auth.uid()
    AND commanders.role = 'admin'
    AND commanders.is_active = true
  )
);

-- Service role can insert (for bot clock in)
CREATE POLICY "service_role_insert_attendance"
ON attendance_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Service role can update (for bot clock out)
CREATE POLICY "service_role_update_attendance"
ON attendance_logs
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (
  OLD.clock_in_time = NEW.clock_in_time
  AND OLD.trainee_id = NEW.trainee_id
  AND OLD.date = NEW.date
);

-- RLS Policies for commanders table

-- Commanders can view their own record
CREATE POLICY "commanders_view_self"
ON commanders
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Admins can view all commanders
CREATE POLICY "admins_view_all_commanders"
ON commanders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM commanders c
    WHERE c.id = auth.uid()
    AND c.role = 'admin'
    AND c.is_active = true
  )
);

-- Service role can insert (for registration)
CREATE POLICY "service_role_insert_commanders"
ON commanders
FOR INSERT
TO service_role
WITH CHECK (true);

-- Commanders can update their own record (limited fields)
CREATE POLICY "commanders_update_self"
ON commanders
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND OLD.role = NEW.role
  AND OLD.company = NEW.company
);

-- RLS Policies for notifications table

-- Commanders can view their notifications
CREATE POLICY "commanders_view_own_notifications"
ON notifications
FOR SELECT
TO authenticated
USING (commander_id = auth.uid());

-- Service role can insert (for sending notifications)
CREATE POLICY "service_role_insert_notifications"
ON notifications
FOR INSERT
TO service_role
WITH CHECK (true);

