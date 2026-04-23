CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_users_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  phone text,
  country text,
  city text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  iban text,
  website text,
  logo_url text,
  owner_id uuid NOT NULL REFERENCES users(id),
  status org_status NOT NULL DEFAULT 'pending',
  rating float4 NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  banner_url text,
  gallery_urls text[] NOT NULL DEFAULT '{}',
  category event_category NOT NULL,
  subcategory text,
  status event_status NOT NULL DEFAULT 'pending',
  creator_id uuid NOT NULL REFERENCES users(id),
  creator_type creator_type NOT NULL,
  organization_id uuid REFERENCES organizations(id),
  view_count int4 NOT NULL DEFAULT 0,
  participants_count int4 NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role org_member_role NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

CREATE TABLE organization_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid NOT NULL REFERENCES users(id),
  rating int2 NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);
