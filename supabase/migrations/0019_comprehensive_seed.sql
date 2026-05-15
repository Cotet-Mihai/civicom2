-- ============================================================
-- SEED COMPLET: 12 utilizatori cu demografice, toate tipurile
-- de evenimente, toate statusurile, participanți, feedback,
-- semnături, apeluri, view snapshots
-- ============================================================

-- ─── 1. UTILIZATORI SEED ────────────────────────────────────

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_sso_user
)
VALUES
  ('00000000-0000-0000-0000-000000000000','10000001-0000-4000-8000-000000000001','authenticated','authenticated',
   'ana.ionescu@seed.civicom.ro',crypt('parola123',gen_salt('bf')),now(),
   '{"provider":"email","providers":["email"]}','{"name":"Ana Ionescu"}',now()-interval'200 days',now(),false),
  ('00000000-0000-0000-0000-000000000000','10000002-0000-4000-8000-000000000002','authenticated','authenticated',
   'mihai.stoica@seed.civicom.ro',crypt('parola123',gen_salt('bf')),now(),
   '{"provider":"email","providers":["email"]}','{"name":"Mihai Stoica"}',now()-interval'185 days',now(),false),
  ('00000000-0000-0000-0000-000000000000','10000003-0000-4000-8000-000000000003','authenticated','authenticated',
   'elena.popa@seed.civicom.ro',crypt('parola123',gen_salt('bf')),now(),
   '{"provider":"email","providers":["email"]}','{"name":"Elena Popa"}',now()-interval'170 days',now(),false),
  ('00000000-0000-0000-0000-000000000000','10000004-0000-4000-8000-000000000004','authenticated','authenticated',
   'alex.stan@seed.civicom.ro',crypt('parola123',gen_salt('bf')),now(),
   '{"provider":"email","providers":["email"]}','{"name":"Alexandru Stan"}',now()-interval'160 days',now(),false),
  ('00000000-0000-0000-0000-000000000000','10000005-0000-4000-8000-000000000005','authenticated','authenticated',
   'cristina.dima@seed.civicom.ro',crypt('parola123',gen_salt('bf')),now(),
   '{"provider":"email","providers":["email"]}','{"name":"Cristina Dima"}',now()-interval'150 days',now(),false),
  ('00000000-0000-0000-0000-000000000000','10000006-0000-4000-8000-000000000006','authenticated','authenticated',
   'bogdan.rus@seed.civicom.ro',crypt('parola123',gen_salt('bf')),now(),
   '{"provider":"email","providers":["email"]}','{"name":"Bogdan Rus"}',now()-interval'140 days',now(),false),
  ('00000000-0000-0000-0000-000000000000','10000007-0000-4000-8000-000000000007','authenticated','authenticated',
   'maria.toma@seed.civicom.ro',crypt('parola123',gen_salt('bf')),now(),
   '{"provider":"email","providers":["email"]}','{"name":"Maria Toma"}',now()-interval'130 days',now(),false),
  ('00000000-0000-0000-0000-000000000000','10000008-0000-4000-8000-000000000008','authenticated','authenticated',
   'radu.niculescu@seed.civicom.ro',crypt('parola123',gen_salt('bf')),now(),
   '{"provider":"email","providers":["email"]}','{"name":"Radu Niculescu"}',now()-interval'120 days',now(),false),
  ('00000000-0000-0000-0000-000000000000','10000009-0000-4000-8000-000000000009','authenticated','authenticated',
   'andreea.vlad@seed.civicom.ro',crypt('parola123',gen_salt('bf')),now(),
   '{"provider":"email","providers":["email"]}','{"name":"Andreea Vlad"}',now()-interval'110 days',now(),false),
  ('00000000-0000-0000-0000-000000000000','1000000a-0000-4000-8000-00000000000a','authenticated','authenticated',
   'ion.dumitrescu@seed.civicom.ro',crypt('parola123',gen_salt('bf')),now(),
   '{"provider":"email","providers":["email"]}','{"name":"Ion Dumitrescu"}',now()-interval'100 days',now(),false),
  ('00000000-0000-0000-0000-000000000000','1000000b-0000-4000-8000-00000000000b','authenticated','authenticated',
   'larisa.moldovan@seed.civicom.ro',crypt('parola123',gen_salt('bf')),now(),
   '{"provider":"email","providers":["email"]}','{"name":"Larisa Moldovan"}',now()-interval'90 days',now(),false),
  ('00000000-0000-0000-0000-000000000000','1000000c-0000-4000-8000-00000000000c','authenticated','authenticated',
   'cosmin.belu@seed.civicom.ro',crypt('parola123',gen_salt('bf')),now(),
   '{"provider":"email","providers":["email"]}','{"name":"Cosmin Belu"}',now()-interval'80 days',now(),false)
ON CONFLICT (id) DO NOTHING;

-- ─── Demografice ──────────────────────────────────────────────

