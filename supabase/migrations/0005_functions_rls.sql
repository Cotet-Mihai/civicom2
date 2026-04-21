-- ============================================================
-- FUNCȚII HELPER
-- ============================================================

CREATE OR REPLACE FUNCTION current_user_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT id FROM users WHERE auth_users_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE auth_users_id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION is_org_admin(org_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
      AND user_id = current_user_id()
      AND role = 'admin'
  );
$$;

-- ============================================================
-- RLS: events
-- ============================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select" ON events FOR SELECT USING (
  status IN ('approved', 'completed')
  OR creator_id = current_user_id()
  OR is_admin()
);

CREATE POLICY "events_insert" ON events FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND creator_id = current_user_id()
);

CREATE POLICY "events_update" ON events FOR UPDATE
USING (
  (creator_id = current_user_id() AND status NOT IN ('approved', 'completed'))
  OR is_admin()
)
WITH CHECK (
  (creator_id = current_user_id() AND status NOT IN ('approved', 'completed'))
  OR is_admin()
);

CREATE POLICY "events_delete" ON events FOR DELETE USING (
  creator_id = current_user_id() OR is_admin()
);

-- ============================================================
-- RLS: tabele nivel 2
-- ============================================================

ALTER TABLE protests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "protests_select" ON protests FOR SELECT USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "protests_insert" ON protests FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.creator_id = current_user_id())
);
CREATE POLICY "protests_update" ON protests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "protests_delete" ON protests FOR DELETE USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

ALTER TABLE boycotts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "boycotts_select" ON boycotts FOR SELECT USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "boycotts_insert" ON boycotts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.creator_id = current_user_id())
);
CREATE POLICY "boycotts_update" ON boycotts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "boycotts_delete" ON boycotts FOR DELETE USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

ALTER TABLE petitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "petitions_select" ON petitions FOR SELECT USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "petitions_insert" ON petitions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.creator_id = current_user_id())
);
CREATE POLICY "petitions_update" ON petitions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "petitions_delete" ON petitions FOR DELETE USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

ALTER TABLE community_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community_activities_select" ON community_activities FOR SELECT USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "community_activities_insert" ON community_activities FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.creator_id = current_user_id())
);
CREATE POLICY "community_activities_update" ON community_activities FOR UPDATE USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "community_activities_delete" ON community_activities FOR DELETE USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

