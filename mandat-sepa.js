var WEBHOOK_URL = 'https://webprime.app/webhook/contact/bc024c6a49270fbd5c6410130a36f4a25f54b1d8af00affb5697d01be039f033';
var CREANCIER = {
    nom: 'Daelia Partners',
    adresse: '7 avenue des Belles Fontaines, 91600 Savigny-sur-Orge',
    ics: 'FR78ZZZ8B26BD'
};

var RIB = {
    titulaire: 'Daelia Partners',
    iban: 'FR76 1695 8000 0194 9590 5994 191',
    bic: 'QNTOFRP1XXX',
    banque: 'Qonto'
};

var NB_MENSUALITES = 12;
var PERIODICITE = 'récurrent (mensuel)';

var form = document.getElementById('mandatForm');
var rum = genererRum();

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

function libelleFormule() { return OFFRE.nom + ' — ' + formaterEuros(OFFRE.total); }

function echeancier() {
    return (NB_MENSUALITES - 1) + ' × ' + formaterEuros(OFFRE.mensualite) + ' puis ' + formaterEuros(OFFRE.derniere);
}

function blocVirement() {
    var box = document.createElement('div');
    box.className = 'mandat-box mandat-virement';
    box.innerHTML = '<h3>1er paiement par virement</h3><p></p><dl></dl>';
    box.querySelector('p').textContent = 'Le premier paiement de ' + formaterEuros(OFFRE.acompte) +
        ' (30% à la signature) se fait par virement bancaire. Les ' + NB_MENSUALITES + ' mensualités (' + echeancier() +
        ') sont ensuite prélevées automatiquement chaque mois par prélèvement SEPA, puis la gestion mensuelle de ' +
        formaterEuros(OFFRE.gestion) + ', sans engagement.';
    var dl = box.querySelector('dl');
    [
        ['Montant', formaterEuros(OFFRE.acompte)],
        ['Titulaire', RIB.titulaire],
        ['IBAN', RIB.iban, true],
        ['BIC', RIB.bic, true],
        ['Banque', RIB.banque]
    ].forEach(function (l) {
        var dt = document.createElement('dt'); dt.textContent = l[0];
        var dd = document.createElement('dd'); dd.textContent = l[1];
        if (l[2]) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'rib-copier';
            btn.textContent = 'Copier';
            btn.addEventListener('click', function () {
                navigator.clipboard.writeText(l[1].replace(/\s+/g, '')).then(function () {
                    btn.textContent = 'Copié ✓';
                    setTimeout(function () { btn.textContent = 'Copier'; }, 2000);
                });
            });
            dd.appendChild(document.createTextNode(' '));
            dd.appendChild(btn);
        }
        dl.appendChild(dt); dl.appendChild(dd);
    });
    return box;
}