UPDATE public.users SET county='Ilfov',city='București',biological_sex='female',gender='female',birth_date='1997-03-14',education_level='bachelor',is_profile_complete=true WHERE auth_users_id='10000001-0000-4000-8000-000000000001';
UPDATE public.users SET county='Cluj',city='Cluj-Napoca',biological_sex='male',gender='male',birth_date='1990-07-22',education_level='master',is_profile_complete=true WHERE auth_users_id='10000002-0000-4000-8000-000000000002';
UPDATE public.users SET county='Iași',city='Iași',biological_sex='female',gender='female',birth_date='1983-11-05',education_level='doctorate',is_profile_complete=true WHERE auth_users_id='10000003-0000-4000-8000-000000000003';
UPDATE public.users SET county='Timiș',city='Timișoara',biological_sex='male',gender='male',birth_date='2002-05-30',education_level='high_school',is_profile_complete=true WHERE auth_users_id='10000004-0000-4000-8000-000000000004';
UPDATE public.users SET county='Brașov',city='Brașov',biological_sex='female',gender='non_binary',birth_date='1994-09-18',education_level='bachelor',is_profile_complete=true WHERE auth_users_id='10000005-0000-4000-8000-000000000005';
UPDATE public.users SET county='Constanța',city='Constanța',biological_sex='male',gender='male',birth_date='1980-02-11',education_level='master',is_profile_complete=true WHERE auth_users_id='10000006-0000-4000-8000-000000000006';
UPDATE public.users SET county='Dolj',city='Craiova',biological_sex='female',gender='female',birth_date='2006-06-03',education_level='high_school',is_profile_complete=true WHERE auth_users_id='10000007-0000-4000-8000-000000000007';
UPDATE public.users SET county='Galați',city='Galați',biological_sex='male',gender='male',birth_date='1973-08-27',education_level='bachelor',is_profile_complete=true WHERE auth_users_id='10000008-0000-4000-8000-000000000008';
UPDATE public.users SET county='Bihor',city='Oradea',biological_sex='female',gender='female',birth_date='1998-12-09',education_level='master',is_profile_complete=true WHERE auth_users_id='10000009-0000-4000-8000-000000000009';
UPDATE public.users SET county='Sibiu',city='Sibiu',biological_sex='male',gender='male',birth_date='1987-04-16',education_level='bachelor',is_profile_complete=true WHERE auth_users_id='1000000a-0000-4000-8000-00000000000a';
UPDATE public.users SET county='Bacău',city='Bacău',biological_sex='female',gender='female',birth_date='1992-10-24',education_level='high_school',is_profile_complete=true WHERE auth_users_id='1000000b-0000-4000-8000-00000000000b';
UPDATE public.users SET county='Argeș',city='Pitești',biological_sex='male',gender='male',birth_date='1996-01-07',education_level='bachelor',is_profile_complete=true WHERE auth_users_id='1000000c-0000-4000-8000-00000000000c';

-- ─── 2a. PROTEST completed — Adunare ─────────────────────────

WITH creator AS (SELECT id FROM users WHERE role='admin' LIMIT 1),
     evt AS (
       INSERT INTO events(title,description,category,subcategory,status,creator_id,creator_type,view_count,participants_count,created_at)
       SELECT 'Protest pentru Drepturile Muncitorilor',
         'Adunare publică în Piața Victoriei pentru susținerea drepturilor angajaților din sectorul privat. Am cerut respectarea Codului Muncii, salariu minim decent și eliminarea abuzurilor contractuale.',
         'protest','gathering','completed',id,'user',2840,14,now()-interval'45 days'
       FROM creator RETURNING id
     ),
     pr AS (
       INSERT INTO protests(event_id,date,time_start,time_end,max_participants,safety_rules,contact_person)
       SELECT evt.id,(now()-interval'30 days')::date,'11:00','14:00',200,
         'Eveniment pașnic. Fără violență. Respectați forțele de ordine.','Mihai Antonescu — 0723 456 789'
       FROM evt RETURNING id
     )
INSERT INTO gatherings(protest_id,location) SELECT pr.id,ARRAY[44.4484,26.0980]::float8[] FROM pr;

WITH evt AS (SELECT id FROM events WHERE title='Protest pentru Drepturile Muncitorilor'),
     u01 AS (SELECT id FROM users WHERE auth_users_id='10000001-0000-4000-8000-000000000001'),
     u02 AS (SELECT id FROM users WHERE auth_users_id='10000002-0000-4000-8000-000000000002'),
     u03 AS (SELECT id FROM users WHERE auth_users_id='10000003-0000-4000-8000-000000000003'),
     u04 AS (SELECT id FROM users WHERE auth_users_id='10000004-0000-4000-8000-000000000004'),
     u05 AS (SELECT id FROM users WHERE auth_users_id='10000005-0000-4000-8000-000000000005'),
     u06 AS (SELECT id FROM users WHERE auth_users_id='10000006-0000-4000-8000-000000000006'),
     u07 AS (SELECT id FROM users WHERE auth_users_id='10000007-0000-4000-8000-000000000007'),
     u08 AS (SELECT id FROM users WHERE auth_users_id='10000008-0000-4000-8000-000000000008'),
     u09 AS (SELECT id FROM users WHERE auth_users_id='10000009-0000-4000-8000-000000000009'),
     u10 AS (SELECT id FROM users WHERE auth_users_id='1000000a-0000-4000-8000-00000000000a'),
     u11 AS (SELECT id FROM users WHERE auth_users_id='1000000b-0000-4000-8000-00000000000b'),
     u12 AS (SELECT id FROM users WHERE auth_users_id='1000000c-0000-4000-8000-00000000000c'),
     adm AS (SELECT id FROM users WHERE role='admin' LIMIT 1)
INSERT INTO event_participants(event_id,user_id,status,joined_at)
SELECT * FROM (
  SELECT (SELECT id FROM evt),(SELECT id FROM u01),'joined'::participant_status,now()-interval'44 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u02),'joined',now()-interval'43 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u03),'joined',now()-interval'43 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u04),'joined',now()-interval'42 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u05),'joined',now()-interval'41 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u06),'joined',now()-interval'40 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u07),'joined',now()-interval'39 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u08),'joined',now()-interval'38 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u09),'joined',now()-interval'37 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u10),'joined',now()-interval'36 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u11),'cancelled',now()-interval'35 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u12),'cancelled',now()-interval'34 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM adm),'joined',now()-interval'44 days'
) AS p(event_id,user_id,status,joined_at)
ON CONFLICT(event_id,user_id) DO NOTHING;