ALTER TABLE charity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "charity_events_select" ON charity_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "charity_events_insert" ON charity_events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.creator_id = current_user_id())
);
CREATE POLICY "charity_events_update" ON charity_events FOR UPDATE USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "charity_events_delete" ON charity_events FOR DELETE USING (
  EXISTS (SELECT 1 FROM events e WHERE e.id = event_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

-- ============================================================
-- RLS: tabele nivel 3 — JOIN dublu
-- ============================================================

ALTER TABLE gatherings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gatherings_select" ON gatherings FOR SELECT USING (
  EXISTS (SELECT 1 FROM protests p JOIN events e ON e.id = p.event_id WHERE p.id = protest_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "gatherings_insert" ON gatherings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM protests p JOIN events e ON e.id = p.event_id
    WHERE p.id = protest_id AND e.creator_id = current_user_id())
);
CREATE POLICY "gatherings_update" ON gatherings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM protests p JOIN events e ON e.id = p.event_id WHERE p.id = protest_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "gatherings_delete" ON gatherings FOR DELETE USING (
  EXISTS (SELECT 1 FROM protests p JOIN events e ON e.id = p.event_id WHERE p.id = protest_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

ALTER TABLE marches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marches_select" ON marches FOR SELECT USING (
  EXISTS (SELECT 1 FROM protests p JOIN events e ON e.id = p.event_id WHERE p.id = protest_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "marches_insert" ON marches FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM protests p JOIN events e ON e.id = p.event_id
    WHERE p.id = protest_id AND e.creator_id = current_user_id())
);
CREATE POLICY "marches_update" ON marches FOR UPDATE USING (
  EXISTS (SELECT 1 FROM protests p JOIN events e ON e.id = p.event_id WHERE p.id = protest_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "marches_delete" ON marches FOR DELETE USING (
  EXISTS (SELECT 1 FROM protests p JOIN events e ON e.id = p.event_id WHERE p.id = protest_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

ALTER TABLE pickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pickets_select" ON pickets FOR SELECT USING (
  EXISTS (SELECT 1 FROM protests p JOIN events e ON e.id = p.event_id WHERE p.id = protest_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "pickets_insert" ON pickets FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM protests p JOIN events e ON e.id = p.event_id
    WHERE p.id = protest_id AND e.creator_id = current_user_id())
);
CREATE POLICY "pickets_update" ON pickets FOR UPDATE USING (
  EXISTS (SELECT 1 FROM protests p JOIN events e ON e.id = p.event_id WHERE p.id = protest_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "pickets_delete" ON pickets FOR DELETE USING (
  EXISTS (SELECT 1 FROM protests p JOIN events e ON e.id = p.event_id WHERE p.id = protest_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

ALTER TABLE boycott_brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "boycott_brands_select" ON boycott_brands FOR SELECT USING (
  EXISTS (SELECT 1 FROM boycotts b JOIN events e ON e.id = b.event_id WHERE b.id = boycott_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "boycott_brands_insert" ON boycott_brands FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM boycotts b JOIN events e ON e.id = b.event_id
    WHERE b.id = boycott_id AND e.creator_id = current_user_id())
);
CREATE POLICY "boycott_brands_update" ON boycott_brands FOR UPDATE USING (
  EXISTS (SELECT 1 FROM boycotts b JOIN events e ON e.id = b.event_id WHERE b.id = boycott_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "boycott_brands_delete" ON boycott_brands FOR DELETE USING (
  EXISTS (SELECT 1 FROM boycotts b JOIN events e ON e.id = b.event_id WHERE b.id = boycott_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

ALTER TABLE boycott_alternatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "boycott_alternatives_select" ON boycott_alternatives FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM boycott_brands bb
    JOIN boycotts b ON b.id = bb.boycott_id
    JOIN events e ON e.id = b.event_id
    WHERE bb.id = brand_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin())
  )
);
CREATE POLICY "boycott_alternatives_insert" ON boycott_alternatives FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM boycott_brands bb
    JOIN boycotts b ON b.id = bb.boycott_id
    JOIN events e ON e.id = b.event_id
    WHERE bb.id = brand_id AND e.creator_id = current_user_id()
  )
);
CREATE POLICY "boycott_alternatives_update" ON boycott_alternatives FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM boycott_brands bb
    JOIN boycotts b ON b.id = bb.boycott_id
    JOIN events e ON e.id = b.event_id
    WHERE bb.id = brand_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin())
  )
);
CREATE POLICY "boycott_alternatives_delete" ON boycott_alternatives FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM boycott_brands bb
    JOIN boycotts b ON b.id = bb.boycott_id
    JOIN events e ON e.id = b.event_id
    WHERE bb.id = brand_id
    AND (e.creator_id = current_user_id() OR is_admin())
  )
);

ALTER TABLE outdoor_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "outdoor_activities_select" ON outdoor_activities FOR SELECT USING (
  EXISTS (SELECT 1 FROM community_activities ca JOIN events e ON e.id = ca.event_id
    WHERE ca.id = community_activity_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "outdoor_activities_insert" ON outdoor_activities FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM community_activities ca JOIN events e ON e.id = ca.event_id
    WHERE ca.id = community_activity_id AND e.creator_id = current_user_id())
);
CREATE POLICY "outdoor_activities_update" ON outdoor_activities FOR UPDATE USING (
  EXISTS (SELECT 1 FROM community_activities ca JOIN events e ON e.id = ca.event_id
    WHERE ca.id = community_activity_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "outdoor_activities_delete" ON outdoor_activities FOR DELETE USING (
  EXISTS (SELECT 1 FROM community_activities ca JOIN events e ON e.id = ca.event_id
    WHERE ca.id = community_activity_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donations_select" ON donations FOR SELECT USING (
  EXISTS (SELECT 1 FROM community_activities ca JOIN events e ON e.id = ca.event_id
    WHERE ca.id = community_activity_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "donations_insert" ON donations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM community_activities ca JOIN events e ON e.id = ca.event_id
    WHERE ca.id = community_activity_id AND e.creator_id = current_user_id())
);
CREATE POLICY "donations_update" ON donations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM community_activities ca JOIN events e ON e.id = ca.event_id
    WHERE ca.id = community_activity_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "donations_delete" ON donations FOR DELETE USING (
  EXISTS (SELECT 1 FROM community_activities ca JOIN events e ON e.id = ca.event_id
    WHERE ca.id = community_activity_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workshops_select" ON workshops FOR SELECT USING (
  EXISTS (SELECT 1 FROM community_activities ca JOIN events e ON e.id = ca.event_id
    WHERE ca.id = community_activity_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "workshops_insert" ON workshops FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM community_activities ca JOIN events e ON e.id = ca.event_id
    WHERE ca.id = community_activity_id AND e.creator_id = current_user_id())
);
CREATE POLICY "workshops_update" ON workshops FOR UPDATE USING (
  EXISTS (SELECT 1 FROM community_activities ca JOIN events e ON e.id = ca.event_id
    WHERE ca.id = community_activity_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "workshops_delete" ON workshops FOR DELETE USING (
  EXISTS (SELECT 1 FROM community_activities ca JOIN events e ON e.id = ca.event_id
    WHERE ca.id = community_activity_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

ALTER TABLE charity_concerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "charity_concerts_select" ON charity_concerts FOR SELECT USING (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "charity_concerts_insert" ON charity_concerts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id AND e.creator_id = current_user_id())
);
CREATE POLICY "charity_concerts_update" ON charity_concerts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "charity_concerts_delete" ON charity_concerts FOR DELETE USING (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

ALTER TABLE meet_greets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meet_greets_select" ON meet_greets FOR SELECT USING (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "meet_greets_insert" ON meet_greets FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id AND e.creator_id = current_user_id())
);
CREATE POLICY "meet_greets_update" ON meet_greets FOR UPDATE USING (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "meet_greets_delete" ON meet_greets FOR DELETE USING (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

ALTER TABLE charity_livestreams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "charity_livestreams_select" ON charity_livestreams FOR SELECT USING (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "charity_livestreams_insert" ON charity_livestreams FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id AND e.creator_id = current_user_id())
);
CREATE POLICY "charity_livestreams_update" ON charity_livestreams FOR UPDATE USING (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "charity_livestreams_delete" ON charity_livestreams FOR DELETE USING (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

ALTER TABLE sports_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sports_activities_select" ON sports_activities FOR SELECT USING (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id
    AND (e.status IN ('approved','completed') OR e.creator_id = current_user_id() OR is_admin()))
);
CREATE POLICY "sports_activities_insert" ON sports_activities FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id AND e.creator_id = current_user_id())
);
CREATE POLICY "sports_activities_update" ON sports_activities FOR UPDATE USING (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id
    AND ((e.creator_id = current_user_id() AND e.status NOT IN ('approved','completed')) OR is_admin()))
);
CREATE POLICY "sports_activities_delete" ON sports_activities FOR DELETE USING (
  EXISTS (SELECT 1 FROM charity_events ce JOIN events e ON e.id = ce.event_id
    WHERE ce.id = charity_event_id
    AND (e.creator_id = current_user_id() OR is_admin()))
);

-- ============================================================
-- RLS: users
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select" ON users FOR SELECT USING (true);

CREATE POLICY "users_update" ON users FOR UPDATE
USING (auth_users_id = auth.uid())
WITH CHECK (auth_users_id = auth.uid());

-- ============================================================
-- RLS: organizations
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizations_select" ON organizations FOR SELECT USING (
  status = 'approved'
  OR owner_id = current_user_id()
  OR EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = organizations.id AND user_id = current_user_id()
  )
  OR is_admin()
);

CREATE POLICY "organizations_insert" ON organizations FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND owner_id = current_user_id()
);

CREATE POLICY "organizations_update" ON organizations FOR UPDATE
USING (is_org_admin(id) OR is_admin())
WITH CHECK (is_org_admin(id) OR is_admin());

-- ============================================================
-- RLS: organization_members
-- ============================================================

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_select" ON organization_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = current_user_id()
  )
  OR is_admin()
);

CREATE POLICY "org_members_insert" ON organization_members FOR INSERT WITH CHECK (
  is_org_admin(organization_id) OR is_admin()
);

CREATE POLICY "org_members_update" ON organization_members FOR UPDATE
USING (is_org_admin(organization_id) OR is_admin())
WITH CHECK (is_org_admin(organization_id) OR is_admin());

CREATE POLICY "org_members_delete" ON organization_members FOR DELETE USING (
  (is_org_admin(organization_id) AND user_id != current_user_id())
  OR is_admin()
);

-- ============================================================
-- RLS: organization_ratings
-- ============================================================

ALTER TABLE organization_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_ratings_select" ON organization_ratings FOR SELECT USING (true);

CREATE POLICY "org_ratings_insert" ON organization_ratings FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND user_id = current_user_id()
);

CREATE POLICY "org_ratings_update" ON organization_ratings FOR UPDATE
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id());

CREATE POLICY "org_ratings_delete" ON organization_ratings FOR DELETE USING (
  user_id = current_user_id()
);

-- ============================================================
-- RLS: event_participants
-- ============================================================

ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participants_select" ON event_participants FOR SELECT USING (true);

CREATE POLICY "participants_insert" ON event_participants FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = current_user_id()
  AND EXISTS (
    SELECT 1 FROM events WHERE id = event_id AND status = 'approved'
  )
);

