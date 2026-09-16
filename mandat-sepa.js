// Mandat de prélèvement SEPA : logique commune aux pages mandat-sepa-*.html.
// Chaque page définit window.OFFRE avant de charger ce fichier.

var WEBHOOK_URL = 'https://webprime.app/webhook/contact/bc024c6a49270fbd5c6410130a36f4a25f54b1d8af00affb5697d01be039f033';
var CREANCIER = {
    nom: 'Daelia Partners',
    adresse: '7 avenue des Belles Fontaines, 91600 Savigny-sur-Orge',
    ics: 'FR78ZZZ8B26BD'
};

var form = document.getElementById('mandatForm');
var rum = genererRum();
var PERIODE = OFFRE.semestriel
    ? { type: 'récurrent (tous les 6 mois)', montant: 'Montant tous les 6 mois', engagement: 'engagement 6 mois' }
    : { type: 'récurrent (annuel)', montant: OFFRE.prixSuivant ? 'Montant 1ère année' : 'Montant annuel', engagement: 'engagement 1 an' };

document.getElementById('creancierNom').textContent = CREANCIER.nom;
document.getElementById('creancierNom2').textContent = CREANCIER.nom;
document.getElementById('creancierNom3').textContent = CREANCIER.nom;
document.getElementById('creancierAdresse').textContent = CREANCIER.adresse;
document.getElementById('creancierIcs').textContent = CREANCIER.ics;
document.getElementById('rum').textContent = rum;

function genererRum() {
    var d = new Date();
    var date = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var rnd = new Uint32Array(6);
    window.crypto.getRandomValues(rnd);
    var suffixe = Array.prototype.map.call(rnd, function (n) { return chars[n % chars.length]; }).join('');
    return 'WP-' + date + '-' + suffixe;
}

function normaliserIban(v) { return v.replace(/\s+/g, '').toUpperCase(); }

function ibanValide(v) {
    var iban = normaliserIban(v);
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
    var reorg = iban.slice(4) + iban.slice(0, 4);
    var reste = 0;
    for (var i = 0; i < reorg.length; i++) {
        var c = reorg.charCodeAt(i);
        var val = c >= 65 ? String(c - 55) : reorg[i];
        for (var j = 0; j < val.length; j++) reste = (reste * 10 + Number(val[j])) % 97;
    }
    return reste === 1;
}

function masquerIban(v) {
    var iban = normaliserIban(v);
    return iban.slice(0, 4) + ' •••• •••• ' + iban.slice(-4);
}

function formaterEuros(n) { return n.toLocaleString('fr-FR') + '€'; }

function calculerFormule() {
    return { libelle: OFFRE.libelle, total: OFFRE.prix };
}

function majTotal() {
    document.getElementById('totalAmount').textContent = formaterEuros(OFFRE.prix);
}

function majSignature() {
    var ville = form.ville.value.trim();
    document.getElementById('signatureInfo').textContent =
        'Signé électroniquement le ' + new Date().toLocaleDateString('fr-FR') + (ville ? ' à ' + ville : '') + '.';
}

function erreur(input) { input.closest('.form-group').classList.add('error'); return false; }

function valider() {
    var ok = true;
    form.querySelectorAll('.form-group').forEach(function (g) { g.classList.remove('error'); });

    form.querySelectorAll('input[required]').forEach(function (input) {
        if (input.type === 'checkbox') return;
        if (!input.value.trim() || !input.checkValidity()) ok = erreur(input);
    });

    if (form.iban.value.trim() && !ibanValide(form.iban.value)) ok = erreur(form.iban);
    if (!form.accept_mandat.checked) ok = erreur(form.accept_mandat);
    if (!form.accept_engagement.checked) ok = erreur(form.accept_engagement);

    return ok;
}

function prefillDepuisUrl() {
    var p = new URLSearchParams(window.location.search);
    if (p.get('email')) form.email.value = p.get('email');
}

form.iban.addEventListener('input', function () {
    var fin = this.selectionStart === this.value.length;
    this.value = normaliserIban(this.value).replace(/(.{4})/g, '$1 ').trim();
    if (fin) this.selectionStart = this.selectionEnd = this.value.length;
});

form.ville.addEventListener('input', majSignature);

form.querySelectorAll('.form-group input').forEach(function (el) {
    el.addEventListener('input', function () { this.closest('.form-group').classList.remove('error'); });
    el.addEventListener('change', function () { this.closest('.form-group').classList.remove('error'); });
});

