## Kluczowe Praktyki Svelte dla "Cart-1D" (Najważniejsze):

1.  **Integracja i Reakcja na `GameState`:**

    - **Subskrypcja w `onMount`**: W głównym komponencie (lub `Scene.svelte`) użyj `onMount` do zasubskrybowania się do `GameState.subscribe(twojaFunkcjaRenderujaca)`. Pamiętaj o `onDestroy` do odsubskrybowania. To jest serce dynamicznej wizualizacji.
    - **Przekazywanie `GameState` jako Props**: Przekaż aktualny stan (lub jego relevantne części) z `GameState` jako props do komponentów `Scene` i `ControlPanel`.

2.  **Reaktywność Svelte do Synchronizacji UI ze Stanem:**

    - **Deklaracje Reaktywne (`$:`)**: Używaj `$:`, aby automatycznie wywołać funkcję rysującą na canvasie (`render(state)`), gdy tylko `GameState` (przekazany jako prop lub odczytany ze store'a) się zmieni. To zapewni, że wizualizacja jest zawsze aktualna.
      - Przykład: `$: if (canvasElement && currentGameState) { renderOnCanvas(canvasElement, currentGameState); }`
    - **Dwukierunkowe Bindowanie (`bind:value`)**: Absolutnie kluczowe dla sliderów i checkboxa w `ControlPanel`. Użyj `bind:value={GameState.params.mass}` (lub podobnie, jeśli `params` jest bezpośrednio modyfikowalny) lub `bind:value={lokalnaZmienna}` w połączeniu z `on:input` do aktualizacji `GameState` przez jego metody. To najprostszy sposób na synchronizację inputów użytkownika ze stanem.

3.  **Struktura Komponentów: `Scene` i `ControlPanel`:**

    - **Podział na Komponenty**: Od razu stwórz komponent `Scene.svelte` (dla logiki ``) i `ControlPanel.svelte` (dla interaktywnych kontrolek). To utrzyma porządek i oddzieli logikę rysowania od logiki sterowania.

4.  **Bezpośrednie Wywoływanie Metod `GameState`:**

    - **Obsługa Zdarzeń (`on:click`, `on:change`)**: W `ControlPanel.svelte`, używaj `on:click` na przyciskach, aby wywołać `GameState.start()`, `GameState.pause()`, `GameState.reset()`. Podobnie `on:change` (lub `bind:group` dla radio) do zmiany `GameState.mode`. To realizuje zasadę, że "UI niczego nie liczy, tylko woła metody GameState".

5.  **Interakcja z Canvas (`bind:this`)**:
    - **Referencja do Canvas**: W `Scene.svelte`, użyj ``, aby uzyskać w skrypcie bezpośrednią referencję do elementu DOM canvasa, którą przekażesz do swojej funkcji rysującej `render(canvas, state)`.

**Dlaczego te są "mega aplikujące się"?**

- **Rdzeń Funkcjonalności**: Bezpośrednio adresują kluczowe wymagania Twojej aplikacji: rysowanie na podstawie dynamicznego stanu i interakcja użytkownika modyfikująca ten stan.
- **Wykorzystanie Mocy Svelte**: To są mechanizmy, w których Svelte błyszczy i które najbardziej upraszczają kod w tego typu aplikacjach (reaktywność, bindowanie).
- **Prostota Implementacji**: Skupienie się na tych punktach pozwoli Ci szybko uzyskać działający prototyp.

Pozostałe praktyki (jak zaawansowane stores, szczegółowa optymalizacja, pełna dostępność od A do Z) są ważne, ale można je dopracować później. Te pięć punktów to fundament, który musisz dobrze postawić _teraz_.

---

Answer from Perplexity: pplx.ai/share
