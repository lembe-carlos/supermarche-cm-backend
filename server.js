// ═══════════════════════════════════════════════════════════
//  SuperMarché CM — Backend SMS + IA Claude
// ═══════════════════════════════════════════════════════════
 
const express = require('express');
const cors    = require('cors');
const AfricasTalking = require('africastalking');
 
const app = express();
app.use(express.json());
app.use(cors());
 
const AT = AfricasTalking({
  apiKey:   process.env.AT_API_KEY  || 'atsk_571ce8cfdd98ed671bccd446df62c16387d61ed33873d7cf051037a77aff565f3c0e6ce9',
  username: process.env.AT_USERNAME || 'sandbox'
});
const sms = AT.SMS;
const SENDER = process.env.AT_SENDER || 'SuperMktCM';
 
function formatTel(tel) {
  tel = tel.toString().replace(/\s/g, '').replace(/[^\d+]/g, '');
  if (tel.startsWith('00237')) tel = '+237' + tel.slice(5);
  if (tel.startsWith('237'))   tel = '+' + tel;
  if (!tel.startsWith('+'))    tel = '+237' + tel;
  return tel;
}
 
app.post('/sms/commande', async (req, res) => {
  try {
    const { tel, client, id, total, items } = req.body;
    if (!tel || !client || !id) return res.status(400).json({ ok: false, error: 'Paramètres manquants' });
    const message = `SuperMarché CM\nBonjour ${client} !\nVotre commande #${id} est confirmée.\nMontant : ${Number(total).toLocaleString()} FCFA\nArticles : ${items || 'Voir votre commande'}\nMerci !`;
    const result = await sms.send({ to: [formatTel(tel)], message, from: SENDER });
    res.json({ ok: true, result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
 
app.post('/sms/livraison', async (req, res) => {
  try {
    const { tel, client, id, livreur, creneau } = req.body;
    if (!tel || !client) return res.status(400).json({ ok: false, error: 'Paramètres manquants' });
    const message = `SuperMarché CM\nBonjour ${client} !\nVotre commande #${id} est en route !\nLivreur : ${livreur || 'En cours'}\n${creneau ? 'Créneau : ' + creneau + '\n' : ''}Restez disponible !`;
    const result = await sms.send({ to: [formatTel(tel)], message, from: SENDER });
    res.json({ ok: true, result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
 
app.post('/sms/livree', async (req, res) => {
  try {
    const { tel, client, id, total, points } = req.body;
    if (!tel || !client) return res.status(400).json({ ok: false, error: 'Paramètres manquants' });
    const message = `SuperMarché CM\nBonjour ${client} !\nCommande #${id} livrée !\nMontant : ${Number(total).toLocaleString()} FCFA\n${points ? 'Points gagnés : +' + points + ' pts\n' : ''}Merci !`;
    const result = await sms.send({ to: [formatTel(tel)], message, from: SENDER });
    res.json({ ok: true, result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
 
app.post('/sms/annulation', async (req, res) => {
  try {
    const { tel, client, id, raison } = req.body;
    const message = `SuperMarché CM\nBonjour ${client},\nVotre commande #${id} a été annulée.\n${raison ? 'Raison : ' + raison + '\n' : ''}Contactez-nous au +237 683 39 22 68.`;
    const result = await sms.send({ to: [formatTel(tel)], message, from: SENDER });
    res.json({ ok: true, result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
 
app.post('/sms/custom', async (req, res) => {
  try {
    const { tel, message } = req.body;
    if (!tel || !message) return res.status(400).json({ ok: false, error: 'tel et message requis' });
    const result = await sms.send({ to: [formatTel(tel)], message: `SuperMarché CM\n${message}`, from: SENDER });
    res.json({ ok: true, result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
 
// ════════════════════════════════════════
//  ROUTE IA — Claude (Anthropic)
// ════════════════════════════════════════
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
 
    const systemPrompt = `Tu es l'assistant IA de SuperMarché CM, une application de gestion de supermarché au Cameroun. Tu aides le gérant à analyser ses données, optimiser ses ventes et prendre de bonnes décisions. Contexte : ${context ? JSON.stringify(context) : 'Non disponible'}. Réponds toujours en français, de manière concise et pratique.`;
 
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages
      })
    });
 
    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ ok: false, error: data.error?.message || 'Erreur Anthropic' });
    }
 
    const reply = data.content[0].text;
    res.json({ ok: true, reply });
 
  } catch (err) {
    console.error('Erreur IA:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});
 
app.get('/', (req, res) => {
  res.json({
    status: 'SuperMarché CM Backend opérationnel',
    version: '3.0.0',
    ia: 'Claude Haiku (Anthropic)',
    routes: ['POST /sms/commande', 'POST /sms/livraison', 'POST /sms/livree', 'POST /sms/annulation', 'POST /sms/custom', 'POST /ia/chat']
  });
});
 
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`SuperMarché CM Backend démarré sur le port ${PORT}`);
  console.log(`Mode : ${process.env.AT_USERNAME === 'sandbox' ? 'SANDBOX (test)' : 'PRODUCTION'}`);
});
 
