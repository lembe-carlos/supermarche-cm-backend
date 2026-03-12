// ═══════════════════════════════════════════════════════════
//  SuperMarché CM — Backend SMS
//  Serveur Node.js pour envoi SMS via Africa's Talking
//  Hébergement : Render.com (gratuit)
// ═══════════════════════════════════════════════════════════

const express = require('express');
const cors    = require('cors');
const AfricasTalking = require('africastalking');

const app = express();
app.use(express.json());
app.use(cors()); // Autorise les requêtes depuis votre site GitHub Pages

// ── Configuration Africa's Talking ──
const AT = AfricasTalking({
  apiKey:   process.env.AT_API_KEY   || 'atsk_571ce8cfdd98ed671bccd446df62c16387d61ed33873d7cf051037a77aff565f3c0e6ce9',
  username: process.env.AT_USERNAME  || 'sandbox'  // Remplacer par votre vrai username en production
});

const sms = AT.SMS;
const SENDER = process.env.AT_SENDER || 'SuperMktCM'; // Votre Sender ID

// ── Fonction utilitaire : formater le numéro ──
function formatTel(tel) {
  // Convertit 690123456 ou 00237690123456 en +237690123456
  tel = tel.toString().replace(/\s/g, '').replace(/[^\d+]/g, '');
  if (tel.startsWith('00237')) tel = '+237' + tel.slice(5);
  if (tel.startsWith('237'))   tel = '+' + tel;
  if (!tel.startsWith('+'))    tel = '+237' + tel;
  return tel;
}

// ════════════════════════════════════════
//  ROUTE 1 — SMS Confirmation de commande
//  Appelé quand le client passe une commande
// ════════════════════════════════════════
app.post('/sms/commande', async (req, res) => {
  try {
    const { tel, client, id, total, items, supermarche } = req.body;

    if (!tel || !client || !id) {
      return res.status(400).json({ ok: false, error: 'Paramètres manquants : tel, client, id requis' });
    }

    const message = 
      `SuperMarché CM\n` +
      `Bonjour ${client} !\n` +
      `Votre commande #${id} est confirmée.\n` +
      `Montant : ${Number(total).toLocaleString()} FCFA\n` +
      `Articles : ${items || 'Voir votre commande'}\n` +
      `Nous préparons votre commande. Merci !`;

    const result = await sms.send({
      to:   [formatTel(tel)],
      message: message,
      from: SENDER
    });

    console.log('SMS commande envoyé à', tel, ':', result);
    res.json({ ok: true, message: 'SMS envoyé', result });

  } catch (err) {
    console.error('Erreur SMS commande:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ════════════════════════════════════════
//  ROUTE 2 — SMS En route (livreur parti)
//  Appelé quand le statut passe à "en_route"
// ════════════════════════════════════════
app.post('/sms/livraison', async (req, res) => {
  try {
    const { tel, client, id, livreur, creneau } = req.body;

    if (!tel || !client) {
      return res.status(400).json({ ok: false, error: 'Paramètres manquants' });
    }

    const message =
      `SuperMarché CM\n` +
      `Bonjour ${client} !\n` +
      `Votre commande #${id} est en route !\n` +
      `Livreur : ${livreur || 'En cours d\'assignation'}\n` +
      (creneau ? `Créneau : ${creneau}\n` : '') +
      `Restez disponible. Merci de votre confiance !`;

    const result = await sms.send({
      to:   [formatTel(tel)],
      message: message,
      from: SENDER
    });

    console.log('SMS livraison envoyé à', tel);
    res.json({ ok: true, message: 'SMS envoyé', result });

  } catch (err) {
    console.error('Erreur SMS livraison:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ════════════════════════════════════════
//  ROUTE 3 — SMS Livraison effectuée
//  Appelé quand le statut passe à "livree"
// ════════════════════════════════════════
app.post('/sms/livree', async (req, res) => {
  try {
    const { tel, client, id, total, points } = req.body;

    if (!tel || !client) {
      return res.status(400).json({ ok: false, error: 'Paramètres manquants' });
    }

    const message =
      `SuperMarché CM\n` +
      `Bonjour ${client} !\n` +
      `Commande #${id} livrée avec succès !\n` +
      `Montant payé : ${Number(total).toLocaleString()} FCFA\n` +
      (points ? `Points fidélité gagnés : +${points} pts\n` : '') +
      `Merci pour votre confiance ! A bientôt.`;

    const result = await sms.send({
      to:   [formatTel(tel)],
      message: message,
      from: SENDER
    });

    console.log('SMS livree envoyé à', tel);
    res.json({ ok: true, message: 'SMS envoyé', result });

  } catch (err) {
    console.error('Erreur SMS livree:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ════════════════════════════════════════
//  ROUTE 4 — SMS Annulation
// ════════════════════════════════════════
app.post('/sms/annulation', async (req, res) => {
  try {
    const { tel, client, id, raison } = req.body;

    const message =
      `SuperMarché CM\n` +
      `Bonjour ${client},\n` +
      `Votre commande #${id} a été annulée.\n` +
      (raison ? `Raison : ${raison}\n` : '') +
      `Contactez-nous au +237 690 000 000 pour plus d'informations.`;

    const result = await sms.send({
      to:   [formatTel(tel)],
      message: message,
      from: SENDER
    });

    res.json({ ok: true, message: 'SMS envoyé', result });

  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ════════════════════════════════════════
//  ROUTE 5 — SMS Personnalisé (admin)
// ════════════════════════════════════════
app.post('/sms/custom', async (req, res) => {
  try {
    const { tel, message } = req.body;

    if (!tel || !message) {
      return res.status(400).json({ ok: false, error: 'tel et message requis' });
    }

    const result = await sms.send({
      to:   [formatTel(tel)],
      message: `SuperMarché CM\n${message}`,
      from: SENDER
    });

    res.json({ ok: true, message: 'SMS envoyé', result });

  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
// ════════════════════════════════════════
//  ROUTE IA — Assistant Claude
// ════════════════════════════════════════
const Anthropic = require('@anthropic-ai/sdk');

app.post('/ia/chat', async (req, res) => {
  try {
    const { messages, context } = req.body;
    if (!messages || messages.length === 0) {
      return res.status(400).json({ ok: false, error: 'Messages requis' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ ok: false, error: 'Clé Anthropic non configurée' });
    }

    const client = new Anthropic({ apiKey });

    const systemPrompt = `Tu es l'assistant IA de SuperMarché CM, une application de gestion de supermarché au Cameroun. 
Tu aides le gérant à analyser ses données, optimiser ses ventes et prendre de bonnes décisions.
Contexte actuel de l'application : ${context ? JSON.stringify(context) : 'Non disponible'}
Réponds toujours en français, de manière concise et pratique.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages
    });

    const reply = response.content[0].text;
    res.json({ ok: true, reply });

  } catch (err) {
    console.error('Erreur IA:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});
// ── Route de test ──
app.get('/', (req, res) => {
  res.json({
    status: 'SuperMarché CM SMS Backend opérationnel',
    version: '1.0.0',
    routes: [
      'POST /sms/commande',
      'POST /sms/livraison',
      'POST /sms/livree',
      'POST /sms/annulation',
      'POST /sms/custom'
    ]
  });
});

// ── Démarrage du serveur ──
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`SuperMarché CM SMS Backend démarré sur le port ${PORT}`);
  console.log(`Mode : ${process.env.AT_USERNAME === 'sandbox' ? 'SANDBOX (test)' : 'PRODUCTION'}`);
});
