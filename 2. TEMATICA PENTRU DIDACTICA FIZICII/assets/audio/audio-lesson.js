/* =========================================================
   TITULARIZARE FIZICA
   COMPONENTA AUDIO COMUNA
   ========================================================= */

(() => {

  "use strict";


  /* =======================================================
     INCARCA AUTOMAT CSS-UL AFLAT LANGA ACEST JS
     ======================================================= */

  const currentScript =
    document.currentScript;


  if (currentScript && currentScript.src) {

    const cssUrl =
      new URL(
        "audio-lesson.css",
        currentScript.src
      ).href;


    if (
      !document.querySelector(
        'link[data-audio-lesson-css]'
      )
    ) {

      const link =
        document.createElement("link");

      link.rel =
        "stylesheet";

      link.href =
        cssUrl;

      link.dataset.audioLessonCss =
        "true";

      document.head.appendChild(
        link
      );

    }

  }


  /* =======================================================
     INITIALIZARE
     ======================================================= */

  function initAudioLesson() {

    const template =
      document.getElementById(
        "audio-lesson-script"
      );


    if (
      !template ||
      template.tagName !== "TEMPLATE"
    ) {
      return;
    }


    const paragraphs =
      Array.from(
        template.content.querySelectorAll("p")
      );


    const segments =
      paragraphs
        .map(
          paragraph =>
            paragraph.textContent
              .replace(/\s+/g, " ")
              .trim()
        )
        .filter(Boolean);


    if (!segments.length) {
      return;
    }


    /* =====================================================
       TEXT / DURATA
       ===================================================== */

    const entireText =
      segments.join(" ");


    const wordCount =
      entireText
        .split(/\s+/)
        .filter(Boolean)
        .length;


    /* =====================================================
       CONSTRUIESTE PLAYERUL
       ===================================================== */

    const player =
      document.createElement("section");


    player.className =
      "audio-lesson-player";


    player.setAttribute(
      "aria-label",
      "Lecție audio"
    );


    player.innerHTML = `

      <div class="audio-lesson-header">

        <div class="audio-lesson-heading">

          <h2>
            Ascultă lecția
          </h2>

          <p>
            Explicație audio pentru pregătirea
            concursului de ocupare a posturilor didactice.
          </p>

        </div>


        <div class="audio-lesson-badges">

          <span class="audio-lesson-badge">
            AUDIO
          </span>

          <span
            class="audio-lesson-badge duration"
            data-audio-duration
          >
            ≈ 10 min
          </span>

        </div>

      </div>


      <div
        class="audio-lesson-controls"
        aria-label="Comenzi audio"
      >

        <button
          class="audio-lesson-button primary"
          type="button"
          data-audio-play
        >
          <span aria-hidden="true">▶</span>
          <span data-audio-play-label>
            Redă
          </span>
        </button>


        <button
          class="audio-lesson-button"
          type="button"
          data-audio-pause
          disabled
        >
          <span aria-hidden="true">⏸</span>
          Pauză
        </button>


        <button
          class="audio-lesson-button"
          type="button"
          data-audio-stop
          disabled
        >
          <span aria-hidden="true">■</span>
          Oprește
        </button>

      </div>


      <div class="audio-lesson-settings">

        <div class="audio-lesson-field">

          <label>
            Voce

            <select
              class="audio-lesson-select"
              data-audio-voice
            >
              <option value="">
                Vocea românească a sistemului
              </option>
            </select>

          </label>

        </div>


        <div class="audio-lesson-field">

          <label>
            Viteză

            <select
              class="audio-lesson-select"
              data-audio-rate
            >

              <option value="0.85">
                0,85×
              </option>

              <option value="0.9">
                0,90×
              </option>

              <option
                value="0.95"
                selected
              >
                0,95×
              </option>

              <option value="1">
                1,00×
              </option>

              <option value="1.1">
                1,10×
              </option>

              <option value="1.2">
                1,20×
              </option>

            </select>

          </label>

        </div>

      </div>


      <progress
        class="audio-lesson-progress"
        data-audio-progress
        value="0"
        max="100"
        aria-label="Progresul lecției audio"
      >
        0%
      </progress>


      <div class="audio-lesson-status">

        <span
          data-audio-status
          aria-live="polite"
        >
          Pregătit pentru redare.
        </span>

        <span data-audio-part>
          1 / ${segments.length}
        </span>

      </div>


      <p class="audio-lesson-note">

        Vocea este generată de browser.
        Vocile disponibile pot diferi
        între telefon și calculator.

      </p>

    `;


    /* =====================================================
       POZITIONARE AUTOMATA
       DUPA PRIMA SECTIUNE A LECTIEI
       ===================================================== */

    const main =
      document.querySelector("main");


    if (main) {

      const firstCard =
        main.querySelector("section.card");


      if (firstCard) {

        firstCard.insertAdjacentElement(
          "afterend",
          player
        );

      }
      else {

        main.prepend(
          player
        );

      }

    }
    else {

      document.body.prepend(
        player
      );

    }


    /* =====================================================
       ELEMENTE PLAYER
       ===================================================== */

    const playButton =
      player.querySelector(
        "[data-audio-play]"
      );

    const playLabel =
      player.querySelector(
        "[data-audio-play-label]"
      );

    const pauseButton =
      player.querySelector(
        "[data-audio-pause]"
      );

    const stopButton =
      player.querySelector(
        "[data-audio-stop]"
      );

    const voiceSelect =
      player.querySelector(
        "[data-audio-voice]"
      );

    const rateSelect =
      player.querySelector(
        "[data-audio-rate]"
      );

    const status =
      player.querySelector(
        "[data-audio-status]"
      );

    const part =
      player.querySelector(
        "[data-audio-part]"
      );

    const progress =
      player.querySelector(
        "[data-audio-progress]"
      );

    const duration =
      player.querySelector(
        "[data-audio-duration]"
      );


    /* =====================================================
       DURATA APROXIMATIVA
       ===================================================== */

    function updateDuration() {

      const rate =
        Number(
          rateSelect.value
        ) || 0.95;


      const wordsPerMinute =
        150 * rate;


      const minutes =
        Math.max(
          1,
          Math.round(
            wordCount /
            wordsPerMinute
          )
        );


      duration.textContent =
        `≈ ${minutes} min`;

    }


    /* =====================================================
       VERIFICARE WEB SPEECH API
       ===================================================== */

    if (
      !("speechSynthesis" in window) ||
      !("SpeechSynthesisUtterance" in window)
    ) {

      playButton.disabled =
        true;

      pauseButton.disabled =
        true;

      stopButton.disabled =
        true;

      voiceSelect.disabled =
        true;

      rateSelect.disabled =
        true;


      status.textContent =
        "Redarea vocală nu este disponibilă în acest browser.";


      const error =
        document.createElement("div");

      error.className =
        "audio-lesson-error";

      error.textContent =
        "Browserul utilizat nu oferă sinteză vocală. Lecția scrisă rămâne disponibilă integral.";


      player.appendChild(
        error
      );


      updateDuration();

      return;

    }


    const synth =
      window.speechSynthesis;


    /* =====================================================
       STARE
       ===================================================== */

    let currentIndex =
      0;

    let stopped =
      true;

    let finished =
      false;

    let runToken =
      0;

    let romanianVoices =
      [];


    /* =====================================================
       PREFERINTE SALVATE
       ===================================================== */

    const savedRate =
      localStorage.getItem(
        "titularizare-speech-rate"
      );


    if (
      savedRate &&
      Array.from(
        rateSelect.options
      ).some(
        option =>
          option.value === savedRate
      )
    ) {

      rateSelect.value =
        savedRate;

    }


    /* =====================================================
       VOCILE ROMANESTI
       ===================================================== */

    function voiceScore(voice) {

      let score =
        0;


      const lang =
        (voice.lang || "")
          .toLowerCase();


      const name =
        (voice.name || "")
          .toLowerCase();


      if (lang === "ro-ro") {
        score += 100;
      }
      else if (
        lang.startsWith("ro")
      ) {
        score += 80;
      }


      if (
        name.includes("natural") ||
        name.includes("neural")
      ) {
        score += 20;
      }


      return score;

    }


    function loadVoices() {

      romanianVoices =
        synth
          .getVoices()
          .filter(
            voice =>
              (voice.lang || "")
                .toLowerCase()
                .startsWith("ro")
          )
          .sort(
            (a, b) =>
              voiceScore(b) -
              voiceScore(a)
          );


      voiceSelect.innerHTML =
        "";


      if (!romanianVoices.length) {

        const option =
          document.createElement(
            "option"
          );

        option.value =
          "";

        option.textContent =
          "Vocea sistemului — română";

        voiceSelect.appendChild(
          option
        );

        return;

      }


      romanianVoices.forEach(
        (voice, index) => {

          const option =
            document.createElement(
              "option"
            );

          option.value =
            String(index);

          option.textContent =
            `${voice.name} — ${voice.lang}`;

          voiceSelect.appendChild(
            option
          );

        }
      );


      const savedVoice =
        localStorage.getItem(
          "titularizare-speech-voice"
        );


      if (savedVoice) {

        const index =
          romanianVoices.findIndex(
            voice =>
              voice.name === savedVoice
          );


        if (index >= 0) {

          voiceSelect.value =
            String(index);

        }

      }

    }


    function selectedVoice() {

      const index =
        Number(
          voiceSelect.value
        );


      if (
        Number.isInteger(index) &&
        romanianVoices[index]
      ) {

        return romanianVoices[index];

      }


      return null;

    }


    loadVoices();


    if (
      typeof synth.addEventListener ===
      "function"
    ) {

      synth.addEventListener(
        "voiceschanged",
        loadVoices
      );

    }


    /* =====================================================
       INTERFATA
       ===================================================== */

    function updateProgress() {

      const total =
        segments.length;


      const completed =
        Math.min(
          currentIndex,
          total
        );


      const percentage =
        total
          ? Math.round(
              completed /
              total *
              100
            )
          : 0;


      progress.value =
        percentage;


      progress.textContent =
        `${percentage}%`;


      if (
        currentIndex >= total
      ) {

        part.textContent =
          `${total} / ${total}`;

      }
      else {

        part.textContent =
          `${currentIndex + 1} / ${total}`;

      }

    }


    function playingUI() {

      playButton.disabled =
        true;

      pauseButton.disabled =
        false;

      stopButton.disabled =
        false;

      playLabel.textContent =
        "Se redă";

    }


    function pausedUI() {

      playButton.disabled =
        false;

      pauseButton.disabled =
        true;

      stopButton.disabled =
        false;

      playLabel.textContent =
        "Continuă";

    }


    function stoppedUI() {

      playButton.disabled =
        false;

      pauseButton.disabled =
        true;

      stopButton.disabled =
        true;

      playLabel.textContent =
        finished
          ? "Reia"
          : "Redă";

    }


    /* =====================================================
       REDARE
       ===================================================== */

    function speakCurrent(token) {

      if (
        stopped ||
        token !== runToken
      ) {
        return;
      }


      if (
        currentIndex >=
        segments.length
      ) {

        finished =
          true;

        stopped =
          true;

        progress.value =
          100;

        progress.textContent =
          "100%";

        part.textContent =
          `${segments.length} / ${segments.length}`;


        status.textContent =
          "Lecția audio s-a încheiat.";


        stoppedUI();

        return;

      }


      const utterance =
        new SpeechSynthesisUtterance(
          segments[currentIndex]
        );


      utterance.lang =
        "ro-RO";


      const voice =
        selectedVoice();


      if (voice) {
        utterance.voice = voice;
      }


      utterance.rate =
        Number(
          rateSelect.value
        ) || 0.95;


      utterance.pitch =
        1;


      utterance.volume =
        1;


      utterance.onstart =
        () => {

          if (
            token !== runToken
          ) {
            return;
          }


          status.textContent =
            `Se redă partea ${currentIndex + 1}.`;


          updateProgress();

          playingUI();

        };


      utterance.onend =
        () => {

          if (
            stopped ||
            token !== runToken
          ) {
            return;
          }


          currentIndex +=
            1;


          updateProgress();


          window.setTimeout(
            () =>
              speakCurrent(
                token
              ),
            90
          );

        };


      utterance.onerror =
        event => {

          if (
            token !== runToken
          ) {
            return;
          }


          if (
            event.error === "canceled" ||
            event.error === "interrupted"
          ) {
            return;
          }


          stopped =
            true;


          status.textContent =
            "Browserul a întrerupt redarea vocală.";


          stoppedUI();

        };


      synth.speak(
        utterance
      );

    }


    function play() {

      if (synth.paused) {

        synth.resume();

        status.textContent =
          `Redarea continuă de la partea ${currentIndex + 1}.`;

        playingUI();

        return;

      }


      if (synth.speaking) {
        return;
      }


      if (
        finished ||
        currentIndex >=
        segments.length
      ) {

        currentIndex =
          0;

        finished =
          false;

      }


      runToken +=
        1;


      const token =
        runToken;


      synth.cancel();


      stopped =
        false;


      window.setTimeout(
        () =>
          speakCurrent(
            token
          ),
        80
      );

    }


    function pause() {

      if (
        synth.speaking &&
        !synth.paused
      ) {

        synth.pause();


        status.textContent =
          `Pauză la partea ${currentIndex + 1}.`;


        pausedUI();

      }

    }


    function stop() {

      runToken +=
        1;


      stopped =
        true;

      finished =
        false;


      synth.cancel();


      currentIndex =
        0;


      progress.value =
        0;

      progress.textContent =
        "0%";


      part.textContent =
        `1 / ${segments.length}`;


      status.textContent =
        "Redarea a fost oprită.";


      stoppedUI();

    }


    /* =====================================================
       EVENIMENTE
       ===================================================== */

    playButton.addEventListener(
      "click",
      play
    );


    pauseButton.addEventListener(
      "click",
      pause
    );


    stopButton.addEventListener(
      "click",
      stop
    );


    rateSelect.addEventListener(
      "change",
      () => {

        localStorage.setItem(
          "titularizare-speech-rate",
          rateSelect.value
        );


        updateDuration();


        if (
          synth.speaking
        ) {

          status.textContent =
            "Noua viteză se aplică de la următorul paragraf.";

        }

      }
    );


    voiceSelect.addEventListener(
      "change",
      () => {

        const voice =
          selectedVoice();


        if (voice) {

          localStorage.setItem(
            "titularizare-speech-voice",
            voice.name
          );

        }


        if (
          synth.speaking
        ) {

          status.textContent =
            "Noua voce se aplică de la următorul paragraf.";

        }

      }
    );


    window.addEventListener(
      "pagehide",
      () => {

        runToken +=
          1;

        synth.cancel();

      }
    );


    /* =====================================================
       START
       ===================================================== */

    updateDuration();

    updateProgress();

    stoppedUI();

  }


  /* =======================================================
     PORNIRE DUPA INCARCAREA DOM-ULUI
     ======================================================= */

  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initAudioLesson
    );

  }
  else {

    initAudioLesson();

  }

})();