WITH evt AS (SELECT id FROM events WHERE title='Protest pentru Drepturile Muncitorilor'),
     u01 AS (SELECT id FROM users WHERE auth_users_id='10000001-0000-4000-8000-000000000001'),
     u02 AS (SELECT id FROM users WHERE auth_users_id='10000002-0000-4000-8000-000000000002'),
     u03 AS (SELECT id FROM users WHERE auth_users_id='10000003-0000-4000-8000-000000000003'),
     u04 AS (SELECT id FROM users WHERE auth_users_id='10000004-0000-4000-8000-000000000004'),
     u05 AS (SELECT id FROM users WHERE auth_users_id='10000005-0000-4000-8000-000000000005'),
     u06 AS (SELECT id FROM users WHERE auth_users_id='10000006-0000-4000-8000-000000000006'),
     u07 AS (SELECT id FROM users WHERE auth_users_id='10000007-0000-4000-8000-000000000007'),
     u08 AS (SELECT id FROM users WHERE auth_users_id='10000008-0000-4000-8000-000000000008')
INSERT INTO event_feedback(event_id,user_id,rating,comment,created_at)
SELECT * FROM (
  SELECT (SELECT id FROM evt),(SELECT id FROM u01),5,'A fost un eveniment bine organizat! Atmosfera a fost incredibilă, oamenii pașnici și determinați.',now()-interval'29 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u02),5,'Impresionant! Mii de oameni uniți pentru o cauză dreaptă. Sper să avem impact real.',now()-interval'29 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u03),4,'Organizat decent, dar microfonul a cedat la un moment dat. Mesajul a ajuns oricum.',now()-interval'28 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u04),4,'Prima mea participare la un protest. M-a inspirat să mă implic mai mult.',now()-interval'28 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u05),5,'Exact ce era nevoie. Solidaritate reală, nu doar vorbe.',now()-interval'27 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u06),3,'Participare bună ca număr, dar fără un follow-up clar nu văd schimbări.',now()-interval'27 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u07),5,'Super! Chiar dacă eram cei mai tineri acolo ne-am simțit bineveniți.',now()-interval'26 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u08),4,NULL,now()-interval'26 days'
) AS f(event_id,user_id,rating,comment,created_at)
ON CONFLICT(event_id,user_id) DO NOTHING;

WITH evt AS (SELECT id FROM events WHERE title='Protest pentru Drepturile Muncitorilor')
INSERT INTO event_view_snapshots(event_id,taken_at,view_count)
SELECT (SELECT id FROM evt),(now()-interval'45 days')+(gs*interval'1 day'),(gs*68+floor(random()*40+10))::int
FROM generate_series(1,35) gs;

-- ─── 2b. PROTEST completed — Marș ────────────────────────────

WITH creator AS (SELECT id FROM users WHERE role='admin' LIMIT 1),
     evt AS (
       INSERT INTO events(title,description,category,subcategory,status,creator_id,creator_type,view_count,participants_count,created_at)
       SELECT 'Marș Verde — Ziua Pământului',
         'Pe 22 aprilie am mărșăluit prin centrul Bucureștiului cerând politici climatice ambițioase. Sute de tineri și familii au transmis un mesaj clar autorităților: schimbarea climatică nu mai poate fi ignorată.',
         'protest','march','completed',id,'user',5120,6,now()-interval'60 days'
       FROM creator RETURNING id
     ),
     pr AS (
       INSERT INTO protests(event_id,date,time_start,time_end,max_participants,contact_person)
       SELECT evt.id,(now()-interval'38 days')::date,'14:00','17:30',1000,'contact@greenpeace.ro'
       FROM evt RETURNING id
     )
INSERT INTO marches(protest_id,locations)
SELECT pr.id,ARRAY[ARRAY[44.4392,26.0969]::float8[],ARRAY[44.4413,26.0987]::float8[],ARRAY[44.4440,26.1012]::float8[],ARRAY[44.4468,26.1025]::float8[],ARRAY[44.4484,26.0980]::float8[]]::float8[][] FROM pr;

WITH evt AS (SELECT id FROM events WHERE title='Marș Verde — Ziua Pământului'),
     u03 AS (SELECT id FROM users WHERE auth_users_id='10000003-0000-4000-8000-000000000003'),
     u05 AS (SELECT id FROM users WHERE auth_users_id='10000005-0000-4000-8000-000000000005'),
     u07 AS (SELECT id FROM users WHERE auth_users_id='10000007-0000-4000-8000-000000000007'),
     u09 AS (SELECT id FROM users WHERE auth_users_id='10000009-0000-4000-8000-000000000009'),
     u11 AS (SELECT id FROM users WHERE auth_users_id='1000000b-0000-4000-8000-00000000000b'),
     adm AS (SELECT id FROM users WHERE role='admin' LIMIT 1)
INSERT INTO event_participants(event_id,user_id,status,joined_at)
SELECT * FROM (
  SELECT (SELECT id FROM evt),(SELECT id FROM u03),'joined'::participant_status,now()-interval'55 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u05),'joined',now()-interval'54 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u07),'joined',now()-interval'53 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u09),'joined',now()-interval'52 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u11),'joined',now()-interval'51 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM adm),'joined',now()-interval'58 days'
) AS p(event_id,user_id,status,joined_at)
ON CONFLICT(event_id,user_id) DO NOTHING;

WITH evt AS (SELECT id FROM events WHERE title='Marș Verde — Ziua Pământului'),
     u03 AS (SELECT id FROM users WHERE auth_users_id='10000003-0000-4000-8000-000000000003'),
     u05 AS (SELECT id FROM users WHERE auth_users_id='10000005-0000-4000-8000-000000000005'),
     u09 AS (SELECT id FROM users WHERE auth_users_id='10000009-0000-4000-8000-000000000009')
