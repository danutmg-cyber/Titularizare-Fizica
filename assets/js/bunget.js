/* ==========================================================================
   BUNGET.JS
   Titularizare Fizica
   Ion Bunget - Compendiu de Fizica

   Repository:
   /assets/js/bunget.js

   Scop:
   Functionalitati globale comune tuturor lectiilor Bunget:
   - tema Zi / Noapte
   - dimensiunea textului A- / A+
   - progresul lecturii
   - salvare / tiparire PDF
   - pregatirea continutului pentru print
   - flashcards
   - checklist persistent
   - utilitare comune pentru quiz.js si components.js

   Fara dependinte externe.

   Versiune: 1.0
   ========================================================================== */

(() => {
  'use strict';


  /* =========================================================================
     1. CONFIGURARE
     ========================================================================= */

  const CONFIG = {

    storage: {
      theme: 'bunget-theme',
      fontScale: 'bunget-font-scale',
      checklistPrefix: 'bunget-checklist'
    },

    theme: {
      light: 'light',
      dark: 'dark'
    },

    font: {
      defaultScale: 1,
      minScale: 0.85,
      maxScale: 1.30,
      step: 0.05
    },

    selectors: {

      themeButtons: [
        '#theme-toggle',
        '[data-action="toggle-theme"]'
      ].join(','),

      fontUpButtons: [
        '#font-up',
        '[data-action="font-up"]'
      ].join(','),

      fontDownButtons: [
        '#font-down',
        '[data-action="font-down"]'
      ].join(','),

      fontResetButtons: [
        '#font-reset',
        '[data-action="font-reset"]'
      ].join(','),

      printButtons: [
        '#save-pdf',
        '[data-action="print"]',
        '[data-action="save-pdf"]'
      ].join(','),

      progress: [
        '#reading-progress',
        '.reading-progress'
      ].join(','),

      flashcards: '.flashcard',

      checklistInputs:
        '.checklist input[type="checkbox"][data-no-persist!="true"]',

      details:
        'details'
    }

  };


  /* =========================================================================
     2. UTILITARE STORAGE
     localStorage poate fi blocat in unele browsere / moduri private.
     ========================================================================= */

  const Storage = {

    get(key, fallback = null) {

      try {

        const value =
          window.localStorage.getItem(key);

        return value === null
          ? fallback
          : value;

      }

      catch (error) {

        return fallback;

      }

    },


    set(key, value) {

      try {

        window.localStorage.setItem(
          key,
          String(value)
        );

        return true;

      }

      catch (error) {

        return false;

      }

    },


    remove(key) {

      try {

        window.localStorage.removeItem(key);

        return true;

      }

      catch (error) {

        return false;

      }

    }

  };


  /* =========================================================================
     3. IDENTIFICAREA LECTIEI
     Recomandare:
     <body data-lesson-id="I-1.1">
     ========================================================================= */

  function getLessonId() {

    const bodyLessonId =
      document.body?.dataset?.lessonId;

    if (bodyLessonId) {
      return bodyLessonId;
    }


    const htmlLessonId =
      document.documentElement?.dataset?.lessonId;

    if (htmlLessonId) {
      return htmlLessonId;
    }


    /*
      Fallback din numele fisierului.

      Exemplu:
      /1.1-miscare-si-repaus.html
      ->
      1.1-miscare-si-repaus
    */

    const fileName =
      window.location.pathname
        .split('/')
        .pop()
        ?.replace(/\.html?$/i, '');

    return fileName || 'unknown-lesson';

  }


  /* =========================================================================
     4. TEMA ZI / NOAPTE
     Standard:
     <html data-theme="dark">
     ========================================================================= */

  function systemPrefersDark() {

    return Boolean(
      window.matchMedia &&
      window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches
    );

  }


  function getInitialTheme() {

    const storedTheme =
      Storage.get(
        CONFIG.storage.theme
      );


    if (
      storedTheme === CONFIG.theme.light ||
      storedTheme === CONFIG.theme.dark
    ) {

      return storedTheme;

    }


    return systemPrefersDark()
      ? CONFIG.theme.dark
      : CONFIG.theme.light;

  }


  function applyTheme(
    theme,
    persist = true
  ) {

    const normalizedTheme =
      theme === CONFIG.theme.dark
        ? CONFIG.theme.dark
        : CONFIG.theme.light;


    document.documentElement.dataset.theme =
      normalizedTheme;


    /*
      Compatibilitate cu paginile mai vechi
      care folosesc body.dark.
    */

    if (document.body) {

      document.body.classList.toggle(
        'dark',
        normalizedTheme === CONFIG.theme.dark
      );

    }


    if (persist) {

      Storage.set(
        CONFIG.storage.theme,
        normalizedTheme
      );

    }


    updateThemeButtons(
      normalizedTheme
    );


    document.dispatchEvent(
      new CustomEvent(
        'bunget:themechange',
        {
          detail: {
            theme: normalizedTheme
          }
        }
      )
    );

  }


  function toggleTheme() {

    const current =
      document.documentElement.dataset.theme;


    const next =
      current === CONFIG.theme.dark
        ? CONFIG.theme.light
        : CONFIG.theme.dark;


    applyTheme(next);

  }


  function updateThemeButtons(theme) {

    const isDark =
      theme === CONFIG.theme.dark;


    document
      .querySelectorAll(
        CONFIG.selectors.themeButtons
      )
      .forEach(button => {

        button.setAttribute(
          'aria-pressed',
          String(isDark)
        );


        button.setAttribute(
          'aria-label',
          isDark
            ? 'Activeaza tema de zi'
            : 'Activeaza tema de noapte'
        );


        button.setAttribute(
          'title',
          isDark
            ? 'Tema Zi'
            : 'Tema Noapte'
        );


        /*
          Daca butonul are:
          <span data-theme-icon></span>
          <span class="btn-label"></span>

          actualizam separat iconita si textul.
        */

        const icon =
          button.querySelector(
            '[data-theme-icon]'
          );

        const label =
          button.querySelector(
            '.btn-label'
          );


        if (icon) {

          icon.textContent =
            isDark
              ? '☀'
              : '☾';

        }


        if (label) {

          label.textContent =
            isDark
              ? 'Zi'
              : 'Noapte';

        }


        /*
          Pentru butoane simple, fara copii HTML.
        */

        if (
          !icon &&
          !label &&
          button.dataset.keepContent !== 'true'
        ) {

          button.textContent =
            isDark
              ? '☀ Zi'
              : '☾ Noapte';

        }

      });

  }


  /*
    Aplicam tema cat mai devreme posibil.

    Deoarece fisierul este recomandat cu "defer",
    executia are loc dupa parsarea HTML-ului, dar
    inainte de DOMContentLoaded.
  */

  applyTheme(
    getInitialTheme(),
    false
  );


  /* =========================================================================
     5. DIMENSIUNEA TEXTULUI
     Controleaza:
     --font-scale
     din bunget.css
     ========================================================================= */

  function clamp(
    value,
    min,
    max
  ) {

    return Math.min(
      Math.max(value, min),
      max
    );

  }


  function getStoredFontScale() {

    const stored =
      parseFloat(
        Storage.get(
          CONFIG.storage.fontScale,
          CONFIG.font.defaultScale
        )
      );


    if (!Number.isFinite(stored)) {

      return CONFIG.font.defaultScale;

    }


    return clamp(
      stored,
      CONFIG.font.minScale,
      CONFIG.font.maxScale
    );

  }


  let fontScale =
    getStoredFontScale();


  function applyFontScale(
    scale,
    persist = true
  ) {

    fontScale =
      clamp(
        Number(scale),
        CONFIG.font.minScale,
        CONFIG.font.maxScale
      );


    /*
      Evitam valori precum:
      1.15000000002
    */

    fontScale =
      Math.round(
        fontScale * 100
      ) / 100;


    document.documentElement.style.setProperty(
      '--font-scale',
      String(fontScale)
    );


    if (persist) {

      Storage.set(
        CONFIG.storage.fontScale,
        fontScale
      );

    }


    updateFontButtons();


    document.dispatchEvent(
      new CustomEvent(
        'bunget:fontscalechange',
        {
          detail: {
            scale: fontScale
          }
        }
      )
    );

  }


  function increaseFont() {

    applyFontScale(
      fontScale +
      CONFIG.font.step
    );

  }


  function decreaseFont() {

    applyFontScale(
      fontScale -
      CONFIG.font.step
    );

  }


  function resetFont() {

    applyFontScale(
      CONFIG.font.defaultScale
    );

  }


  function updateFontButtons() {

    document
      .querySelectorAll(
        CONFIG.selectors.fontDownButtons
      )
      .forEach(button => {

        button.disabled =
          fontScale <=
          CONFIG.font.minScale;

      });


    document
      .querySelectorAll(
        CONFIG.selectors.fontUpButtons
      )
      .forEach(button => {

        button.disabled =
          fontScale >=
          CONFIG.font.maxScale;

      });


    document
      .querySelectorAll(
        '[data-font-scale-value]'
      )
      .forEach(element => {

        element.textContent =
          `${Math.round(fontScale * 100)}%`;

      });

  }


  applyFontScale(
    fontScale,
    false
  );


  /* =========================================================================
     6. PROGRESUL LECTURII
     ========================================================================= */

  let progressFramePending =
    false;


  function calculateReadingProgress() {

    const doc =
      document.documentElement;


    const scrollTop =
      window.scrollY ||
      doc.scrollTop ||
      0;


    const documentHeight =
      Math.max(
        doc.scrollHeight,
        document.body?.scrollHeight || 0
      );


    const viewportHeight =
      window.innerHeight ||
      doc.clientHeight;


    const scrollableHeight =
      documentHeight -
      viewportHeight;


    if (scrollableHeight <= 0) {
      return 100;
    }


    return clamp(
      (
        scrollTop /
        scrollableHeight
      ) * 100,
      0,
      100
    );

  }


  function renderReadingProgress() {

    progressFramePending =
      false;


    const percentage =
      calculateReadingProgress();


    document
      .querySelectorAll(
        CONFIG.selectors.progress
      )
      .forEach(element => {

        element.style.width =
          `${percentage}%`;


        element.setAttribute(
          'aria-valuenow',
          String(
            Math.round(percentage)
          )
        );

      });


    document.documentElement.style.setProperty(
      '--reading-progress',
      `${percentage}%`
    );


    document.dispatchEvent(
      new CustomEvent(
        'bunget:readingprogress',
        {
          detail: {
            percentage
          }
        }
      )
    );

  }


  function requestProgressUpdate() {

    if (progressFramePending) {
      return;
    }


    progressFramePending =
      true;


    window.requestAnimationFrame(
      renderReadingProgress
    );

  }


  /* =========================================================================
     7. PRINT / SALVARE PDF
     ========================================================================= */

  let detailsPrintState =
    [];


  function preparePrint() {

    document.documentElement.classList.add(
      'is-printing'
    );


    if (document.body) {

      document.body.classList.add(
        'is-printing'
      );

    }


    /*
      Salvam starea tuturor elementelor <details>
      pentru a o restaura dupa print.
    */

    detailsPrintState = [];


    document
      .querySelectorAll(
        CONFIG.selectors.details
      )
      .forEach(
        (detail, index) => {

          detailsPrintState[index] = {
            element: detail,
            wasOpen: detail.open
          };


          /*
            Optional:
            <details data-print-open="false">

            nu va fi fortat sa se deschida.
          */

          if (
            detail.dataset.printOpen !== 'false'
          ) {

            detail.open = true;

          }

        }
      );


    document.dispatchEvent(
      new CustomEvent(
        'bunget:beforeprint'
      )
    );

  }


  function restoreAfterPrint() {

    detailsPrintState
      .forEach(item => {

        if (
          item &&
          item.element
        ) {

          item.element.open =
            item.wasOpen;

        }

      });


    detailsPrintState = [];


    document.documentElement.classList.remove(
      'is-printing'
    );


    if (document.body) {

      document.body.classList.remove(
        'is-printing'
      );

    }


    document.dispatchEvent(
      new CustomEvent(
        'bunget:afterprint'
      )
    );

  }


  function printLesson() {

    /*
      MathJax poate fi inca in curs de randare.

      Daca exista MathJax.startup.promise,
      asteptam finalizarea lui.
    */

    const mathJaxPromise =
      window.MathJax?.startup?.promise;


    if (
      mathJaxPromise &&
      typeof mathJaxPromise.then === 'function'
    ) {

      mathJaxPromise
        .then(() => {

          window.print();

        })
        .catch(() => {

          window.print();

        });

    }

    else {

      window.print();

    }

  }


  /*
    Evenimente native ale browserului.

    Sunt declansate inclusiv prin Ctrl+P,
    nu doar de butonul nostru.
  */

  window.addEventListener(
    'beforeprint',
    preparePrint
  );


  window.addEventListener(
    'afterprint',
    restoreAfterPrint
  );


  /*
    Safari / unele browsere pot folosi
    matchMedia pentru starea de print.
  */

  if (window.matchMedia) {

    const printMedia =
      window.matchMedia('print');


    const handlePrintMedia =
      event => {

        if (event.matches) {

          if (
            !document.documentElement.classList.contains(
              'is-printing'
            )
          ) {

            preparePrint();

          }

        }

        else {

          if (
            document.documentElement.classList.contains(
              'is-printing'
            )
          ) {

            restoreAfterPrint();

          }

        }

      };


    if (
      typeof printMedia.addEventListener ===
      'function'
    ) {

      printMedia.addEventListener(
        'change',
        handlePrintMedia
      );

    }

    else if (
      typeof printMedia.addListener ===
      'function'
    ) {

      /*
        Compatibilitate browsere vechi.
      */

      printMedia.addListener(
        handlePrintMedia
      );

    }

  }


  /* =========================================================================
     8. FLASHCARDS
     Structura:

     <div class="flashcard" tabindex="0">
       <div class="flash-inner">
         ...
       </div>
     </div>
     ========================================================================= */

  function toggleFlashcard(card) {

    const flipped =
      card.classList.toggle(
        'flipped'
      );


    card.setAttribute(
      'aria-pressed',
      String(flipped)
    );


    card.setAttribute(
      'aria-label',
      flipped
        ? 'Arata intrebarea'
        : 'Arata raspunsul'
    );

  }


  function initFlashcards() {

    document
      .querySelectorAll(
        CONFIG.selectors.flashcards
      )
      .forEach(card => {

        /*
          Evitam initializarea multipla.
        */

        if (
          card.dataset.bungetInitialized ===
          'true'
        ) {

          return;

        }


        card.dataset.bungetInitialized =
          'true';


        if (
          !card.hasAttribute('tabindex')
        ) {

          card.setAttribute(
            'tabindex',
            '0'
          );

        }


        card.setAttribute(
          'role',
          'button'
        );


        card.setAttribute(
          'aria-pressed',
          'false'
        );


        card.setAttribute(
          'aria-label',
          'Arata raspunsul'
        );


        card.addEventListener(
          'click',
          () => {

            toggleFlashcard(card);

          }
        );


        card.addEventListener(
          'keydown',
          event => {

            if (
              event.key === 'Enter' ||
              event.key === ' '
            ) {

              event.preventDefault();

              toggleFlashcard(card);

            }

          }
        );

      });

  }


  /* =========================================================================
     9. CHECKLIST PERSISTENT
     Progresul se salveaza separat pentru fiecare lectie.

     Exemplu:
     <body data-lesson-id="I-1.1">

     <ul class="checklist">
       <li>
         <input type="checkbox">
         ...
       </li>
     </ul>

     Pentru cheie custom:
     data-persist-key="definitia-miscarii"

     Pentru a dezactiva salvarea:
     data-no-persist="true"
     ========================================================================= */

  function getChecklistStorageKey(
    input,
    index
  ) {

    const lessonId =
      getLessonId();


    const customKey =
      input.dataset.persistKey;


    const itemKey =
      customKey ||
      input.name ||
      input.id ||
      `item-${index}`;


    return [
      CONFIG.storage.checklistPrefix,
      lessonId,
      itemKey
    ].join(':');

  }


  function initChecklists() {

    const inputs =
      document.querySelectorAll(
        CONFIG.selectors.checklistInputs
      );


    inputs.forEach(
      (input, index) => {

        if (
          input.dataset.bungetInitialized ===
          'true'
        ) {

          return;

        }


        input.dataset.bungetInitialized =
          'true';


        const storageKey =
          getChecklistStorageKey(
            input,
            index
          );


        const stored =
          Storage.get(
            storageKey
          );


        if (stored !== null) {

          input.checked =
            stored === 'true';

        }


        input.addEventListener(
          'change',
          () => {

            Storage.set(
              storageKey,
              input.checked
            );


            dispatchChecklistProgress();

          }
        );

      }
    );


    dispatchChecklistProgress();

  }


  function getChecklistProgress() {

    const inputs =
      Array.from(
        document.querySelectorAll(
          CONFIG.selectors.checklistInputs
        )
      );


    const total =
      inputs.length;


    const completed =
      inputs.filter(
        input => input.checked
      ).length;


    const percentage =
      total > 0
        ? (
            completed /
            total
          ) * 100
        : 0;


    return {
      total,
      completed,
      percentage
    };

  }


  function dispatchChecklistProgress() {

    const progress =
      getChecklistProgress();


    document
      .querySelectorAll(
        '[data-checklist-progress]'
      )
      .forEach(element => {

        element.textContent =
          progress.total > 0
            ? `${progress.completed}/${progress.total}`
            : '0/0';

      });


    document
      .querySelectorAll(
        '[data-checklist-percent]'
      )
      .forEach(element => {

        element.textContent =
          `${Math.round(
            progress.percentage
          )}%`;

      });


    document.dispatchEvent(
      new CustomEvent(
        'bunget:checklistprogress',
        {
          detail: progress
        }
      )
    );

  }


  function resetChecklist() {

    const inputs =
      document.querySelectorAll(
        CONFIG.selectors.checklistInputs
      );


    inputs.forEach(
      (input, index) => {

        input.checked = false;


        Storage.remove(
          getChecklistStorageKey(
            input,
            index
          )
        );

      }
    );


    dispatchChecklistProgress();

  }


  /* =========================================================================
     10. INITIALIZAREA BUTOANELOR
     ========================================================================= */

  function initThemeButtons() {

    document
      .querySelectorAll(
        CONFIG.selectors.themeButtons
      )
      .forEach(button => {

        if (
          button.dataset.bungetInitialized ===
          'true'
        ) {

          return;

        }


        button.dataset.bungetInitialized =
          'true';


        button.addEventListener(
          'click',
          toggleTheme
        );

      });


    updateThemeButtons(
      document.documentElement.dataset.theme
    );

  }


  function initFontButtons() {

    document
      .querySelectorAll(
        CONFIG.selectors.fontUpButtons
      )
      .forEach(button => {

        if (
          button.dataset.bungetInitialized ===
          'true'
        ) {

          return;

        }


        button.dataset.bungetInitialized =
          'true';


        button.addEventListener(
          'click',
          increaseFont
        );

      });


    document
      .querySelectorAll(
        CONFIG.selectors.fontDownButtons
      )
      .forEach(button => {

        if (
          button.dataset.bungetInitialized ===
          'true'
        ) {

          return;

        }


        button.dataset.bungetInitialized =
          'true';


        button.addEventListener(
          'click',
          decreaseFont
        );

      });


    document
      .querySelectorAll(
        CONFIG.selectors.fontResetButtons
      )
      .forEach(button => {

        if (
          button.dataset.bungetInitialized ===
          'true'
        ) {

          return;

        }


        button.dataset.bungetInitialized =
          'true';


        button.addEventListener(
          'click',
          resetFont
        );

      });


    updateFontButtons();

  }


  function initPrintButtons() {

    document
      .querySelectorAll(
        CONFIG.selectors.printButtons
      )
      .forEach(button => {

        if (
          button.dataset.bungetInitialized ===
          'true'
        ) {

          return;

        }


        button.dataset.bungetInitialized =
          'true';


        button.addEventListener(
          'click',
          event => {

            event.preventDefault();

            printLesson();

          }
        );

      });

  }


  function initChecklistResetButtons() {

    document
      .querySelectorAll(
        '[data-action="reset-checklist"]'
      )
      .forEach(button => {

        if (
          button.dataset.bungetInitialized ===
          'true'
        ) {

          return;

        }


        button.dataset.bungetInitialized =
          'true';


        button.addEventListener(
          'click',
          resetChecklist
        );

      });

  }


  /* =========================================================================
     11. BARA DE PROGRES - CONFIGURARE ARIA
     ========================================================================= */

  function initReadingProgress() {

    document
      .querySelectorAll(
        CONFIG.selectors.progress
      )
      .forEach(element => {

        element.setAttribute(
          'role',
          'progressbar'
        );


        element.setAttribute(
          'aria-label',
          'Progres lectura'
        );


        element.setAttribute(
          'aria-valuemin',
          '0'
        );


        element.setAttribute(
          'aria-valuemax',
          '100'
        );


        element.setAttribute(
          'aria-valuenow',
          '0'
        );

      });


    window.addEventListener(
      'scroll',
      requestProgressUpdate,
      {
        passive: true
      }
    );


    window.addEventListener(
      'resize',
      requestProgressUpdate,
      {
        passive: true
      }
    );


    requestProgressUpdate();

  }


  /* =========================================================================
     12. SINCRONIZARE INTRE TAB-URI / PAGINI
     Daca tema sau fontul este schimbat intr-un alt tab,
     pagina curenta se actualizeaza automat.
     ========================================================================= */

  function initStorageSync() {

    window.addEventListener(
      'storage',
      event => {

        if (
          event.key ===
          CONFIG.storage.theme
        ) {

          if (
            event.newValue ===
              CONFIG.theme.dark ||
            event.newValue ===
              CONFIG.theme.light
          ) {

            applyTheme(
              event.newValue,
              false
            );

          }

        }


        if (
          event.key ===
          CONFIG.storage.fontScale
        ) {

          const scale =
            parseFloat(
              event.newValue
            );


          if (
            Number.isFinite(scale)
          ) {

            applyFontScale(
              scale,
              false
            );

          }

        }

      }
    );

  }


  /* =========================================================================
     13. OBSERVER PENTRU COMPONENTE INCARCATE DINAMIC
     components.js poate genera header-ul dupa DOMContentLoaded.
     Observer-ul permite initializarea butoanelor nou introduse.
     ========================================================================= */

  let mutationScheduled =
    false;


  function reinitializeDynamicControls() {

    mutationScheduled =
      false;


    initThemeButtons();

    initFontButtons();

    initPrintButtons();

    initFlashcards();

    initChecklists();

    initChecklistResetButtons();

  }


  function initMutationObserver() {

    if (
      !window.MutationObserver
    ) {

      return;

    }


    const observer =
      new MutationObserver(
        mutations => {

          const hasAddedNodes =
            mutations.some(
              mutation =>
                mutation.addedNodes.length > 0
            );


          if (
            !hasAddedNodes ||
            mutationScheduled
          ) {

            return;

          }


          mutationScheduled = true;


          window.requestAnimationFrame(
            reinitializeDynamicControls
          );

        }
      );


    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );

  }


  /* =========================================================================
     14. EVENT DE PAGINA GATA
     Poate fi folosit de quiz.js / components.js.
     ========================================================================= */

  function dispatchReadyEvent() {

    document.dispatchEvent(
      new CustomEvent(
        'bunget:ready',
        {
          detail: {
            lessonId:
              getLessonId(),

            theme:
              document.documentElement
                .dataset.theme,

            fontScale
          }
        }
      )
    );

  }


  /* =========================================================================
     15. INITIALIZARE
     ========================================================================= */

  function init() {

    /*
      Reaplicam tema deoarece acum exista si <body>.
    */

    applyTheme(
      document.documentElement.dataset.theme ||
      getInitialTheme(),
      false
    );


    applyFontScale(
      fontScale,
      false
    );


    initThemeButtons();

    initFontButtons();

    initPrintButtons();

    initReadingProgress();

    initFlashcards();

    initChecklists();

    initChecklistResetButtons();

    initStorageSync();

    initMutationObserver();

    dispatchReadyEvent();

  }


  if (
    document.readyState === 'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      init,
      {
        once: true
      }
    );

  }

  else {

    init();

  }


  /* =========================================================================
     16. API PUBLIC
     components.js si quiz.js pot utiliza aceste functii fara duplicare.
     ========================================================================= */

  window.Bunget = {

    version: '1.0.0',

    config: CONFIG,

    storage: Storage,


    /* ---------- lectie ---------- */

    getLessonId,


    /* ---------- tema ---------- */

    theme: {

      get() {

        return (
          document.documentElement
            .dataset.theme ||
          CONFIG.theme.light
        );

      },

      set: applyTheme,

      toggle: toggleTheme

    },


    /* ---------- font ---------- */

    font: {

      get() {
        return fontScale;
      },

      set: applyFontScale,

      increase: increaseFont,

      decrease: decreaseFont,

      reset: resetFont

    },


    /* ---------- progres lectura ---------- */

    reading: {

      getProgress:
        calculateReadingProgress,

      update:
        requestProgressUpdate

    },


    /* ---------- PDF ---------- */

    print: {

      lesson:
        printLesson,

      prepare:
        preparePrint,

      restore:
        restoreAfterPrint

    },


    /* ---------- checklist ---------- */

    checklist: {

      getProgress:
        getChecklistProgress,

      reset:
        resetChecklist,

      refresh:
        initChecklists

    },


    /* ---------- flashcards ---------- */

    flashcards: {

      refresh:
        initFlashcards

    },


    /* ---------- reinitializare ---------- */

    refresh:
      reinitializeDynamicControls

  };

})();
