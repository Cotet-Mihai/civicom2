CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE creator_type AS ENUM ('user', 'ngo');
CREATE TYPE event_category AS ENUM ('protest', 'boycott', 'petition', 'community', 'charity');
CREATE TYPE event_status AS ENUM ('pending', 'approved', 'rejected', 'contested', 'completed');
CREATE TYPE org_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE org_member_role AS ENUM ('admin', 'member');
CREATE TYPE participant_status AS ENUM ('joined', 'cancelled');
CREATE TYPE appeal_status AS ENUM ('pending', 'under_review', 'resolved');
CREATE TYPE donation_type AS ENUM ('material', 'monetary');
