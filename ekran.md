SPECYFIKACJA EKRANU „WÓZEK-1D”
wersja 1.0 – 2024-06-XX
Dokument dla: UI-designer + Frontend-developer
Zakres: WYŁĄCZNIE warstwa wizualna + sposób mapowania na stan gry (JS GameState).
Silnik fizyki nie jest tu opisywany; zakładamy, że oblicza on właściwe wartości i
aktualizuje obiekt GameState, a UI je tylko odwzorowuje.

────────────────────────────────────────────────────────────────────────

1. SIATKA / UKŁAD STRONY
   ────────────────────────────────────────────────────────────────────────
   Rozdzielczość referencyjna: 1280 × 720 px (16:9).
   Układ skalowalny (procentowy), ale podaję wartości pikselowe dla makiety 1280 × 720.

A. Obszar SCENY (Canvas)
• Pozycja: x = 0, y = 0
• Rozmiar: w = 896 px (70 %), h = 720 px (100 %)
• Tło: jasnoszare (#F4F4F4) z cienką poziomą linią toru (y = 540 px).
• Zakres rysowania fizyki: oś X od 0 m do 10 m => mapowanie 1 m = 80 px.

B. Panel KONTROLI (Sidebar)
• Pozycja: x = 896 px, y = 0
• Rozmiar: w = 384 px (30 %), h = 720 px
• Kolor tła: białe (#FFFFFF) z cieniem #00000010.
• Podział pionowy na trzy sekcje:

     1. Parametry (top, wys. 340 px)
     2. Tryb wizualizacji (mid, wys. 120 px)
     3. Sterowanie symulacją (bottom, wys. 260 px)

──────────────────────────────────────────────────────────────────────── 2. ELEMENTY STAŁE SCENY (Canvas)
────────────────────────────────────────────────────────────────────────

1. TOR POZIOMY
   • Linia 4 px, ciemnoszara #9E9E9E, od x = 0 px do x = 800 px, y = 540 px.

2. POCHYLNIA (ramka, nieobowiązkowa)
   • Wysuwana graficznie od x = 0 do 400 px.
   • Kąt = GameState.angleDeg. Rysowana jako trójkąt w kolorze #DDDDDD.

3. WÓZEK (Sprite)
   • Prostokąt 120 × 70 px, kolor bazowy #2D8CFF, outline 2 px #004E9E.
   • Punktem referencyjnym jest środek dolnej krawędzi → to odwzorowuje
   współrzędną xScene = GameState.x \* 80 px oraz y = zależne od rampy.
   • Nad wózkiem zarezerwować 80 px wysokości na wektory/etykiety.

4. SKALA LINIOWA
   • Odcinki co 1 m (80 px). Co 2 m podpis w dolnym lewym rogu liczbą (0,2,4…).
   • Kolor #555555 60 %-transparent.

──────────────────────────────────────────────────────────────────────── 3. ELEMENTY DYNAMICZNE NA SCENIE
────────────────────────────────────────────────────────────────────────
Widoczność zależy od GameState.mode (’forces’, ’motion’, ’energy’, ’power’).

A. Tryb ‘forces’
• Wektory:
ΣF – czerwony #E53935, liniowy gradient od (#E53935 → #FFCDD2).
Fap – zielony #43A047
Ff – niebieski #1E88E5
Każdy rysowany z początku w środku wózka, długość = F/ScaleF, strzałka
wypełniona. Obok końcówki mała etykieta („ΣF=…N”).
ScaleF = 5 px / 1 N (czyli 20 N = 100 px).

B. Tryb ‘motion’
• Strzałka prędkości (czarna, 3 px) z etykietą „v=.. m/s”.
• 3 wykresy pod torem (obrys 1 px #888, wypełnienie α=40 %).
→ prostokąt 800 × 120 px (x 48, y 560).
Linia 1: x-t (szary #616161)
Linia 2: v-t (zielona #43A047)
Linia 3: a-t (czerwona #E53935)

C. Tryb ‘energy’
• Słupki (rect chart) nad wózkiem:
Ek – czerwony #E53935
Ep – zielony #43A047
W – niebieski #1E88E5
Wysokość maks. 100 px = 200 J (ScaleE = 0.5 px / J).

D. Tryb ‘power’
• Licznik cyfrowy w prawym górnym rogu canvasa:
Font 32 px „P = 000 W”, kol. #000.
• Watomierz analogowy: pół-okrąg o promieniu 60 px, osadzony
w prostokącie 150 × 100 px przy (x=630, y=40).
• Wykres P-t zastępuje wcześniejsze wykresy x/v/a (to ten sam obszar).

──────────────────────────────────────────────────────────────────────── 4. PANEL KONTROLI – SZCZEGÓŁY
────────────────────────────────────────────────────────────────────────
Font globalny: „Roboto”, 14 px, kolor #333.

4.1. Sekcja „PARAMETRY”
(nagłówek 16 px bold, #000, odstęp 12 px od góry)

| Nazwa (Label) | Typ               | Range / Step        | Domyślna | Szer. slidera | Położenie Y |
| ------------- | ----------------- | ------------------- | -------- | ------------- | ----------- |
| Mass [kg]     | input-range HTML5 | 1 – 10 ; step 0.1   | 2.0      | 260 px        | 40 px       |
| Force [N]     | input-range       | 0 – 30 ; step 0.5   | 5.0      | 260 px        | 90 px       |
| Friction μ    | input-range       | 0 – 0.5 ; step 0.01 | 0.00     | 260 px        | 140 px      |
| Ramp [°]      | input-range       | 0 – 30 ; step 1     | 0        | 260 px        | 190 px      |
| Duration [s]  | input-range       | 0 – 10 ; step 0.1   | 3        | 260 px        | 240 px      |

• Każdemu sliderowi towarzyszy dynamiczna wartość po prawej (width 60 px, align-right).

4.2. Sekcja „TRYB WIZUALIZACJI” (y start = 360 px)
Radio group (4 opcje):
◉ Forces ◯ Motion ◯ Energy ◯ Power
• Układ w pojedynczym wierszu; przycisk 80 × 32 px, gap 12 px.

4.3. Sekcja „STEROWANIE” (y start = 500 px)
• Button START/PAUSE (toggle) – primary, width 160 px, height 48 px,
kolor #2D8CFF (active) / #C62828 (paused).
• Button RESET – secondary, 120 × 48 px, kolor outline #2D8CFF.
• Checkbox „No friction (μ = 0)” – gdy zaznaczony, slider Friction disabled.

Razem wiersz: START/PAUSE | RESET | checkbox (wrap jeśli < 350 px).

──────────────────────────────────────────────────────────────────────── 5. POWIĄZANIE Z STANEM GRY (API WIDOKU)
────────────────────────────────────────────────────────────────────────
Widok jest jedynie projekcją obiektu `GameState` i NIE przechowuje własnych danych.
Jedyna dopuszczalna komunikacja:
• UI → GameState – zdarzenia użytkownika (onChange, onClick) modyfikują GameState.
• GameState → UI – subskrypcja / observer; każda zmiana powoduje `render()`.

Minimalna definicja obiektu (nie zawiera metod fizycznych):

```js
export const GameState = {
  // —— ustawienia kontrolne ——
  params: {
    massKg:     2.0,
    forceN:     5.0,
    frictionMu: 0.00,
    angleDeg:   0,
    durationS:  3.0
  },

  // —— status symulacji ——
  running: false,  // true = TIMER chodzi
  timeS:   0.0,    // aktualny czas od startu
  mode: 'forces',  // 'forces' | 'motion' | 'energy' | 'power'

  // —— wielkości dynamiczne (tylko do odczytu przez UI) ——
  xM: 0.0,      // pozycja
  vMS: 0.0,     // prędkość
  aMS2: 0.0,    // przyspieszenie
  forces: {     // 1D skala, dodatnie w prawo
    sumN: 0.0,
    appliedN: 0.0,
    frictionN: 0.0,
    gravityParallelN: 0.0
  },
  energy: {
    EkJ: 0.0,
    EpJ: 0.0,
    WJ:  0.0,
    lossJ: 0.0        // cieplne (opcjonalnie)
  },
  power: {
    instantW: 0.0,
    log: []          // tablica par {t, P}
  },

  // —— sygnały / metody kontrolne ——
  start()  { … },
  pause()  { … },
  reset()  { … },
  subscribe(listener) { … } // pattern observer
};
```

WIĄZANIE UŻYTKOWNICZE
• Slider “Mass” <input-range> → `onInput` (zmienia GameState.params.massKg).
• Radio group → ( ) `GameState.mode = value`.
• Button START/PAUSE → wywołuje `GameState.start()` lub `GameState.pause()`.
• Button RESET → `GameState.reset()`.
• Checkbox „No friction” → jeśli checked: `GameState.params.frictionMu = 0`.

RENDERING
Funkcja `render(GameState)` powinna:

1. Przeskalować wartości fizyczne do pikseli (xM → x px).
2. Wyczyścić canvas, narysować stałe tło, następnie dynamiczne: wózek, rampę,
   overlay zależny od mode.
3. Aktualizować wartości tekstowe/fill sliderów w panelu.

Synchronizacja (propozycja):
`GameState.subscribe(render)` wywoływane w pętli animacyjnej 60 fps lub tylko
po zmianie (diff patch).

──────────────────────────────────────────────────────────────────────── 6. WYMAGANIA DOSTĘPNOŚCI I RESPONSYWNOŚCI
────────────────────────────────────────────────────────────────────────
• Minimalna szerokość 1024 px – poniżej tej wartości panel kontrolny musi
przejść POD canvas (dwie sekcje: top canvas, bottom panel, 100 %).
• Wszystkie elementy klikalne z fokus-outline, aria-labels (np. aria-“Mass slider”).
• Kolory kontrast WCAG AA: tło #FFF vs tekst #333 (ratio 12:1).

──────────────────────────────────────────────────────────────────────── 7. ASSETY / TYPOGRAFIA / KOLOR
────────────────────────────────────────────────────────────────────────
• Font: Google Roboto 400/700, fallback sans-serif.
• Paleta główna:
#2D8CFF (primary) | #E53935 (red) | #43A047 (green) | #1E88E5 (blue)
#9E9E9E (mid gray) | #F4F4F4 (bg) | #333333 (text) | #FFFFFF (panel)

────────────────────────────────────────────────────────────────────────
KONIEC SPECYFIKACJI
