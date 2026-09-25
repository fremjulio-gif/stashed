# STASHED 🎛️✨

> **Bibliothèque audio studio & plateforme de partage haute résolution pour ingénieurs du son et producteurs.**  
> Inspiré par l'expérience fluide de *Untitled.stream* et *Samply*, combiné à une direction artistique **"Apple Liquid Glass x DAW Pro"**.

---

## 🎧 Fonctionnalités Clés

1. **Dépôt Audio Multi-Formats & Non-Compressé** :
   - Prise en charge native des fichiers lourds **.WAV 24-bit / 48kHz** et **.MP3 320kbps** (jusqu'à 250 Mo par piste).
   - Décodage local par Web Audio API : extraction automatique de la durée et pré-calcul des formes d'onde (waveforms 64 crêtes normalisées) dès l'upload.
   - Streaming haute fidélité via HTTP 206 Range Requests (lecture instantanée sans téléchargement complet obligatoire).

2. **Organisation en Projets & Sessions DAW** :
   - Création de projets / dossiers avec pochette personnalisée (artwork), titre, notes de session et couleur d'accent DAW (Cyan Ableton, Ambre Logic, Violet Roland, Vert Lime, Rose, Bleu Cobalt).
   - Dépôt rapide à la racine pour les pistes volantes ou idées de session.
   - Édition des métadonnées (titre, artiste, tempo BPM).
   - Réorganisation personnalisée de l'ordre des pistes.

3. **Partage Public Zéro Friction** :
   - Génération d'un lien public unique par projet ou par piste individuelle (`/share/[token]`).
   - **Aucun compte ni inscription requise pour les auditeurs**.
   - Protection optionnelle par mot de passe avec interface de saisie dépolie.
   - Date d'expiration optionnelle (24h, 7 jours, 30 jours, ou permanent).
   - Toggle d'autorisation de téléchargement des fichiers sources par projet.
   - Compteur de vues et d'écoutes en direct.
   - Cartes Open Graph dynamiques pour aperçus soignés sur iMessage, WhatsApp, Twitter/X et Discord.

4. **Direction Artistique "Apple Liquid Glass x DAW Pro"** :
   - Panneaux dépolis ultra-translucides (`backdrop-blur-2xl`), reflets subtils, bordures lumineuses 1px, ombres diffuses.
   - Palette sombre par défaut façon console de mixage studio (anthracite profond `#060709` / `#0a0c10`), avec support complet du mode clair.
   - Lecteur DAW complet avec contrôles de transport, barre de scrub interactive, métadonnées techniques monospace (`font-mono`, sample rate, durée `00:00.0`, poids de fichier, BPM).
   - **VU-mètre stéréo (L / R) réactif** avec bargraphes LED (vert, ambre, rouge clip).
   - Animations fluides et organiques propulsées par **Anime.js v4**.
   - Raccourcis clavier studio : `Espace` (Lecture / Pause), `Flèches Gauche / Droite` (Naviguer +/- 5s), `M` (Couper le son).
   - **100% Responsive** : Expérience Finder/DAW sur grand écran et lecteur tactile sticky en bas d'écran façon SoundCloud/Spotify mobile.

---

## 🛠️ Stack Technique

- **Framework** : Next.js 15 (App Router, TypeScript strict)
- **Styling** : Tailwind CSS avec extensions glassmorphism & DAW console
- **Animations** : Anime.js v4 (moteurs WAAPI et Spring Physics)
- **Lecteur Audio** : Web Audio API + HTML5 Audio avec range-requests streaming
- **Base de données** : Prisma ORM (compatible PostgreSQL Neon / Vercel Postgres / Supabase) avec système de persistance locale de secours
- **Stockage de fichiers** : Adaptateur universel (Cloudflare R2, Vercel Blob ou stockage local)
- **Authentification propriétaire** : Système de code secret minimal avec cookies JWT signés `httpOnly` (zéro dépendance externe payante)

---

## 🚀 Démarrage Rapide en Local

### 1. Cloner et installer les dépendances
```bash
git clone https://github.com/fremjulio-gif/stashed.git
cd stashed
npm install
```

### 2. Variables d'environnement
Créez un fichier `.env` à la racine :
```env
# Authentification Propriétaire
OWNER_PASSPHRASE="stashed2026"
AUTH_SECRET="une_cle_secrete_aleatoire_de_votre_choix"

# Base de données (optionnelle en local grâce au fallback intégré)
# DATABASE_URL="postgresql://user:password@ep-sample.neon.tech/neondb?sslmode=require"
```

### 3. Lancer en mode développement
```bash
npm run dev
```
Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.  
Pour vous connecter au Studio Propriétaire, accédez à `/login` et entrez votre code d'accès (par défaut : `stashed2026`).

---

## ☁️ Guide des Services Tiers Gratuits (100% Free Forever)

Tous les services utilisés possèdent un **tier gratuit sans obligation de carte bancaire** :

### 1. Base de Données : Neon Serverless Postgres (Recommandé)
- **Lien** : [https://neon.tech](https://neon.tech)
- **Tier gratuit** : 0,5 Go de données, connexions illimitées, branchements instantanés.
- **Mise en place (2 minutes)** :
  1. Créez un compte gratuit sur Neon avec votre compte GitHub ou Google.
  2. Créez un nouveau projet nommé `stashed`.
  3. Copiez la chaîne de connexion `postgresql://...` fournie dans le dashboard Neon.
  4. Collez-la dans votre variable `DATABASE_URL`.
  5. Exécutez `npx prisma db push` pour synchroniser le schéma.

### 2. Stockage Audio : Cloudflare R2 vs Vercel Blob

| Service | Quota Stockage Gratuit | Bande Passante / Egress | Idéal pour |
| :--- | :--- | :--- | :--- |
| **Cloudflare R2** *(Recommandé)* | **10 Go gratuits / mois** | **0$ Egress illimitée** | **WAV lourds 24-bit** (aucun frais de streaming) |
| **Vercel Blob** | 1 Go gratuit | 5 Go / mois | Setup 1-clic direct dans Vercel |

#### Pour configurer Cloudflare R2 :
1. Créez un compte sur [https://dash.cloudflare.com](https://dash.cloudflare.com).
2. Dans le menu de gauche, allez dans **R2 Object Storage** > **Create bucket** (nommez-le `stashed-audio`).
3. Dans **Settings** du bucket, activez l'accès public ou connectez un sous-domaine (ex: `audio.votredomaine.com`).
4. Dans **Manage R2 API Tokens**, générez un token avec permissions Lecture & Écriture.
5. Renseignez dans Vercel / votre `.env` :
   ```env
   R2_ACCOUNT_ID="votre_account_id"
   R2_ACCESS_KEY_ID="votre_access_key"
   R2_SECRET_ACCESS_KEY="votre_secret_key"
   R2_BUCKET_NAME="stashed-audio"
   R2_PUBLIC_DOMAIN="https://pub-xxxx.r2.dev"
   ```

#### Pour configurer Vercel Blob (alternative 1-clic) :
1. Dans votre dashboard de projet Vercel, allez dans l'onglet **Storage**.
2. Cliquez sur **Create Database** > **Blob**.
3. Vercel injectera automatiquement `BLOB_READ_WRITE_TOKEN`.

---

## 🔒 Variables d'Environnement Vercel

Dans les paramètres de votre projet Vercel (**Settings** > **Environment Variables**), configurez :

| Variable | Description | Exemple |
| :--- | :--- | :--- |
| `OWNER_PASSPHRASE` | Votre code secret pour vous connecter sur `/login` | `stashed2026` *(à personnaliser)* |
| `AUTH_SECRET` | Clé secrète de chiffrement des tokens JWT | Chaîne aléatoire de 32+ caractères |
| `DATABASE_URL` | Chaîne de connexion PostgreSQL (Neon ou Vercel Postgres) | `postgresql://...` |
| `BLOB_READ_WRITE_TOKEN` *(Option A)* | Token Vercel Blob | Injecté automatiquement par Vercel |
| `R2_*` *(Option B)* | Clés Cloudflare R2 | Vos clés API Cloudflare R2 |

---

## 📂 Architecture du Projet

```
stashed/
├── app/
│   ├── api/
│   │   ├── auth/           # Login, logout, vérification session
│   │   ├── projects/       # CRUD projets et dossiers
│   │   ├── tracks/         # CRUD pistes audio et réordonnancement
│   │   ├── share/          # Génération, vérification et écoutes des liens
│   │   ├── upload/         # Upload sécurisé et jetons d'upload direct
│   │   └── stream/         # Streaming HTTP 206 Range Requests
│   ├── dashboard/          # Espace propriétaire (Finder, uploader, stats)
│   ├── login/              # Connexion sécurisée propriétaire
│   ├── share/[token]/      # Lecteur public épuré pour auditeurs
│   ├── globals.css         # Styles Liquid Glass, DAW grid, variables thème
│   ├── layout.tsx          # Layout racine avec lecteur audio persistant
│   └── page.tsx            # Présentation d'accueil de la bibliothèque
├── components/
│   ├── audio/
│   │   ├── GlobalAudioPlayer.tsx  # Lecteur global sticky & commandes transport
│   │   ├── WaveformCanvas.tsx     # Rendu waveform canvas interactif
│   │   ├── WaveformTrackItem.tsx  # Ligne de piste avec waveform et métadonnées
│   │   └── VUMeter.tsx            # VU-mètre stéréo LED console DAW
│   ├── dashboard/          # Modales projet, uploaders, cartes de session
│   └── ui/                 # Boutons, cartes de verre et modales dépolies
├── lib/
│   ├── auth.ts             # Gestion JWT et cookies session
│   ├── db.ts               # Opérations base de données avec fallback résilient
│   ├── player-store.ts     # Store audio Zustand (playback, queue, VU-meter)
│   ├── prisma.ts           # Client Prisma ORM singleton
│   └── storage.ts          # Adaptateur stockage R2 / Vercel Blob / Local
└── prisma/
    └── schema.prisma       # Schéma de données (User, Project, Track, ShareLink)
```

---

## 👤 Propriétaire


- **Application déployée** : [https://stashedd.vercel.app/](https://stashedd.vercel.app/)
- **Repository GitHub** : [https://github.com/fremjulio-gif/stashed](https://github.com/fremjulio-gif/stashed)
