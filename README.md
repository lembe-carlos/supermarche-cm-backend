# SuperMarché CM — Backend SMS

Backend Node.js pour l'envoi de SMS automatiques via Africa's Talking.

## Fichiers

- `server.js` — Serveur Express principal
- `sms.js` — À copier dans votre dossier supermarche-cm (frontend)
- `.env` — Variables d'environnement (ne pas publier sur GitHub)

## Routes disponibles

| Route | Description |
|-------|-------------|
| POST /sms/commande | SMS de confirmation de commande |
| POST /sms/livraison | SMS livreur en route |
| POST /sms/livree | SMS livraison effectuée |
| POST /sms/annulation | SMS annulation commande |
| POST /sms/custom | SMS personnalisé depuis l'admin |

## Déploiement sur Render.com

### Étape 1 — Créer un dépôt GitHub pour le backend
1. Allez sur github.com → New repository
2. Nommez-le `supermarche-cm-sms`
3. Uploadez les fichiers : server.js, package.json, .gitignore
4. ⚠️ NE PAS uploader le fichier .env (il contient votre clé API)

### Étape 2 — Déployer sur Render
1. Allez sur https://render.com
2. Cliquez "New" → "Web Service"
3. Connectez votre dépôt GitHub `supermarche-cm-sms`
4. Configurez :
   - **Name** : supermarche-cm-sms
   - **Runtime** : Node
   - **Build Command** : npm install
   - **Start Command** : node server.js
5. Ajoutez les variables d'environnement :
   - AT_API_KEY = votre clé Africa's Talking
   - AT_USERNAME = sandbox (puis votre vrai username en production)
   - AT_SENDER = SuperMktCM
6. Cliquez "Create Web Service"
7. Attendez 2-3 minutes — vous obtenez une URL comme :
   `https://supermarche-cm-sms.onrender.com`

### Étape 3 — Connecter au frontend
1. Copiez `sms.js` dans votre dossier supermarche-cm
2. Dans `sms.js`, remplacez BACKEND_URL par votre vraie URL Render
3. Ajoutez dans index.html et boutique.html avant </body> :
   `<script src="sms.js"></script>`
4. Les SMS se déclenchent automatiquement lors des changements de statut

## Passer en production

Quand vous avez votre Sender ID validé :
1. Sur Render → Environment → Changer AT_USERNAME par votre vrai username
2. Changer AT_USERNAME de `sandbox` vers votre username réel
3. Recharger le service

## Test

En mode sandbox, les SMS n'arrivent pas sur les vrais téléphones.
Pour tester, allez sur Africa's Talking → Sandbox → Simulateur.
