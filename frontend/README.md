# AgroSistem — Aplicație Management Agricol & APIA

## INSTRUCȚIUNI PAS CU PAS

### Cerințe prealabile
Trebuie să ai instalat **Node.js** pe laptop.

1. Verifică dacă ai Node.js deschizând **Command Prompt** (Windows) sau **Terminal** (Mac/Linux):
   ```
   node --version
   ```
   Dacă apare o versiune (ex: v18.17.0), ești OK. Dacă nu, descarcă de la: https://nodejs.org (alege versiunea LTS).

### Pași de instalare

**Pasul 1:** Dezarhivează fișierul `agrosistem-app.zip` unde vrei pe calculator (ex: pe Desktop).

**Pasul 2:** Deschide **Command Prompt** (Windows) sau **Terminal** (Mac/Linux).

**Pasul 3:** Navighează la folderul dezarhivat:
```
cd Desktop/agrosistem-app
```
(sau calea unde l-ai extras)

**Pasul 4:** Instalează dependențele (o singură dată):
```
npm install
```
Aceasta va dura 1-3 minute. Va apărea un folder `node_modules`.

**Pasul 5:** Pornește aplicația:
```
npm start
```

**Pasul 6:** Se va deschide automat browserul la adresa:
```
http://localhost:3000
```

### Cum folosești aplicația

1. **Creează cont** — apasă "Cont nou", pune numele, email-ul și o parolă
2. **Creează fermă** — completează denumirea, CUI, localitate, județ, IBAN, bancă
3. **Tab Terenuri** — adaugi blocuri fizice și parcele pe fiecare bloc
4. **Tab Istoric & Rotație** — aloci culturi pe parcele per an/sezon. Aplicația avertizează dacă repeți aceeași cultură
5. **Tab Fișe Tehnice** — adaugi lucrări pe parcele individuale, apoi vizualizezi fișa consolidată pe cultură
6. **Tab Recoltare** — introduci cantitatea totală pe cultură, distribuția pe parcele se calculează automat
7. **Tab APIA** — raportul se generează automat, cu verificare GAEC 7
8. **Tab Motorină** — achiziții, consumuri, stoc curent

### Note importante

- Datele se salvează în **localStorage** (în browser). Dacă ștergi datele browserului, pierzi totul.
- Toate tabelele au buton **Exportă CSV** pentru a descărca datele.
- Poți avea **mai multe ferme** pe același cont.
- Aplicația rulează **local** pe calculatorul tău — nu trimite date pe internet.

### Oprire aplicație
Apasă **Ctrl + C** în Command Prompt / Terminal.

### Repornire
Revino la folderul aplicației și rulează din nou:
```
npm start
```
(Nu mai trebuie `npm install` — se face doar o dată.)