INSERT INTO event_feedback(event_id,user_id,rating,comment,created_at)
SELECT * FROM (
  SELECT (SELECT id FROM evt),(SELECT id FROM u03),5,'Un marș de neuitat. Emoționant să văd atâția oameni preocupați de climă.',now()-interval'37 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u05),4,'Bine organizat. Traseu clar, atmosferă pozitivă.',now()-interval'37 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u09),5,'A fost prima mea acțiune climatică și cu siguranță nu ultima.',now()-interval'36 days'
) AS f(event_id,user_id,rating,comment,created_at)
ON CONFLICT(event_id,user_id) DO NOTHING;

WITH evt AS (SELECT id FROM events WHERE title='Marș Verde — Ziua Pământului')
INSERT INTO event_view_snapshots(event_id,taken_at,view_count)
SELECT (SELECT id FROM evt),(now()-interval'60 days')+(gs*interval'1 day'),(gs*82+floor(random()*50+20))::int
FROM generate_series(1,22) gs;

-- ─── 2c. PETIȚIE completed ────────────────────────────────────

WITH creator AS (SELECT id FROM users WHERE role='admin' LIMIT 1),
     evt AS (
       INSERT INTO events(title,description,category,status,creator_id,creator_type,view_count,participants_count,created_at)
       SELECT 'Petiție — Salarii Egale pentru Femei și Bărbați',
         'Am cerut legislație clară pentru a elimina diferențele salariale de gen din România. Cu peste 4.000 de semnături, petiția a fost depusă la Ministerul Muncii.',
         'petition','completed',id,'user',12400,4231,now()-interval'90 days'
       FROM creator RETURNING id
     )
INSERT INTO petitions(event_id,what_is_requested,requested_from,target_signatures,why_important,contact_person)
SELECT evt.id,
  'Adoptarea unui pachet legislativ care să oblige companiile cu peste 50 de angajați să publice rapoarte de egalitate salarială și să aplice sancțiuni pentru diferențe nejustificate.',
  'Ministerul Muncii și Solidarității Sociale',5000,
  'România are un gender pay gap de 12% — printre cele mai ridicate din UE. Femeile câștigă mai puțin la aceleași posturi. Această inegalitate perpetuează sărăcia feminină și limitează independența economică.',
  'egalitate@civicom.ro'
FROM evt;

WITH evt AS (SELECT id FROM events WHERE title='Petiție — Salarii Egale pentru Femei și Bărbați'),
     u01 AS (SELECT id FROM users WHERE auth_users_id='10000001-0000-4000-8000-000000000001'),
     u03 AS (SELECT id FROM users WHERE auth_users_id='10000003-0000-4000-8000-000000000003'),
     u05 AS (SELECT id FROM users WHERE auth_users_id='10000005-0000-4000-8000-000000000005'),
     u07 AS (SELECT id FROM users WHERE auth_users_id='10000007-0000-4000-8000-000000000007'),
     u09 AS (SELECT id FROM users WHERE auth_users_id='10000009-0000-4000-8000-000000000009'),
     u11 AS (SELECT id FROM users WHERE auth_users_id='1000000b-0000-4000-8000-00000000000b'),
     adm AS (SELECT id FROM users WHERE role='admin' LIMIT 1)
INSERT INTO petition_signatures(event_id,user_id,joined_at)
SELECT * FROM (
  SELECT (SELECT id FROM evt),(SELECT id FROM u01),now()-interval'85 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u03),now()-interval'83 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u05),now()-interval'80 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u07),now()-interval'78 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u09),now()-interval'75 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u11),now()-interval'72 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM adm),now()-interval'88 days'
) AS s(event_id,user_id,joined_at)
ON CONFLICT(event_id,user_id) DO NOTHING;

-- ─── 2d. BOYCOTT completed ────────────────────────────────────

WITH creator AS (SELECT id FROM users WHERE role='admin' LIMIT 1),
     evt AS (
       INSERT INTO events(title,description,category,status,creator_id,creator_type,view_count,participants_count,created_at)
       SELECT 'Boicot Bănci care Finanțează Combustibili Fosili',
         'Timp de 6 luni am boicotat băncile care acordă credite masive industriei petroliere și a cărbunelui. Campania a strâns sute de angajamente de schimbare a băncii.',
         'boycott','completed',id,'user',4560,892,now()-interval'200 days'
       FROM creator RETURNING id
     ),
     bo AS (
       INSERT INTO boycotts(event_id,reason,method)
       SELECT evt.id,'Finanțarea industriilor poluante perpetuează criza climatică','Transferă-ți contul la o bancă etică sau credit union local'
       FROM evt RETURNING id
     ),
     b1 AS (INSERT INTO boycott_brands(boycott_id,name) VALUES((SELECT id FROM bo),'BCR') RETURNING id),
     b2 AS (INSERT INTO boycott_brands(boycott_id,name) VALUES((SELECT id FROM bo),'BRD') RETURNING id)
INSERT INTO boycott_alternatives(brand_id,name,link,reason)
VALUES
  ((SELECT id FROM b1),'Patria Credit','https://patriacredit.ro','Bancă etică, fără investiții în fosile'),
  ((SELECT id FROM b1),'Credit Union Unirea','https://google.com','Cooperativă de credit controlată de membri'),
  ((SELECT id FROM b2),'Banca Transilvania (fond ESG)','https://bancatransilvania.ro','Angajament public față de investiții responsabile');

