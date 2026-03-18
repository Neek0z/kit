-- Étape : contenu Instagram (prompts) — tables + RLS + seed
-- Exécute dans Supabase → SQL Editor (dans l’ordre).

-- 1) Tables
create table public.prompt_categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  emoji text not null,
  description text,
  sort_order integer default 0
);

create table public.prompts (
  id uuid default gen_random_uuid() primary key,
  category_id uuid references public.prompt_categories on delete cascade not null,
  title text not null,
  prompt_fr text not null,
  prompt_en text not null,
  tip text,
  tool text default 'gemini' not null,
  sort_order integer default 0
);

-- 2) RLS (lecture publique)
alter table public.prompt_categories enable row level security;
alter table public.prompts enable row level security;

create policy "Anyone can read prompt categories"
  on public.prompt_categories for select
  using (true);

create policy "Anyone can read prompts"
  on public.prompts for select
  using (true);

-- 3) Seed — catégories
insert into public.prompt_categories (name, emoji, description, sort_order) values
  ('Visuels produits', '📸', 'Photos lifestyle et packshots pour tes produits', 0),
  ('Citations mindset', '💬', 'Visuels motivationnels et citations inspirantes', 1),
  ('Recrutement MLM', '🤝', 'Contenu pour attirer de nouveaux partenaires', 2),
  ('Résultats & preuves', '🏆', 'Mets en avant tes résultats et témoignages', 3);

-- 4) Seed — prompts (on récupère les category_id via le nom)

-- VISUELS PRODUITS
insert into public.prompts (category_id, title, prompt_fr, prompt_en, tip, tool, sort_order)
select
  id,
  'Flatlay minimaliste bien-être',
  'Crée une photo flatlay minimaliste de produits bien-être (compléments alimentaires, huiles essentielles, ou crèmes). Fond blanc ou beige clair, lumière naturelle douce, quelques feuilles vertes ou fleurs séchées comme décoration, composition épurée et aérée, style Instagram premium, ratio 1:1.',
  'Create a minimalist flatlay photo of wellness products (supplements, essential oils, or creams). White or light beige background, soft natural light, a few green leaves or dried flowers as decoration, clean and airy composition, premium Instagram style, 1:1 ratio.',
  'Ajoute le nom de ton produit spécifique pour un résultat plus précis. Ex: remplace "produits bien-être" par "collagène en poudre".',
  'gemini',
  0
from public.prompt_categories where name = 'Visuels produits';

insert into public.prompts (category_id, title, prompt_fr, prompt_en, tip, tool, sort_order)
select
  id,
  'Morning routine premium',
  'Photo lifestyle d''une morning routine saine et équilibrée : tasse de café ou thé fumant, carnet de notes ouvert, produits bien-être posés élégamment sur une table en bois clair. Lumière du matin dorée, ambiance cosy et inspirante, couleurs chaudes et naturelles, style de vie aspirationnel, format portrait 4:5.',
  'Lifestyle photo of a healthy and balanced morning routine: steaming cup of coffee or tea, open notebook, wellness products elegantly placed on a light wood table. Golden morning light, cozy and inspiring atmosphere, warm and natural colors, aspirational lifestyle, 4:5 portrait format.',
  'Personnalise avec tes vrais produits pour plus d''authenticité. Tu peux aussi préciser ta palette de couleurs de marque.',
  'gemini',
  1
from public.prompt_categories where name = 'Visuels produits';

insert into public.prompts (category_id, title, prompt_fr, prompt_en, tip, tool, sort_order)
select
  id,
  'Packshot élégant fond épuré',
  'Photo packshot professionnel d''un flacon ou packaging de produit bien-être. Fond blanc pur ou fond de couleur pastel (rose pâle, vert menthe ou lavande), éclairage studio doux avec légère ombre portée, reflets subtils, rendu luxe et soigné, style e-commerce haut de gamme, ratio 1:1.',
  'Professional packshot photo of a wellness product bottle or packaging. Pure white background or pastel colored background (pale pink, mint green or lavender), soft studio lighting with slight drop shadow, subtle reflections, luxurious and refined rendering, premium e-commerce style, 1:1 ratio.',
  'Précise la couleur et la forme de ton packaging pour un résultat fidèle à ton produit.',
  'gemini',
  2
from public.prompt_categories where name = 'Visuels produits';

insert into public.prompts (category_id, title, prompt_fr, prompt_en, tip, tool, sort_order)
select
  id,
  'Ambiance spa et bien-être',
  'Photo ambiance spa luxueux avec produits naturels : bougies allumées, serviettes blanches roulées, plantes vertes, pierres de massage, et produits de soin disposés harmonieusement. Éclairage tamisé et chaud, atmosphère zen et relaxante, couleurs neutres et naturelles, format carré Instagram.',
  'Luxurious spa ambiance photo with natural products: lit candles, rolled white towels, green plants, massage stones, and skincare products arranged harmoniously. Warm dim lighting, zen and relaxing atmosphere, neutral and natural colors, square Instagram format.',
  'Idéal pour promouvoir une gamme de soins ou de bien-être. Ajoute tes produits spécifiques dans la description.',
  'gemini',
  3