CREATE POLICY "participants_update" ON event_participants FOR UPDATE
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id());

-- ============================================================
-- RLS: petition_signatures
-- ============================================================

ALTER TABLE petition_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "signatures_select" ON petition_signatures FOR SELECT USING (true);

CREATE POLICY "signatures_insert" ON petition_signatures FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = current_user_id()
  AND EXISTS (
    SELECT 1 FROM events WHERE id = event_id AND status = 'approved'
  )
);

CREATE POLICY "signatures_delete" ON petition_signatures FOR DELETE USING (
  user_id = current_user_id()
);

-- ============================================================
-- RLS: event_feedback
-- ============================================================

ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_select" ON event_feedback FOR SELECT USING (true);

CREATE POLICY "feedback_insert" ON event_feedback FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = current_user_id()
  AND EXISTS (
    SELECT 1 FROM events WHERE id = event_id AND status = 'completed'
  )
  AND EXISTS (
    SELECT 1 FROM event_participants
    WHERE event_id = event_feedback.event_id
      AND user_id = current_user_id()
      AND status = 'joined'
  )
);

CREATE POLICY "feedback_delete_admin" ON event_feedback FOR DELETE USING (is_admin());

-- ============================================================
-- RLS: appeals
-- ============================================================

ALTER TABLE appeals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appeals_select" ON appeals FOR SELECT USING (
  user_id = current_user_id() OR is_admin()
);

CREATE POLICY "appeals_insert" ON appeals FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = current_user_id()
  AND EXISTS (
    SELECT 1 FROM events
    WHERE id = event_id
      AND status = 'rejected'
      AND creator_id = current_user_id()
  )
);

CREATE POLICY "appeals_update" ON appeals FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

-- ============================================================
-- RLS: notifications
-- ============================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (
  user_id = current_user_id()
);

CREATE POLICY "notifications_update" ON notifications FOR UPDATE
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id());