-- ─── 2e. COMUNITAR completed — outdoor ───────────────────────

WITH creator AS (SELECT id FROM users WHERE role='admin' LIMIT 1),
     evt AS (
       INSERT INTO events(title,description,category,subcategory,status,creator_id,creator_type,view_count,participants_count,created_at)
       SELECT 'Plantare de Copaci — Parcul Herăstrău',
         'Am plantat 150 de copaci tineri în zona degradată din nordul Parcului Herăstrău. Voluntari de toate vârstele au participat la această acțiune de refacere a spațiului verde.',
         'community','outdoor','completed',id,'user',1230,6,now()-interval'70 days'
       FROM creator RETURNING id
     ),
     ca AS (INSERT INTO community_activities(event_id,contact_person) SELECT evt.id,'voluntari@civicom.ro' FROM evt RETURNING id)
INSERT INTO outdoor_activities(community_activity_id,location,date,time_start,time_end,recommended_equipment,what_organizer_offers,max_participants)
SELECT ca.id,ARRAY[44.4722,26.0821]::float8[],(now()-interval'50 days')::date,'09:00','13:00',
  'Mănuși de grădină, haine vechi, cizme dacă aveți','Copaci, unelte, pământ fertilizat, apă și gustări pentru toți voluntarii. Certificate de voluntariat.',80
FROM ca;

WITH evt AS (SELECT id FROM events WHERE title='Plantare de Copaci — Parcul Herăstrău'),
     u02 AS (SELECT id FROM users WHERE auth_users_id='10000002-0000-4000-8000-000000000002'),
     u04 AS (SELECT id FROM users WHERE auth_users_id='10000004-0000-4000-8000-000000000004'),
     u06 AS (SELECT id FROM users WHERE auth_users_id='10000006-0000-4000-8000-000000000006'),
     u08 AS (SELECT id FROM users WHERE auth_users_id='10000008-0000-4000-8000-000000000008'),
     u10 AS (SELECT id FROM users WHERE auth_users_id='1000000a-0000-4000-8000-00000000000a'),
     adm AS (SELECT id FROM users WHERE role='admin' LIMIT 1)
INSERT INTO event_participants(event_id,user_id,status,joined_at)
SELECT * FROM (
  SELECT (SELECT id FROM evt),(SELECT id FROM u02),'joined'::participant_status,now()-interval'68 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u04),'joined',now()-interval'67 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u06),'joined',now()-interval'66 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u08),'joined',now()-interval'65 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u10),'joined',now()-interval'64 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM adm),'joined',now()-interval'69 days'
) AS p(event_id,user_id,status,joined_at)
ON CONFLICT(event_id,user_id) DO NOTHING;

-- ─── 2f. CHARITY CONCERT completed ───────────────────────────

WITH creator AS (SELECT id FROM users WHERE role='admin' LIMIT 1),
     evt AS (
       INSERT INTO events(title,description,category,subcategory,status,creator_id,creator_type,view_count,participants_count,created_at)
       SELECT 'Gală Caritabilă — 20 de Ani Salvați Copiii',
         'Gala aniversară a strâns fonduri pentru programele de educație timpurie. Concert live, tombolă, și momente emoționante cu beneficiarii programelor noastre.',
         'charity','concert','completed',id,'user',9800,5,now()-interval'100 days'
       FROM creator RETURNING id
     ),
     ce AS (INSERT INTO charity_events(event_id,target_amount,collected_amount) SELECT evt.id,80000,74500 FROM evt RETURNING id)
INSERT INTO charity_concerts(charity_event_id,location,date,time_start,time_end,performers,ticket_price,ticket_link,max_participants)
SELECT ce.id,ARRAY[44.4351,26.1031]::float8[],(now()-interval'75 days')::date,'18:00','23:00',
  ARRAY['Smiley','Carla''s Dreams','Antonia'],120,'https://bilete.ro/gala-salvati-copiii',600
FROM ce;

WITH evt AS (SELECT id FROM events WHERE title='Gală Caritabilă — 20 de Ani Salvați Copiii'),
     u01 AS (SELECT id FROM users WHERE auth_users_id='10000001-0000-4000-8000-000000000001'),
     u04 AS (SELECT id FROM users WHERE auth_users_id='10000004-0000-4000-8000-000000000004'),
     u07 AS (SELECT id FROM users WHERE auth_users_id='10000007-0000-4000-8000-000000000007'),
     u10 AS (SELECT id FROM users WHERE auth_users_id='1000000a-0000-4000-8000-00000000000a'),
     adm AS (SELECT id FROM users WHERE role='admin' LIMIT 1)
INSERT INTO event_participants(event_id,user_id,status,joined_at)
SELECT * FROM (
  SELECT (SELECT id FROM evt),(SELECT id FROM u01),'joined'::participant_status,now()-interval'98 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u04),'joined',now()-interval'97 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u07),'joined',now()-interval'96 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u10),'joined',now()-interval'95 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM adm),'joined',now()-interval'99 days'
) AS p(event_id,user_id,status,joined_at)
ON CONFLICT(event_id,user_id) DO NOTHING;

WITH evt AS (SELECT id FROM events WHERE title='Gală Caritabilă — 20 de Ani Salvați Copiii'),
     u01 AS (SELECT id FROM users WHERE auth_users_id='10000001-0000-4000-8000-000000000001'),
     u04 AS (SELECT id FROM users WHERE auth_users_id='10000004-0000-4000-8000-000000000004'),
     u07 AS (SELECT id FROM users WHERE auth_users_id='10000007-0000-4000-8000-000000000007'),
     adm AS (SELECT id FROM users WHERE role='admin' LIMIT 1)
