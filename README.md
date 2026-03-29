# AgroSistem - Management Agricol & Raportare APIA

AgroSistem este o soluție software completă (Full-Stack) creată pentru digitalizarea managementului unei ferme agricole. Aplicația permite urmărirea istoricului culturilor, gestionarea lucrărilor mecanice și manuale, distribuția automată a recoltei și generarea de rapoarte conform standardelor APIA (inclusiv verificări GAEC 7).

---

## 🚀 Funcționalități Principale

Aplicația este structurată în 8 secțiuni (tab-uri) principale:

### 1. Dashboard (Panou de Control)
*   **Sumar Vizual**: Statistici rapide despre suprafața totală a fermei, numărul de blocuri fizice, parcele și culturile active în anul curent.
*   **Harta SVG**: O reprezentare grafică dinamică a blocurilor fizice și a parcelelor, colorate codificat pentru a identifica ușor cultura fiecăreia.

### 2. Terenuri (Gestiune Patrimoniu)
*   **Blocuri Fizice**: Adăugarea și editarea blocurilor (Nr. bloc, Cod SIRUTA, Localitate).
*   **Parcele**: Organizarea terenului în parcele cu suprafețe specifice (ha) și categorii de folosință (TA - arabil, PP - pășune, etc.).
*   **Export**: Posibilitatea de a descărca registrul de parcele în format CSV.

### 3. Culturi & Rotație
*   **Planificare Agricolă**: Alocarea culturilor pe parcele pentru fiecare an agricol și sezon (Toamnă/Primăvară).
*   **Sistem de Alertă Rotație**: Verifică automat dacă pe aceeași parcelă s-a pus aceeași cultură doi ani la rând și avertizează utilizatorul (protecție împotriva epuizării solului).

### 4. Lucrări Agricole
*   **Registru Centralizator**: Înregistrarea tuturor operațiunilor (Arat, Semănat, Erbicidat, etc.).
*   **Gestiune Materiale**: Monitorizarea consumului de produse (ex: motorină, semințe, îngrășăminte) pe fiecare lucrare în parte.
*   **Filtrare Avansată**: Căutare rapidă după cultură sau categoria lucrării.

### 5. Fișe Tehnologice
*   **Consolidare Date**: Generează automat o fișă centralizată pentru o cultură specifică dintr-un an ales.
*   **Structură Pro**: Detaliază lucrările mecanice, manuale și input-urile folosite, calculând automat cantitățile totale și mediile pe hectar.

### 6. Recoltare (Distribuție Proporțională)
*   **Logica de Calcul**: Utilizatorul introduce cantitatea totală recoltată pentru o întreagă cultură (ex: 50 tone de grâu).
*   **Automatizare**: Sistemul calculează automat cât revine fiecărei parcele în funcție de suprafața acesteia (`(Cantitate_Totală / Suprafață_Totală) * Suprafață_Parcelă`).
*   **Jurnal Sesiuni**: Istoric detaliat cu umiditate, destinație și număr de aviz.

### 7. Rapoarte APIA
*   **Declarație Cerere de Plată**: Generează raportul tabelar exact în formatul cerut de APIA (Judet, Localitate, Bloc, Parcelă, Intervenție DR, Cod Pachet).
*   **Verificare GAEC 7**: Algoritm care validează diversificarea culturilor (ex: cultura principală să nu depășească 75% din suprafață pentru ferme > 10 ha).

### 8. Motorină (Gestiune Stoc)
*   **Achiziții vs. Consum**: Monitorizează stocul real de combustibil.
*   **Calcul Automat**: Carduri de stare care arată totalul cumpărat, totalul consumat în lucrări și stocul actual disponibil.

---

## 🛠️ Tehnologii Folosite (Tech Stack)

### Frontend
*   **React.js**: Interfață Single Page Application (SPA).
*   **Vanilla CSS-in-JS**: Stiluri optimizate pentru viteză, fără librării externe greoaie.
*   **SVG**: Generare dinamică pentru harta parcelelor.

### Backend
*   **Node.js & Express 5**: Server web performant cu rute securizate.
*   **Sequelize ORM**: Pentru interacțiunea cu baza de date (modelare obiectuală).
*   **JWT (JSON Web Tokens)**: Securizarea autentificării.
*   **Bcryptjs**: Criptarea parolelor utilizatorilor.

### Bază de Date
*   **PostgreSQL**: Bază de date relațională robustă pentru date critice.

---

## ⚙️ Procese "Sub Capotă"

1.  **Sincronizarea Bazei de Date**: La pornire, serverul verifică și actualizează automat structura tabelelor fără a șterge datele existente (`sequelize.sync({ alter: true })`).
2.  **Middleware de Protecție**: Toate cererile către API (în afară de Login/Register) trec printr-un filtru care verifică validitatea token-ului JWT.
3.  **Servire Statică**: În modul de producție, Backend-ul livrează direct fișierele de Frontend optimizate (din folderul `frontend/build`), eliminând nevoia de a rula două servere separate.

---

## 💻 Cum se instalează și rulează

### Cerințe:
*   Node.js (versiune 18 sau mai mare)
*   PostgreSQL instalat și pornit

### Pași pornire (Mod Dezvoltare):
1.  **Configurare Mediu**: Creează un fișier `.env` în folderul `backend` cu:
    ```env
    DB_NAME=agrosistem
    DB_USER=utilizatorul_tau
    DB_PASS=parola_ta
    DB_HOST=localhost
    DB_PORT=5432
    JWT_SECRET=o_cheie_secreta_lunga
    PORT=5001
    ```
2.  **Instalare Dependențe**:
    ```bash
    cd backend && npm install
    cd ../frontend && npm install
    ```
3.  **Pornire**:
    *   Backend: `cd backend && npm start`
    *   Frontend: `cd frontend && npm start`

### Mod Producție (Single Process):
1.  Construiește frontend-ul: `cd frontend && npm run build`
2.  Pornește doar backend-ul: `cd backend && node server.js`
3.  Accesează aplicația la: `http://localhost:5001`

---

## ☁️ Deployment (Render.com)
Aplicația este configurată să fie urcată pe Render.com. Aceasta va detecta automat `DATABASE_URL` oferit de Render și va servi interfața grafică pe URL-ul public generat.

---
*Creat cu iubire pentru eficientizarea muncii în agricultură.*

