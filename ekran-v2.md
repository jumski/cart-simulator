# Cart-1D – szybka specyfikacja dla UI-/UX-designera  
wersja 1.1  (2024-06-XX)

Nadrzędny cel  
Stworzyć najprostszą, czytelną wizualizację 1-wymiarowego ruchu wózka, która pomoże siódmoklasiście (ADHD) „zobaczyć” treści lekcji z działu dynamiki, kinematyki, energii i mocy.  

Kod fizyki już istnieje – Ty rysujesz to, co dostaniesz w obiekcie `GameState`.

---

## 1. Makieta 16 : 9 (1280 × 720)  

| Obszar            | Pozycja (px)   | Rozmiar (px) | Rola                                           |
|-------------------|---------------|--------------|------------------------------------------------|
| SCENA / Canvas    | x 0 – 896     | 896 × 720    | Wszystko, co „fizyczne”                        |
| PANEL sterowania  | x 896 – 1280  | 384 × 720    | Slidery + przyciski + tryby widoku            |

> Przy innych rozdzielczościach oba bloki rozciągają się procentowo (70 % / 30 %).  
> Poniżej 1024 px szerokości panel ląduje pod canvasem (100 % szer., wys. auto).

---

## 2. Stałe elementy sceny

1. Tor poziomy  
   • Linia 4 px #9E9E9E, y = 540 px, x = 0-800 px  
2. Pochylnia (opcjonalna)  
   • Trójkąt #DDDDDD od x 0-400 px, kąt = `GameState.angleDeg`  
3. Wózek  
   • 120 × 70 px, kolor #2D8CFF, obrys 2 px #004E9E  
   • Punkt odniesienia: środek dolnej krawędzi → x = `xM · 80` px  
4. Skala liniowa  
   • Znaczniki co 1 m (80 px); co 2 m podpis „0 m, 2 m, 4 m …”

---

## 3. Tryby wizualizacji (przełączane radiobuttonem)

| Tryb       | Co rysujemy?                                                                                             |
|------------|-----------------------------------------------------------------------------------------------------------|
| Forces     | Wektory: ΣF (czerwony), F_applied (zielony), F_friction (niebieski). Dł. = F · 5 px. Etykieta przy końcu. |
| Motion     | Strzałka prędkości + wykresy x-t, v-t, a-t (3 linie, wspólny prostokąt 800 × 120 px pod torem).            |
| Energy     | 3 słupki nad wózkiem: Ek (red), Ep (green), W (blue). 0.5 px = 1 J, max 200 J = 100 px.                   |
| Power      | Licznik cyfrowy „P = 000 W” + półokrągły watomierz R = 60 px (x=630,y=40). Wykres P-t zamiast x/v/a.       |

Widoczność = `GameState.mode`.

---

## 4. Panel sterowania (384 px szer.)

### Parametry (nagłówek 16 px bold)  

| Label        | Slider range (step) | Domyślne | Notka                   |
|--------------|--------------------|----------|-------------------------|
| Mass [kg]    | 1-10 (0.1)         | 2.0      |                         |
| Force [N]    | 0-30 (0.5)         | 5.0      |                         |
| Friction μ   | 0-0.5 (0.01)       | 0.00     | Checkbox „No friction”  |
| Ramp [°]     | 0-30 (1)           | 0        | 0 ° = poziom            |
| Duration [s] | 0-10 (0.1)         | 3        | czas działania siły     |

Każdy slider: 260 px + 60 px licznik po prawej.

### Tryb widoku  
Radio-group w jednym wierszu (4 × 80 × 32 px, gap 12 px).  

### Sterowanie  
START/PAUSE (toggle, 160 × 48 px) – niebieski / czerwony przy pauzie  
RESET (120 × 48 px, obrys primary)  
Checkbox „No friction (μ = 0)”

---

## 5. Jak to łączyć z kodem

Najważniejsze: UI niczego nie liczy, tylko PRZECZYTUJE `GameState` i woła jego metody.

```
GameState.start()   // rusza timer
GameState.pause()   // stopuje
GameState.reset()   // wszystko od zera
```

• Slidery → onInput zmieniają `GameState.params.*`  
• Radio-group → `GameState.mode = 'motion' | 'energy' …`  
• Checkbox → ustawia `frictionMu = 0` i wyszarza slider.  

`render(state)` – pojedyncza funkcja czyszcząca canvas i rysująca wszystko według bieżących wartości. Uruchamiana przez `GameState.subscribe(render)` (60 fps albo tylko przy zmianach).

---

## 6. Dostępność / czytelność

• Każdy focus-state widoczny (outline)  
• Aria-label dla sliderów, przycisków i trybów  
• Kontrast WCAG AA (tekst #333 na #FFF, ratio ≥ 4.5 : 1)

---

## 7. Zestaw kolorów & font

Primary #2D8CFF  
Red     #E53935  
Green   #43A047  
Blue    #1E88E5  
Gray    #9E9E9E  
Background #F4F4F4  
Text #333333  
Font: Google Roboto 400/700

---

## 8. TL;DR dla projektanta

1. Dziel ekran 70 / 30.  
2. Canvas: narysuj tor, (opcjonalną) rampę, wózek i to, czego wymaga wybrany tryb.  
3. Panel: 5 sliderów, 4 radiobutt., 2 przyciski, 1 checkbox.  
4. Każde UI-zdarzenie idzie bezpośrednio do `GameState`.  
5. Cała aktualizacja widoku = `render(GameState)`.

I tyle – resztę dopowie silnik fizyczny. Powodzenia!