form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (form._gotcha.value) return;

    if (!valider()) {
        var premiere = form.querySelector('.form-group.error');
        if (premiere) premiere.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    var btn = form.querySelector('.btn-submit');
    var texteInitial = btn.textContent;
    btn.textContent = 'Envoi en cours...';
    btn.disabled = true;

    var f = calculerFormule();
    var maintenant = new Date();
    var dateSignature = maintenant.toLocaleDateString('fr-FR') + ' à ' + maintenant.toLocaleTimeString('fr-FR');
    var nomComplet = form.prenom.value.trim() + ' ' + form.nom.value.trim();
    var iban = normaliserIban(form.iban.value);
    var adresse = form.adresse.value.trim() + ', ' + form.cp.value.trim() + ' ' + form.ville.value.trim();

    var recap = [
        'MANDAT DE PRÉLÈVEMENT SEPA — ACCEPTÉ EN LIGNE',
        'RUM : ' + rum,
        'Signé le : ' + dateSignature + ' — lieu : ' + form.ville.value.trim(),
        'Type : ' + PERIODE.type,
        '',
        'Formule : ' + f.libelle,
        PERIODE.montant + ' : ' + formaterEuros(f.total),
        OFFRE.prixSuivant ? 'Années suivantes : ' + formaterEuros(OFFRE.prixSuivant) + ' / an' : null,
        '',
        'Titulaire : ' + nomComplet,
        'Raison sociale : ' + (form.entreprise.value.trim() || 'Non renseigné'),
        'Adresse : ' + adresse,
        'IBAN : ' + iban,
        '',
        'Créancier : ' + CREANCIER.nom + ' — ICS ' + CREANCIER.ics,
        'Mandat accepté : oui — Formule et ' + PERIODE.engagement + ' acceptés : oui'
    ].filter(function (l) { return l !== null; }).join('\n');

    var payload = new FormData();
    payload.append('name', nomComplet);
    payload.append('email', form.email.value.trim());
    payload.append('phone', form.telephone.value.trim());
    payload.append('company', form.entreprise.value.trim());
    payload.append('subject', 'Mandat SEPA — ' + rum);
    payload.append('message', recap);
    payload.append('rum', rum);
    payload.append('iban', iban);
    payload.append('adresse', adresse);
    payload.append('formule', f.libelle);
    payload.append('montant', String(f.total));
    payload.append('periodicite', PERIODE.type);
    if (OFFRE.prixSuivant) payload.append('montant_annees_suivantes', String(OFFRE.prixSuivant));
    payload.append('date_signature', maintenant.toISOString());

    try {
        var response = await fetch(WEBHOOK_URL, { method: 'POST', body: payload });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        afficherConfirmation(f, nomComplet, iban, dateSignature);
    } catch (err) {
        alert('Erreur lors de l\'envoi du mandat. Veuillez réessayer.');
        btn.textContent = texteInitial;
        btn.disabled = false;
    }
});

function afficherConfirmation(f, nomComplet, iban, dateSignature) {
    var card = document.getElementById('mandatCard');
    card.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.className = 'mandat-done';
    wrap.innerHTML =
        '<h2 class="form-page-title">Mandat bien <span>signé</span> !</h2>' +
        '<p class="form-page-subtitle">Merci, votre mandat de prélèvement SEPA est enregistré. Conservez votre référence de mandat.</p>' +
        '<div class="mandat-box"><dl></dl></div>';
    var dl = wrap.querySelector('dl');
    [
        ['Référence (RUM)', rum],
        ['Formule', f.libelle],
        [PERIODE.montant, formaterEuros(f.total)],
        OFFRE.prixSuivant ? ['Années suivantes', formaterEuros(OFFRE.prixSuivant) + ' / an'] : null,
        ['Titulaire', nomComplet],
        ['IBAN', masquerIban(iban)],
        ['Signé le', dateSignature],
        ['Créancier', CREANCIER.nom + ' — ICS ' + CREANCIER.ics]
    ].filter(Boolean).forEach(function (l) {
        var dt = document.createElement('dt'); dt.textContent = l[0];
        var dd = document.createElement('dd'); dd.textContent = l[1];
        dl.appendChild(dt); dl.appendChild(dd);
    });
    card.appendChild(wrap);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

prefillDepuisUrl();
majTotal();
majSignature();