from public.prompt_categories where name = 'Visuels produits';

-- CITATIONS MINDSET
insert into public.prompts (category_id, title, prompt_fr, prompt_en, tip, tool, sort_order)
select
  id,
  'Citation fond dégradé pastel',
  'Visuel Instagram carré avec citation motivationnelle. Fond dégradé doux entre deux couleurs pastel (rose et pêche, ou lavande et bleu ciel). Texte de citation centré en police élégante serif ou sans-serif moderne, couleur blanc ou beige foncé. Petits éléments décoratifs discrets (étoiles, points, lignes fines). Style épuré et féminin. Laisse un espace vide pour que je puisse ajouter ma propre citation.',
  'Square Instagram visual with motivational quote. Soft gradient background between two pastel colors (pink and peach, or lavender and sky blue). Centered quote text in elegant serif or modern sans-serif font, white or dark beige color. Small subtle decorative elements (stars, dots, thin lines). Clean and feminine style. Leave blank space so I can add my own quote.',
  'Utilise ChatGPT pour générer d''abord ta citation, puis utilise ce prompt pour créer le visuel autour.',
  'gemini',
  0
from public.prompt_categories where name = 'Citations mindset';

insert into public.prompts (category_id, title, prompt_fr, prompt_en, tip, tool, sort_order)
select
  id,
  'Style carnet journal intime',
  'Visuel Instagram au style journal intime et carnet de notes. Fond texture papier légèrement jauni ou beige, écriture manuscrite simulée en noir ou encre foncée pour la citation, petits dessins à la main (flèches, étoiles, soulignements), ambiance authentique et personnelle, un peu de désordre créatif volontaire. Format carré, esthétique Pinterest.',
  'Instagram visual in diary and notebook style. Slightly yellowed or beige paper texture background, simulated handwritten text in black or dark ink for the quote, small hand-drawn elements (arrows, stars, underlines), authentic and personal atmosphere, a bit of intentional creative disorder. Square format, Pinterest aesthetic.',
  'Parfait pour des citations personnelles et authentiques. Ajoute ta propre expérience dans la citation pour plus d''impact.',
  'gemini',
  1
from public.prompt_categories where name = 'Citations mindset';

insert into public.prompts (category_id, title, prompt_fr, prompt_en, tip, tool, sort_order)
select
  id,
  'Minimaliste fond blanc typographie bold',
  'Visuel Instagram ultra-minimaliste. Fond blanc pur. Une seule phrase courte et impactante en très grande typographie bold noire centrée. Rien d''autre. Style éditorial magazine de luxe. Beaucoup d''espace blanc autour du texte. La phrase doit tenir en 3 à 5 mots maximum. Format carré 1:1.',
  'Ultra-minimalist Instagram visual. Pure white background. A single short and impactful sentence in very large bold black typography centered. Nothing else. Luxury magazine editorial style. Lots of white space around the text. The phrase should be 3 to 5 words maximum. Square 1:1 format.',
  'Fonctionne très bien avec des phrases courtes et percutantes comme "Ta vie. Tes règles." ou "Commence. Maintenant."',
  'gemini',
  2
from public.prompt_categories where name = 'Citations mindset';

insert into public.prompts (category_id, title, prompt_fr, prompt_en, tip, tool, sort_order)
select
  id,
  'Nature et liberté financière',
  'Photo-illustration inspirante : silhouette d''une personne debout au sommet d''une montagne ou falaise, les bras ouverts face à un coucher de soleil spectaculaire aux couleurs chaudes (orange, rose, doré). Sentiment de liberté, accomplissement et puissance. Espace en bas de l''image pour ajouter une citation. Style cinématographique, très contrasté.',
  'Inspiring photo-illustration: silhouette of a person standing at the top of a mountain or cliff, arms open facing a spectacular sunset with warm colors (orange, pink, gold). Feeling of freedom, accomplishment and power. Space at the bottom of the image to add a quote. Cinematic style, high contrast.',
  'Idéal pour des posts sur la liberté financière ou le dépassement de soi. Ajoute ta citation sur la liberté dans l''espace prévu.',
  'gemini',
  3
from public.prompt_categories where name = 'Citations mindset';