(function () {
    var style = document.createElement('style');
    style.textContent = '.mandat-virement { background: var(--bg-alt); }' +
        '.mandat-suite { margin: 20px 0; } .mandat-suite p { margin: 0 0 12px; } .mandat-suite .btn-submit { display: inline-block; text-decoration: none; margin: 0; }' +
        '.rib-copier { font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; border: 2px solid var(--ink); border-radius: 6px; background: var(--bg-card); padding: 1px 8px; margin-left: 6px; }';
    document.head.appendChild(style);
    var signature = document.getElementById('signatureInfo');
    signature.parentNode.insertBefore(blocVirement(), signature);
})();

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

    var maintenant = new Date();
    var dateSignature = maintenant.toLocaleDateString('fr-FR') + ' à ' + maintenant.toLocaleTimeString('fr-FR');
    var nomComplet = form.prenom.value.trim() + ' ' + form.nom.value.trim();
    var iban = normaliserIban(form.iban.value);
    var adresse = form.adresse.value.trim() + ', ' + form.cp.value.trim() + ' ' + form.ville.value.trim();

    var recap = [
        'MANDAT DE PRÉLÈVEMENT SEPA — ACCEPTÉ EN LIGNE',
        'RUM : ' + rum,
        'Signé le : ' + dateSignature + ' — lieu : ' + form.ville.value.trim(),
        'Type : ' + PERIODICITE,
        '',
        'Formule : ' + libelleFormule(),
        '1er paiement (30% à la signature) : ' + formaterEuros(OFFRE.acompte) + ' par virement',
        NB_MENSUALITES + ' mensualités par prélèvement SEPA : ' + echeancier(),
        'Total de l\'application : ' + formaterEuros(OFFRE.total),
        'Ensuite : gestion mensuelle ' + formaterEuros(OFFRE.gestion) + ' / mois, sans engagement',
        '',
        'Titulaire : ' + nomComplet,
        'Raison sociale : ' + (form.entreprise.value.trim() || 'Non renseigné'),
        'Adresse : ' + adresse,
        'IBAN : ' + iban,
        '',
        'Créancier : ' + CREANCIER.nom + ' — ICS ' + CREANCIER.ics,
        'Mandat accepté : oui — Formule, échéancier et engagement de 12 mois acceptés : oui'
    ].join('\n');

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
    payload.append('formule', libelleFormule());
    payload.append('formule_cle', OFFRE.cle);
    payload.append('montant', String(OFFRE.acompte));
    payload.append('montant_total', String(OFFRE.total));
    payload.append('nb_mensualites', String(NB_MENSUALITES));
    payload.append('mensualite', String(OFFRE.mensualite));
    payload.append('derniere_mensualite', String(OFFRE.derniere));
    payload.append('gestion_mensuelle', String(OFFRE.gestion));
    payload.append('periodicite', PERIODICITE);
    payload.append('date_signature', maintenant.toISOString());

    try {
        var response = await fetch(WEBHOOK_URL, { method: 'POST', body: payload });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        afficherConfirmation(nomComplet, iban, dateSignature);
    } catch (err) {
        alert('Erreur lors de l\'envoi du mandat. Veuillez réessayer.');
        btn.textContent = texteInitial;
        btn.disabled = false;
    }
});

function lienFormulaireProjet() {
    var p = new URLSearchParams();
    p.set('offre', OFFRE.cle);
    if (form.email.value.trim()) p.set('email', form.email.value.trim());
    if (form.telephone.value.trim()) p.set('telephone', form.telephone.value.trim());
    if (form.entreprise.value.trim()) p.set('entreprise', form.entreprise.value.trim());
    return 'https://webprime.fr/dhfgmskfh.html?' + p.toString();
}

function afficherConfirmation(nomComplet, iban, dateSignature) {
    var lien = lienFormulaireProjet();
    var card = document.getElementById('mandatCard');
    card.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.className = 'mandat-done';
    wrap.innerHTML =
        '<h2 class="form-page-title">Mandat bien <span>signé</span> !</h2>' +
        '<p class="form-page-subtitle">Merci, votre mandat de prélèvement SEPA est enregistré. Conservez votre référence de mandat.</p>' +
        '<div class="mandat-suite"><p><b>Dernière étape :</b> remplissez vos informations pour lancer la création de votre application.</p>' +
        '<a class="btn-submit" id="lienFormulaireProjet">Remplir mes informations projet →</a></div>' +
        '<div class="mandat-box"><dl></dl></div>';
    wrap.querySelector('#lienFormulaireProjet').href = lien;
    var dl = wrap.querySelector('dl');
    [
        ['Référence (RUM)', rum],
        ['Formule', libelleFormule()],
        ['À la signature', formaterEuros(OFFRE.acompte) + ' par virement'],
        ['Mensualités', echeancier() + ' par prélèvement'],
        ['Ensuite', 'Gestion ' + formaterEuros(OFFRE.gestion) + ' / mois, sans engagement'],
        ['Titulaire', nomComplet],
        ['IBAN', masquerIban(iban)],
        ['Signé le', dateSignature],
        ['Créancier', CREANCIER.nom + ' — ICS ' + CREANCIER.ics]
    ].forEach(function (l) {
        var dt = document.createElement('dt'); dt.textContent = l[0];
        var dd = document.createElement('dd'); dd.textContent = l[1];
        dl.appendChild(dt); dl.appendChild(dd);
    });
    wrap.insertBefore(blocVirement(), wrap.querySelector('.mandat-box'));
    card.appendChild(wrap);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

prefillDepuisUrl();
majSignature();