INSERT INTO event_feedback(event_id,user_id,rating,comment,created_at)
SELECT * FROM (
  SELECT (SELECT id FROM evt),(SELECT id FROM u01),5,'Seară de vis! Artiștii au donat și ei o parte din onorariu. Lacrimile au curs.',now()-interval'74 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u04),5,'A meritat fiecare leu din bilet. Știind că ajutăm copii e de neuitat.',now()-interval'74 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u07),4,'Super eveniment! Puțin aglomerat la intrare dar totul a decurs bine.',now()-interval'73 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM adm),5,NULL,now()-interval'73 days'
) AS f(event_id,user_id,rating,comment,created_at)
ON CONFLICT(event_id,user_id) DO NOTHING;

-- ─── 2g. WORKSHOP completed ──────────────────────────────────

WITH creator AS (SELECT id FROM users WHERE role='admin' LIMIT 1),
     evt AS (
       INSERT INTO events(title,description,category,subcategory,status,creator_id,creator_type,view_count,participants_count,created_at)
       SELECT 'Workshop Drepturile Consumatorului',
         'Atelier practic despre drepturile tale ca și consumator: cum să faci reclamații, cum să recuperezi banii pentru produse defecte, cum să te protejezi de clauze abuzive.',
         'community','workshop','completed',id,'user',890,4,now()-interval'80 days'
       FROM creator RETURNING id
     ),
     ca AS (INSERT INTO community_activities(event_id,contact_person) SELECT evt.id,'workshop@anpc-voluntar.ro' FROM evt RETURNING id)
INSERT INTO workshops(community_activity_id,location,date,time_start,time_end,max_participants,what_organizer_offers)
SELECT ca.id,ARRAY[44.4268,26.0950]::float8[],(now()-interval'60 days')::date,'10:00','14:00',30,'Materiale tipărite, cafea, ceai. Certificat de participare.'
FROM ca;

WITH evt AS (SELECT id FROM events WHERE title='Workshop Drepturile Consumatorului'),
     u02 AS (SELECT id FROM users WHERE auth_users_id='10000002-0000-4000-8000-000000000002'),
     u06 AS (SELECT id FROM users WHERE auth_users_id='10000006-0000-4000-8000-000000000006'),
     u10 AS (SELECT id FROM users WHERE auth_users_id='1000000a-0000-4000-8000-00000000000a'),
     adm AS (SELECT id FROM users WHERE role='admin' LIMIT 1)
INSERT INTO event_participants(event_id,user_id,status,joined_at)
SELECT * FROM (
  SELECT (SELECT id FROM evt),(SELECT id FROM u02),'joined'::participant_status,now()-interval'78 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u06),'joined',now()-interval'77 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM u10),'joined',now()-interval'76 days'
  UNION ALL SELECT (SELECT id FROM evt),(SELECT id FROM adm),'joined',now()-interval'79 days'
) AS p(event_id,user_id,status,joined_at)
ON CONFLICT(event_id,user_id) DO NOTHING;

-- ─── 2h. LIVESTREAM CARITABIL completed ──────────────────────

WITH creator AS (SELECT id FROM users WHERE role='admin' LIMIT 1),
     evt AS (
       INSERT INTO events(title,description,category,subcategory,status,creator_id,creator_type,view_count,participants_count,created_at)
       SELECT 'Hackathon Live — Cod pentru Bine',
         'Am codat 12 ore live pe Twitch pentru a dezvolta o aplicație gratuită de orientare vocațională pentru liceeni din medii defavorizate. Donațiile acoperă hosting-ul pe 5 ani.',
         'charity','livestream','completed',id,'user',6700,1823,now()-interval'55 days'
       FROM creator RETURNING id
     ),
     ce AS (INSERT INTO charity_events(event_id,target_amount,collected_amount) SELECT evt.id,15000,17200 FROM evt RETURNING id)
INSERT INTO charity_livestreams(charity_event_id,stream_link,cause,time_start,time_end,guests)
SELECT ce.id,'https://twitch.tv/civicom_hackathon','Platformă de orientare vocațională gratuită pentru elevii din medii defavorizate.','10:00','22:00',
  ARRAY['Mihai Bojin','Andreea Udrea','Bogdan Lazăr']
FROM ce;

-- ─── 3. EVENIMENTE PENDING ────────────────────────────────────

WITH creator AS (SELECT id FROM users WHERE role='admin' LIMIT 1),
     evt AS (
       INSERT INTO events(title,description,category,subcategory,status,creator_id,creator_type,created_at)
       SELECT 'Protest Anti-Corupție — Piața Universității',
         'Ne adunăm pentru a cere demisia miniștrilor implicați în scandalul achizițiilor publice. Aduceți pancarte. Veniți în familie.',
         'protest','gathering','pending',id,'user',now()-interval'2 days'
       FROM creator RETURNING id
     ),
     pr AS (INSERT INTO protests(event_id,date,time_start,max_participants,contact_person) SELECT evt.id,CURRENT_DATE+14,'17:00',5000,'protest@civicom.ro' FROM evt RETURNING id)
INSERT INTO gatherings(protest_id,location) SELECT pr.id,ARRAY[44.4355,26.1010]::float8[] FROM pr;

WITH creator AS (SELECT id FROM users WHERE role='admin' LIMIT 1),
     evt AS (
       INSERT INTO events(title,description,category,subcategory,status,creator_id,creator_type,created_at)
       SELECT 'Pichet Spital Regional Cluj',
         'Pichet pașnic în fața Ministerului Sănătății pentru deblocarea fondurilor pentru Spitalul Regional Cluj promis de 15 ani.',
         'protest','picket','pending',id,'user',now()-interval'1 day'
       FROM creator RETURNING id
     ),
     pr AS (INSERT INTO protests(event_id,date,time_start,time_end,max_participants,contact_person) SELECT evt.id,CURRENT_DATE+7,'09:00','18:00',300,'sanatate@civicom.ro' FROM evt RETURNING id)