-- RECRUTEMENT MLM
insert into public.prompts (category_id, title, prompt_fr, prompt_en, tip, tool, sort_order)
select
  id,
  'Équipe souriante et dynamique',
  'Photo lifestyle d''un groupe de 3 à 4 personnes souriantes et dynamiques, diversifiées, habillées de façon casual-chic, réunies autour d''une table dans un espace de coworking moderne ou café branché. Ambiance positive, collaborative et énergique. Lumière naturelle, couleurs vives et chaleureuses. Sentiment d''appartenance à une communauté qui réussit.',
  'Lifestyle photo of a group of 3 to 4 smiling and dynamic people, diverse, dressed in casual-chic style, gathered around a table in a modern coworking space or trendy café. Positive, collaborative and energetic atmosphere. Natural light, bright and warm colors. Sense of belonging to a successful community.',
  'Ajoute un texte par-dessus du style "Rejoins notre équipe" ou "On recrute !" pour maximiser l''impact.',
  'gemini',
  0
from public.prompt_categories where name = 'Recrutement MLM';

insert into public.prompts (category_id, title, prompt_fr, prompt_en, tip, tool, sort_order)
select
  id,
  'Liberté de travailler où tu veux',
  'Photo lifestyle d''une personne travaillant depuis un endroit paradisiaque : plage avec hamac et laptop, terrasse avec vue montagne, ou café parisien pittoresque. Personne détendue, souriante, habillée élégamment. Sentiment de liberté géographique et financière. Lumière dorée, ambiance aspirationnelle. Format portrait ou carré.',
  'Lifestyle photo of a person working from a paradise location: beach with hammock and laptop, terrace with mountain view, or picturesque Parisian café. Relaxed, smiling person, elegantly dressed. Feeling of geographical and financial freedom. Golden light, aspirational atmosphere. Portrait or square format.',
  'Ajoute une légende du style "Et si tu pouvais travailler de n''importe où ?" pour créer de la curiosité.',
  'gemini',
  1
from public.prompt_categories where name = 'Recrutement MLM';

insert into public.prompts (category_id, title, prompt_fr, prompt_en, tip, tool, sort_order)
select
  id,
  'Avant / Après style de vie',
  'Diptyque Instagram (deux images côte à côte) illustrant une transformation de style de vie. À gauche : personne stressée dans un bureau sombre, mine fatiguée, vêtements ternes. À droite : même personne épanouie, souriante, dans un espace lumineux et agréable, tenue élégante. Contraste visuel fort entre les deux situations. Format paysage 16:9.',
  'Instagram diptych (two images side by side) illustrating a lifestyle transformation. On the left: stressed person in a dark office, tired face, dull clothes. On the right: same fulfilled, smiling person in a bright and pleasant space, elegant outfit. Strong visual contrast between the two situations. Landscape 16:9 format.',
  'Très puissant pour illustrer le changement de vie. Ajoute "Avant KIT / Après KIT" ou similaire.',
  'gemini',
  2
from public.prompt_categories where name = 'Recrutement MLM';

-- RÉSULTATS & PREUVES
insert into public.prompts (category_id, title, prompt_fr, prompt_en, tip, tool, sort_order)
select
  id,
  'Chiffres et résultats impactants',
  'Visuel Instagram professionnel pour mettre en avant des chiffres de résultats. Fond sombre (noir ou bleu marine profond), grands chiffres en couleur vive (or, vert menthe ou blanc) au centre, sous-titre explicatif en petit. Style tableau de bord financier luxueux. Un ou deux éléments graphiques simples (graphique en hausse, étoile). Format carré.',
  'Professional Instagram visual to highlight results figures. Dark background (black or deep navy blue), large figures in vivid color (gold, mint green or white) in the center, small explanatory subtitle below. Luxurious financial dashboard style. One or two simple graphic elements (rising chart, star). Square format.',
  'Idéal pour partager tes revenus du mois, le nombre de clients, ou tes objectifs atteints. Sois précis dans tes chiffres.',
  'gemini',
  0
from public.prompt_categories where name = 'Résultats & preuves';

insert into public.prompts (category_id, title, prompt_fr, prompt_en, tip, tool, sort_order)
select
  id,
  'Témoignage client encadré',
  'Visuel Instagram élégant pour mettre en valeur un témoignage client. Fond pastel doux (rose pâle, beige ou vert sauge), grande citation en italique au centre avec guillemets décoratifs, nom et photo miniature du client en bas, étoiles de notation (5/5) en couleur dorée. Style épuré et professionnel qui inspire confiance. Format carré.',
  'Elegant Instagram visual to highlight a customer testimonial. Soft pastel background (pale pink, beige or sage green), large italic quote in the center with decorative quotation marks, client name and thumbnail photo at the bottom, rating stars (5/5) in golden color. Clean and professional style that inspires trust. Square format.',
  'Demande toujours l''autorisation de ton client avant de publier son témoignage. Utilise ses vrais mots pour plus d''authenticité.',
  'gemini',
  1
from public.prompt_categories where name = 'Résultats & preuves';

