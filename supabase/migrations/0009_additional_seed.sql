-- ============================================================
-- SEED SUPLIMENTAR: 2 ONG-uri + 16 evenimente (toate subtipurile)
-- ============================================================

-- ─── 2 ONG-uri noi ───────────────────────────────────────────

WITH creator AS (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
INSERT INTO organizations (name, description, website, owner_id, status)
SELECT
  'Greenpeace România',
  'Organizație internațională de mediu, activă în România din 1998. Luptăm pentru un viitor verde și just prin acțiuni nonviolente.',
  'https://www.greenpeace.org/romania',
  creator.id,
  'approved'
FROM creator
ON CONFLICT DO NOTHING;

WITH creator AS (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
INSERT INTO organizations (name, description, website, owner_id, status)
SELECT
  'Salvați Copiii România',
  'Organizație umanitară dedicată apărării drepturilor copilului și reducerii sărăciei infantile în România.',
  'https://salvaticopiii.ro',
  creator.id,
  'approved'
FROM creator
ON CONFLICT DO NOTHING;

-- membri admin în ONG-urile noi
WITH org AS (SELECT id FROM organizations WHERE name = 'Greenpeace România' LIMIT 1),
     usr AS (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
INSERT INTO organization_members (organization_id, user_id, role)
SELECT org.id, usr.id, 'admin' FROM org, usr
ON CONFLICT DO NOTHING;

WITH org AS (SELECT id FROM organizations WHERE name = 'Salvați Copiii România' LIMIT 1),
     usr AS (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
INSERT INTO organization_members (organization_id, user_id, role)
SELECT org.id, usr.id, 'admin' FROM org, usr
ON CONFLICT DO NOTHING;

-- ─── PROTESTE ────────────────────────────────────────────────

-- Protest 2: Marș (Greenpeace)
WITH org AS (SELECT id FROM organizations WHERE name = 'Greenpeace România' LIMIT 1),
     creator AS (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
     evt AS (
       INSERT INTO events (title, description, category, subcategory, status, creator_id, creator_type, organization_id, view_count, participants_count)
       SELECT
         'Marș pentru Climă — București',
         'Ne adunăm în fața Guvernului și pornim împreună spre Piața Victoriei pentru a cere zero emisii până în 2040. Fiecare pas contează. Clima nu are timp.',
         'protest', 'march', 'approved', creator.id, 'ngo', org.id, 1240, 312
       FROM creator, org RETURNING id
     ),
     pr AS (
       INSERT INTO protests (event_id, date, time_start, time_end, max_participants, safety_rules, contact_person)
       SELECT evt.id, CURRENT_DATE + 21, '14:00', '17:00', 2000,
              'Rămâneți pe trotuar. Nu blocați traficul. Purtați veste reflectorizante. Respectați indicațiile marshallilor.',
              'Marius Constantin — 0722 111 222'
       FROM evt RETURNING id
     )
INSERT INTO marches (protest_id, locations)
SELECT pr.id, ARRAY[
  ARRAY[44.4392, 26.0969]::float8[],
  ARRAY[44.4413, 26.0987]::float8[],
  ARRAY[44.4440, 26.1012]::float8[],
  ARRAY[44.4468, 26.1025]::float8[]
]::float8[][] FROM pr;

-- Protest 3: Pichet
WITH creator AS (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
     evt AS (
       INSERT INTO events (title, description, category, subcategory, status, creator_id, creator_type, view_count, participants_count)
       SELECT
         'Pichet Solidaritate Minerit',
         'Pichet pașnic în fața sediului Ministerului Economiei pentru susținerea drepturilor minerilor din Valea Jiului. Solidaritate înseamnă prezență.',
         'protest', 'picket', 'approved', id, 'user', 430, 67
       FROM creator RETURNING id
     ),
     pr AS (
       INSERT INTO protests (event_id, date, time_start, time_end, max_participants, contact_person)
       SELECT evt.id, CURRENT_DATE + 10, '09:00', '18:00', 200, 'Gheorghe Văduva — 0745 333 444'
       FROM evt RETURNING id
     )
INSERT INTO pickets (protest_id, location)
SELECT pr.id, ARRAY[44.4384, 26.0934]::float8[] FROM pr;

-- Protest 4: Adunare
WITH creator AS (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
     evt AS (
       INSERT INTO events (title, description, category, subcategory, status, creator_id, creator_type, view_count, participants_count)
       SELECT
         'Adunare Publică — Apărarea Pădurilor',
         'Ne adunăm în Parcul Cișmigiu pentru a cere oprirea defrișărilor ilegale și responsabilizarea autorităților. Aduceți familiile, aduceți speranța.',
         'protest', 'gathering', 'approved', id, 'user', 876, 198
       FROM creator RETURNING id
     ),
     pr AS (
       INSERT INTO protests (event_id, date, time_start, time_end, max_participants, safety_rules, recommended_equipment, contact_person)
       SELECT evt.id, CURRENT_DATE + 7, '11:00', '13:30', 500,
              'Eveniment pașnic și familist. Zero violență.',
              'Apă, pălărie, cremă de soare. Aduceți pancarte.',
              'Elena Marinescu — 0733 555 666'
       FROM evt RETURNING id
     )
INSERT INTO gatherings (protest_id, location)
SELECT pr.id, ARRAY[44.4331, 26.0897]::float8[] FROM pr;

-- ─── BOYCOTTURI ──────────────────────────────────────────────

-- Boycott 1
WITH creator AS (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
     evt AS (
       INSERT INTO events (title, description, category, status, creator_id, creator_type, view_count, participants_count)
       SELECT
         'Boicot Fast Fashion — H&M, Zara, Shein',
         'Industria fast fashion produce 10% din emisiile globale de CO₂ și poluează oceanele. Refuzăm să mai finanțăm această industrie. Cumpărăm second-hand, local sau deloc.',
         'boycott', 'approved', id, 'user', 3210, 1456
       FROM creator RETURNING id
     ),
     bo AS (
       INSERT INTO boycotts (event_id, reason, method)
       SELECT evt.id, 'Poluare masivă și exploatarea muncii', 'Refuza cumpărăturile, promovează alternativele locale'
       FROM evt RETURNING id
     ),
     b1 AS (
       INSERT INTO boycott_brands (boycott_id, name, link) VALUES
       ((SELECT id FROM bo), 'H&M', 'https://hm.com') RETURNING id
     ),
     b2 AS (
       INSERT INTO boycott_brands (boycott_id, name, link) VALUES
       ((SELECT id FROM bo), 'Zara', 'https://zara.com') RETURNING id
     ),
     b3 AS (
       INSERT INTO boycott_brands (boycott_id, name, link) VALUES
       ((SELECT id FROM bo), 'Shein', 'https://shein.com') RETURNING id
     )
INSERT INTO boycott_alternatives (brand_id, name, link, reason)
VALUES
  ((SELECT id FROM b1), 'Humana Second Hand', 'https://humana.ro', 'Haine second-hand la prețuri mici, impact zero'),
  ((SELECT id FROM b1), 'Local boutique Floreasca', 'https://google.com', 'Creatori locali, materiale naturale'),
  ((SELECT id FROM b2), 'Piața de vechituri Obor', 'https://google.com', 'Economie circulară reală'),
  ((SELECT id FROM b3), 'Vinted', 'https://vinted.ro', 'Revânzare îmbrăcăminte între persoane fizice');

-- Boycott 2
WITH creator AS (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
     org AS (SELECT id FROM organizations WHERE name = 'Greenpeace România' LIMIT 1),
     evt AS (
       INSERT INTO events (title, description, category, status, creator_id, creator_type, organization_id, view_count, participants_count)
       SELECT
         'Boicot Plastic de Unică Folosință',
         'Plasticul de unică folosință ucide ecosistemele marine. Boicotăm brandurile care refuză să renunțe la ambalajele inutile, inclusiv unele multinaționale alimentare prezente în România.',
         'boycott', 'approved', creator.id, 'ngo', org.id, 1870, 934
       FROM creator, org RETURNING id
     ),
     bo AS (
       INSERT INTO boycotts (event_id, reason, method)
       SELECT evt.id, 'Poluare cu plastic — impact marin devastator', 'Alege produse vrac sau ambalaje biodegradabile'
       FROM evt RETURNING id
     ),
     b1 AS (
       INSERT INTO boycott_brands (boycott_id, name) VALUES
       ((SELECT id FROM bo), 'Coca-Cola România') RETURNING id
     ),
     b2 AS (
       INSERT INTO boycott_brands (boycott_id, name) VALUES
       ((SELECT id FROM bo), 'Nestlé România') RETURNING id
     )
INSERT INTO boycott_alternatives (brand_id, name, link, reason)
VALUES
  ((SELECT id FROM b1), 'Apa de la robinet filtrată', 'https://google.com', 'Zero plastic, cost aproape zero'),
  ((SELECT id FROM b1), 'Bere artizanală la draft', 'https://google.com', 'Susții economia locală și eviți dozele'),
  ((SELECT id FROM b2), 'Lapte de la furnizori locali', 'https://google.com', 'Ambalaj sticlă returnabilă');

-- Boycott 3
WITH creator AS (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
     evt AS (
       INSERT INTO events (title, description, category, status, creator_id, creator_type, view_count, participants_count)
       SELECT
         'Boicot Lanțuri de Fast Food',
         'McDonald''s și KFC generează tone de deșeuri zilnic în România și exploatează forța de muncă tânără. Există alternative locale mai bune.',
         'boycott', 'approved', id, 'user', 2100, 780
       FROM creator RETURNING id
     ),
     bo AS (
       INSERT INTO boycotts (event_id, reason, method)
       SELECT evt.id, 'Deșeuri masive + condiții precare de muncă', 'Alege restaurante locale și gătit acasă'
       FROM evt RETURNING id
     ),
     b1 AS (
       INSERT INTO boycott_brands (boycott_id, name) VALUES
       ((SELECT id FROM bo), 'McDonald''s') RETURNING id
     ),
     b2 AS (
       INSERT INTO boycott_brands (boycott_id, name) VALUES
       ((SELECT id FROM bo), 'KFC') RETURNING id
     )
INSERT INTO boycott_alternatives (brand_id, name, link, reason)
VALUES
  ((SELECT id FROM b1), 'Shaorma de la colț', 'https://google.com', 'Local, rapid, fără ambalaje în exces'),
  ((SELECT id FROM b1), 'Gătit acasă', 'https://google.com', 'Econom, sănătos, sustenabil'),
  ((SELECT id FROM b2), 'Restaurante românești tradiționale', 'https://google.com', 'Susții economia locală');

-- ─── PETIȚII ─────────────────────────────────────────────────

-- Petiție 1
WITH creator AS (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
     org AS (SELECT id FROM organizations WHERE name = 'Salvați Copiii România' LIMIT 1),
     evt AS (
       INSERT INTO events (title, description, category, status, creator_id, creator_type, organization_id, view_count, participants_count)
       SELECT
         'Petiție — Wifi Gratuit în Toate Școlile',
         'Accesul la internet a devenit o necesitate educațională. Mii de elevi din mediul rural nu au acces la resurse digitale. Cerem conectivitate gratuită în toate unitățile de învățământ preuniversitar.',
         'petition', 'approved', creator.id, 'ngo', org.id, 5430, 8921
       FROM creator, org RETURNING id
     )
INSERT INTO petitions (event_id, what_is_requested, requested_from, target_signatures, why_important, contact_person)
SELECT
  evt.id,
  'Instalarea infrastructurii WiFi gratuit în toate cele 7.000+ unități de învățământ preuniversitar din România până la 1 septembrie 2026.',
  'Ministerul Educației Naționale + Ministerul Comunicațiilor',
  10000,
  'Pandemia a arătat că fără internet, educația se oprește. 40% din elevii rurali nu au acces la internet acasă. Această inegalitate digitală perpetuează sărăcia generațională.',
  'contact@salvaticopiii.ro'
FROM evt;

-- Petiție 2
WITH creator AS (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
     evt AS (
       INSERT INTO events (title, description, category, status, creator_id, creator_type, view_count, participants_count)
       SELECT
         'Legalizarea Bicicletelor Electrice pe Piste',
         'Trotinetele electrice au piste, dar bicicletele electrice nu! Cerem recunoașterea legală și accesul pe infrastructura ciclabilă pentru toate vehiculele electrice ușoare.',
         'petition', 'approved', id, 'user', 2340, 3456
       FROM creator RETURNING id
     )
INSERT INTO petitions (event_id, what_is_requested, requested_from, target_signatures, why_important)
SELECT
  evt.id,
  'Modificarea OUG 195/2002 pentru includerea bicicletelor electrice în categoria vehiculelor admise pe pistele de biciclete.',
  'Ministerul Transporturilor și Infrastructurii',
  5000,
  'România are obligații europene privind mobilitatea verde. Bicicletele electrice sunt mai sigure decât trotinetele și reduc ambuteiajele urban. Legislația actuală este contradictorie și descurajează transportul curat.'
FROM evt;

-- Petiție 3
WITH creator AS (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
     evt AS (
       INSERT INTO events (title, description, category, status, creator_id, creator_type, view_count, participants_count)
       SELECT
         'Stop Publicitate Alcool Lângă Școli',
         'Bannere și reclame pentru alcool și tutun sunt amplasate la 20m de intrări în școli. Cerem distanță minimă de 300m și interdicție completă în vecinătatea unităților de învățământ.',
         'petition', 'approved', id, 'user', 1890, 4102
       FROM creator RETURNING id
     )
INSERT INTO petitions (event_id, what_is_requested, requested_from, target_signatures, why_important, contact_person)
SELECT
  evt.id,
  'Interdicția reclamelor pentru alcool, tutun și jocuri de noroc în raza de 300m față de orice unitate de învățământ sau teren de joacă.',
  'Consiliul Național al Audiovizualului + Ministerul Sănătății',
  3000,
  'Studiile arată că expunerea timpurie la publicitate pentru substanțe adictive crește rata consumului în rândul adolescenților. România are una dintre cele mai permisive legislații din UE în acest domeniu.',
  'Andreea Florescu — 0766 789 012'
FROM evt;

-- ─── ACTIVITĂȚI COMUNITARE ───────────────────────────────────

-- Comunitar 1: Outdoor
WITH creator AS (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
     evt AS (
       INSERT INTO events (title, description, category, subcategory, status, creator_id, creator_type, view_count, participants_count)
       SELECT
         'Curățenie în Parcul Tineretului',
         'Ne adunăm voluntari pentru a colecta deșeuri, plantăm flori sezoniere și reparăm băncile vandalizate din Parcul Tineretului. Adu mănuși și energie bună!',
         'community', 'outdoor', 'approved', id, 'user', 543, 87
       FROM creator RETURNING id
     ),
     ca AS (
       INSERT INTO community_activities (event_id, contact_person)
       SELECT evt.id, 'Bogdan Ionescu — 0721 444 555' FROM evt RETURNING id
     )
INSERT INTO outdoor_activities (community_activity_id, location, date, time_start, time_end, recommended_equipment, what_organizer_offers, max_participants)
SELECT
  ca.id,
  ARRAY[44.4097, 26.1023]::float8[],
  CURRENT_DATE + 5,
  '09:00',
  '13:00',
  'Mănuși de protecție, haine vechi, cizme de cauciuc (opțional)',
  'Saci de gunoi, lopețele, apă minerală și gustări pentru toți participanții. Certificate de voluntariat la cerere.',
  100
FROM ca;

-- Comunitar 2: Donații materiale
WITH creator AS (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
     org AS (SELECT id FROM organizations WHERE name = 'Salvați Copiii România' LIMIT 1),
     evt AS (
       INSERT INTO events (title, description, category, subcategory, status, creator_id, creator_type, organization_id, view_count, participants_count)
       SELECT
         'Colectă Rechizite Școală — Iași',
         'Colectăm rechizite noi sau în stare bună pentru 500 de copii din familii defavorizate din județul Iași. Fiecare ghiozdan donat înseamnă un viitor mai bun.',
         'community', 'donations', 'approved', creator.id, 'ngo', org.id, 2100, 445
       FROM creator, org RETURNING id
     ),
     ca AS (
       INSERT INTO community_activities (event_id, contact_person)
       SELECT evt.id, 'donatii@salvaticopiii.ro' FROM evt RETURNING id
     )
INSERT INTO donations (community_activity_id, donation_type, what_is_needed)
SELECT
  ca.id,
  'material',
  ARRAY['caiete', 'pixuri', 'creioane colorate', 'ghiozdane', 'rigle', 'gome', 'culori acuarelă', 'cartoane colorate', 'folii protecție carte']
FROM ca;

-- Comunitar 3: Workshop
WITH creator AS (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
     evt AS (
       INSERT INTO events (title, description, category, subcategory, status, creator_id, creator_type, view_count, participants_count)
       SELECT
         'Workshop Compostare Urbană — Cluj',
         'Înveți în 3 ore tot ce trebuie să știi despre compostarea la bloc și în grădină. Reduci deșeurile cu 30% și produci îngrășământ natural gratuit. Locuri limitate.',
         'community', 'workshop', 'approved', id, 'user', 312, 28
       FROM creator RETURNING id
     ),
     ca AS (
       INSERT INTO community_activities (event_id, contact_person)
       SELECT evt.id, 'workshop@compostcluj.ro' FROM evt RETURNING id
     )
INSERT INTO workshops (community_activity_id, location, date, time_start, time_end, max_participants, what_organizer_offers)
SELECT
  ca.id,
  ARRAY[46.7712, 23.6236]::float8[],
  CURRENT_DATE + 18,
  '10:00',
  '13:00',
  30,
  'Kit starter compost (cutie + starter biologic), materiale tipărite, cafea și ceai organic.'
FROM ca;

-- ─── EVENIMENTE CARITABILE ────────────────────────────────────

-- Caritabil 1: Concert
WITH creator AS (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
     org AS (SELECT id FROM organizations WHERE name = 'Salvați Copiii România' LIMIT 1),
     evt AS (
       INSERT INTO events (title, description, category, subcategory, status, creator_id, creator_type, organization_id, view_count, participants_count)
       SELECT
         'Concert Caritabil — Inimi pentru Inimi',
         'O seară de muzică live cu artiști români de top. Tot profitul merge direct în programele de sprijin pentru copii bolnavi din spitalele din București. Vino să te bucuri de muzică și să faci bine.',
         'charity', 'concert', 'approved', creator.id, 'ngo', org.id, 8750, 634
       FROM creator, org RETURNING id
     ),
     ce AS (
       INSERT INTO charity_events (event_id, target_amount, collected_amount)
       SELECT evt.id, 50000, 18500 FROM evt RETURNING id
     )
INSERT INTO charity_concerts (charity_event_id, location, date, time_start, time_end, performers, ticket_price, ticket_link, max_participants)
SELECT
  ce.id,
  ARRAY[44.4268, 26.1025]::float8[],
  CURRENT_DATE + 30,
  '19:00',
  '23:00',
  ARRAY['Ștefan Bănică Jr.', 'Horia Brenciu', 'Loredana Groza'],
  75,
  'https://bilete.ro/concert-inimi',
  800
FROM ce;

-- Caritabil 2: Meet & Greet
WITH creator AS (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
     org AS (SELECT id FROM organizations WHERE name = 'Greenpeace România' LIMIT 1),
     evt AS (
       INSERT INTO events (title, description, category, subcategory, status, creator_id, creator_type, organization_id, view_count, participants_count)
       SELECT
         'Meet & Greet cu Activiști Climatici',
         'Întâlnire cu activiști climatici de renume internațional. Discuții despre viitorul planetei, cum ne implicăm și ce putem face fiecare. Fonduri strânse merg în campanii de conștientizare.',
         'charity', 'meet_greet', 'approved', creator.id, 'ngo', org.id, 3210, 89
       FROM creator, org RETURNING id
     ),
     ce AS (
       INSERT INTO charity_events (event_id, target_amount, collected_amount)
       SELECT evt.id, 10000, 4200 FROM evt RETURNING id
     )
INSERT INTO meet_greets (charity_event_id, location, date, time_start, time_end, guests, ticket_price, ticket_link, max_participants)
SELECT
  ce.id,
  ARRAY[44.4268, 26.1025]::float8[],
  CURRENT_DATE + 45,
  '16:00',
  '20:00',
  ARRAY['Greta Thunberg (video call)', 'Mihai Goțiu', 'Nicușor Dan'],
  50,
  'https://bilete.ro/meetgreet-clima',
  100
FROM ce;

-- Caritabil 3: Livestream
WITH creator AS (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
     evt AS (
       INSERT INTO events (title, description, category, subcategory, status, creator_id, creator_type, view_count, participants_count)
       SELECT
         '24h Livestream pentru Spitale Pediatrice',
         'Stăm live 24 de ore cu jocuri, muzică, interviuri și surprize pentru a strânge fonduri pentru dotarea secțiilor de pediatrie din spitalele de județ. Donează live, urmărește show-ul.',
         'charity', 'livestream', 'approved', id, 'user', 15600, 2341
       FROM creator RETURNING id
     ),
     ce AS (
       INSERT INTO charity_events (event_id, target_amount, collected_amount)
       SELECT evt.id, 100000, 43200 FROM evt RETURNING id
     )
INSERT INTO charity_livestreams (charity_event_id, stream_link, cause, time_start, time_end, guests)
SELECT
  ce.id,
  'https://twitch.tv/civicom_ro',
  'Dotarea cu aparatură medicală modernă a 5 secții de pediatrie din spitale județene defavorizate.',
  '12:00',
  '12:00',
  ARRAY['Smiley', 'NOSFE', 'Cheloo', 'Speak']
FROM ce;

-- Caritabil 4: Activitate sportivă
WITH creator AS (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
     evt AS (
       INSERT INTO events (title, description, category, subcategory, status, creator_id, creator_type, view_count, participants_count)
       SELECT
         'Maraton Caritabil — Timișoara',
         '10km prin cel mai frumos oraș din România. Fiecare kilometru alergat = 10 RON donație automată pentru adăposturile de animale. Câștigătorii primesc premii oferite de sponsori locali.',
         'charity', 'sport', 'approved', id, 'user', 4320, 287
       FROM creator RETURNING id
     ),
     ce AS (
       INSERT INTO charity_events (event_id, target_amount, collected_amount)
       SELECT evt.id, 30000, 12400 FROM evt RETURNING id
     )
INSERT INTO sports_activities (charity_event_id, location, date, time_start, time_end, guests, ticket_price, ticket_link, max_participants)
SELECT
  ce.id,
  ARRAY[45.7489, 21.2087]::float8[],
  CURRENT_DATE + 60,
  '08:00',
  '14:00',
  ARRAY['Camelia Potec', 'Dorinel Munteanu'],
  30,
  'https://bilete.ro/maraton-caritabil-tm',
  500
FROM ce;