INSERT INTO pickets(protest_id,location) SELECT pr.id,ARRAY[44.4391,26.0916]::float8[] FROM pr;

WITH creator AS (SELECT id FROM users WHERE role='admin' LIMIT 1),
     evt AS (
       INSERT INTO events(title,description,category,status,creator_id,creator_type,created_at)
       SELECT 'Reducerea TVA la 5% pentru Cărți',
         'Cărțile sunt bunuri culturale esențiale. Cerem reducerea TVA de la 9% la 5% pentru toate tipurile de publicații, inclusiv ebooks.',
         'petition','pending',id,'user',now()-interval'3 days'
       FROM creator RETURNING id
     )
INSERT INTO petitions(event_id,what_is_requested,requested_from,target_signatures,why_important)
SELECT evt.id,'Modificarea Codului Fiscal pentru reducerea cotei TVA la publicații la 5%.','Ministerul Finanțelor Publice',20000,'România are una dintre cele mai ridicate TVA pe cărți din UE. Accesul la cultură nu trebuie taxat excesiv.'
FROM evt;

WITH creator AS (SELECT id FROM users WHERE role='admin' LIMIT 1),
     evt AS (
       INSERT INTO events(title,description,category,status,creator_id,creator_type,created_at)
       SELECT 'Boicot Supermarketuri care Refuză Reciclarea',
         'Marile lanțuri de supermarketuri au blocat implementarea sistemului Garanție-Returnare. Refuzăm să cumpărăm până când adoptă programul.',
         'boycott','pending',id,'user',now()-interval'1 day'
       FROM creator RETURNING id
     ),
     bo AS (INSERT INTO boycotts(event_id,reason,method) SELECT evt.id,'Sabotarea sistemului de reciclare Garanție-Returnare','Nu cumpăra din magazinele care nu au puncte de returnare sticle' FROM evt RETURNING id),
     b1 AS (INSERT INTO boycott_brands(boycott_id,name) VALUES((SELECT id FROM bo),'Lidl România') RETURNING id)
INSERT INTO boycott_alternatives(brand_id,name,link,reason)
SELECT (SELECT id FROM b1),'Piețele locale de cartier','https://google.com','Produse locale fără ambalaje excesive';

WITH creator AS (SELECT id FROM users WHERE role='admin' LIMIT 1),
     evt AS (
       INSERT INTO events(title,description,category,subcategory,status,creator_id,creator_type,created_at)
       SELECT 'Fond Urgență — Familii Sinistrate Vrancea',
         'Cutremurul din luna trecută a lăsat 40 de familii fără adăpost în județul Vrancea. Strângem donații monetare pentru reconstrucție.',
         'community','donations','pending',id,'user',now()-interval'4 days'
       FROM creator RETURNING id
     ),
     ca AS (INSERT INTO community_activities(event_id,contact_person) SELECT evt.id,'urgenta@crucearosie.ro' FROM evt RETURNING id)
INSERT INTO donations(community_activity_id,donation_type,target_amount) SELECT ca.id,'monetary',50000 FROM ca;

WITH creator AS (SELECT id FROM users WHERE role='admin' LIMIT 1),
     evt AS (
       INSERT INTO events(title,description,category,subcategory,status,creator_id,creator_type,created_at)
       SELECT 'Meet & Greet — Campioni Olimpici pentru Copii',
         'Sportivi olimpici români vin să petreacă o zi cu copiii din centrele de plasament. Fonduri strânse merg în echipamente sportive pentru 10 centre.',
         'charity','meet_greet','pending',id,'user',now()-interval'2 days'
       FROM creator RETURNING id
     ),
     ce AS (INSERT INTO charity_events(event_id,target_amount,collected_amount) SELECT evt.id,20000,0 FROM evt RETURNING id)
INSERT INTO meet_greets(charity_event_id,location,date,time_start,time_end,guests,ticket_price,ticket_link,max_participants)
SELECT ce.id,ARRAY[44.4268,26.1025]::float8[],CURRENT_DATE+25,'14:00','18:00',
  ARRAY['David Popovici','Simona Halep (video call)','Florin Mergea'],0,NULL,150
FROM ce;

WITH creator AS (SELECT id FROM users WHERE role='admin' LIMIT 1),
     evt AS (
       INSERT INTO events(title,description,category,subcategory,status,creator_id,creator_type,created_at)
       SELECT 'Cros Caritabil — Pădurea Băneasa',
         'Alergăm 5km sau 10km prin Pădurea Băneasa. Fiecare participant donează minim 20 RON pentru reîmpăduriri. Toți terminăm, toți câștigăm.',
         'charity','sport','pending',id,'user',now()-interval'3 days'
       FROM creator RETURNING id
     ),
     ce AS (INSERT INTO charity_events(event_id,target_amount,collected_amount) SELECT evt.id,25000,0 FROM evt RETURNING id)
INSERT INTO sports_activities(charity_event_id,location,date,time_start,time_end,ticket_price,max_participants)
SELECT ce.id,ARRAY[44.5022,26.0956]::float8[],CURRENT_DATE+35,'09:00','13:00',20,400
FROM ce;

-- ─── 4. EVENIMENTE REJECTED ───────────────────────────────────

WITH creator AS (SELECT id FROM users WHERE role='admin' LIMIT 1),
     evt AS (
       INSERT INTO events(title,description,category,subcategory,status,creator_id,creator_type,created_at)
       SELECT 'Marș Blocarea Autostrăzii A1',
         'Marș de protest care intenționează blocarea traficului pe Autostrada A1 pentru a atrage atenția asupra stării proaste a infrastructurii.',
         'protest','march','rejected',id,'user',now()-interval'20 days'
       FROM creator RETURNING id
     ),
     pr AS (INSERT INTO protests(event_id,date,time_start,max_participants,contact_person) SELECT evt.id,CURRENT_DATE+5,'08:00',100,'contact@seed.ro' FROM evt RETURNING id)
INSERT INTO marches(protest_id,locations)
SELECT pr.id,ARRAY[ARRAY[44.4268,26.0500]::float8[],ARRAY[44.4300,26.0600]::float8[]]::float8[][] FROM pr;

WITH creator AS (SELECT id FROM users WHERE role='admin' LIMIT 1),
     evt AS (
       INSERT INTO events(title,description,category,status,creator_id,creator_type,created_at)
       SELECT 'Interzicerea Completă a Câinilor în Parcuri',
         'Solicităm interzicerea accesului câinilor în toate parcurile publice din București fără excepție.',
         'petition','rejected',id,'user',now()-interval'30 days'
       FROM creator RETURNING id
     )
INSERT INTO petitions(event_id,what_is_requested,requested_from,target_signatures,why_important)
SELECT evt.id,'Modificarea regulamentului de acces în parcuri pentru interzicerea câinilor.','Primăria Municipiului București',1000,'Siguranța copiilor și curățenia spațiilor publice.'
FROM evt;

WITH creator AS (SELECT id FROM users WHERE role='admin' LIMIT 1),
     evt AS (
       INSERT INTO events(title,description,category,subcategory,status,creator_id,creator_type,created_at)
       SELECT 'Workshop Tehnici de Manipulare Politică',
         'Atelier despre cum funcționează manipularea în politică și media — conținut informativ și educațional pentru tineri.',
         'community','workshop','rejected',id,'user',now()-interval'15 days'
       FROM creator RETURNING id
     ),
     ca AS (INSERT INTO community_activities(event_id) SELECT evt.id FROM evt RETURNING id)
INSERT INTO workshops(community_activity_id,location,date,time_start,max_participants)
SELECT ca.id,ARRAY[44.4268,26.1025]::float8[],CURRENT_DATE+10,'18:00',50 FROM ca;

WITH creator AS (SELECT id FROM users WHERE role='admin' LIMIT 1),
     evt AS (
       INSERT INTO events(title,description,category,status,creator_id,creator_type,created_at)
       SELECT 'Boicot Toate Produsele Importate',
         'Boicot total al tuturor produselor importate pentru a susține exclusiv economia românească.',
         'boycott','rejected',id,'user',now()-interval'25 days'
       FROM creator RETURNING id
     ),
     bo AS (INSERT INTO boycotts(event_id,reason,method) SELECT evt.id,'Susținerea economiei naționale','Nu cumpăra nimic din import' FROM evt RETURNING id),
     b1 AS (INSERT INTO boycott_brands(boycott_id,name) VALUES((SELECT id FROM bo),'Toate importurile') RETURNING id)
INSERT INTO boycott_alternatives(brand_id,name,link,reason)
SELECT (SELECT id FROM b1),'Produse românești','https://google.com','Susții economia locală';

-- ─── 5. EVENIMENT CONTESTED ───────────────────────────────────

WITH creator AS (SELECT id FROM users WHERE role='admin' LIMIT 1),
     evt AS (
       INSERT INTO events(title,description,category,subcategory,status,creator_id,creator_type,created_at)
       SELECT 'Adunare pentru Transparența Bugetului Local',
         'Solicităm Primăriei să publice în detaliu toate cheltuielile din bugetul local al Sectorului 1. Eveniment complet pașnic, notificat la poliție.',
         'protest','gathering','contested',id,'user',now()-interval'35 days'
       FROM creator RETURNING id
     ),
     pr AS (
       INSERT INTO protests(event_id,date,time_start,time_end,max_participants,safety_rules,contact_person)
       SELECT evt.id,CURRENT_DATE+20,'16:00','19:00',300,
         'Eveniment notificat oficial. Fără violență. Peaceful assembly.','transparenta@civicom.ro'
       FROM evt RETURNING id
     )
INSERT INTO gatherings(protest_id,location) SELECT pr.id,ARRAY[44.4523,26.0987]::float8[] FROM pr;

WITH evt AS (SELECT id FROM events WHERE title='Adunare pentru Transparența Bugetului Local'),
     creator AS (SELECT id FROM users WHERE role='admin' LIMIT 1)
INSERT INTO appeals(event_id,user_id,reason,status,created_at)
SELECT evt.id,creator.id,
  'Evenimentul a fost respins fără o motivație clară. Adunarea este complet legală, notificată la poliție conform Legii 60/1991, și nu conține niciun element care să justifice respingerea. Cer reanalizarea dosarului.',
  'under_review',now()-interval'28 days'
FROM evt,creator;

-- ─── 6. SYNC participants_count ──────────────────────────────

UPDATE events SET participants_count=(
  SELECT COUNT(*) FROM event_participants WHERE event_participants.event_id=events.id AND status='joined'
) WHERE title IN(
  'Protest pentru Drepturile Muncitorilor','Marș Verde — Ziua Pământului',
  'Plantare de Copaci — Parcul Herăstrău','Gală Caritabilă — 20 de Ani Salvați Copiii','Workshop Drepturile Consumatorului'
);

UPDATE events SET participants_count=(
  SELECT COUNT(*) FROM petition_signatures WHERE petition_signatures.event_id=events.id
) WHERE title='Petiție — Salarii Egale pentru Femei și Bărbați';
