/* ==========================================================================
   QUIZ.JS
   Titularizare Fizica
   Ion Bunget - Compendiu de Fizica

   Repository:
   /assets/js/quiz.js

   Rol:
   - gestioneaza mini-testele din lectii
   - alegere unica
   - alegere multipla
   - raspuns scurt
   - raspuns numeric
   - punctaj prestabilit
   - punctaj partial optional
   - feedback dupa trimiterea testului
   - salvarea scorului in localStorage
   - compatibilitate cu bunget.js

   Fara dependinte externe.

   Versiune: 1.0.0
   ========================================================================== */

(() => {

  'use strict';


  /* =========================================================================
     1. CONFIGURARE
     ========================================================================= */

  const CONFIG = {

    version: '1.0.0',

    storagePrefix:
      'bunget-quiz',

    selectors: {

      quiz:
        '.quiz, [data-quiz]',

      question:
        '.quiz-question, .question',

      gradeButtons: [
        '[data-action="grade-quiz"]',
        '#grade-quiz'
      ].join(','),

      resetButtons: [
        '[data-action="reset-quiz"]',
        '#reset-quiz'
      ].join(','),

      result: [
        '.quiz-result',
        '.score',
        '.score-box',
        '[data-quiz-result]'
      ].join(','),

      feedback:
        '.quiz-feedback',

      option: [
        '.quiz-option',
        '.option'
      ].join(',')

    },

    classes: {

      correct:
        'quiz-correct',

      incorrect:
        'quiz-incorrect',

      unanswered:
        'quiz-unanswered',

      graded:
        'quiz-graded',

      selectedCorrect:
        'quiz-option-correct',

      selectedIncorrect:
        'quiz-option-incorrect'

    }

  };


  /* =========================================================================
     2. STORAGE
     Folosim Bunget.storage daca este disponibil.
     ========================================================================= */

  const Storage = {

    get(key, fallback = null) {

      if (
        window.Bunget &&
        window.Bunget.storage &&
        typeof window.Bunget.storage.get ===
          'function'
      ) {

        return window.Bunget.storage.get(
          key,
          fallback
        );

      }


      try {

        const value =
          window.localStorage.getItem(
            key
          );


        return value === null
          ? fallback
          : value;

      }

      catch (error) {

        return fallback;

      }

    },


    set(key, value) {

      if (
        window.Bunget &&
        window.Bunget.storage &&
        typeof window.Bunget.storage.set ===
          'function'
      ) {

        return window.Bunget.storage.set(
          key,
          value
        );

      }


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

      if (
        window.Bunget &&
        window.Bunget.storage &&
        typeof window.Bunget.storage.remove ===
          'function'
      ) {

        return window.Bunget.storage.remove(
          key
        );

      }


      try {

        window.localStorage.removeItem(
          key
        );

        return true;

      }

      catch (error) {

        return false;

      }

    }

  };


  /* =========================================================================
     3. UTILITARE
     ========================================================================= */

  function normalizeText(value) {

    return String(
      value ?? ''
    )
      .trim()
      .toLocaleLowerCase('ro-RO')
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .replace(
        /\s+/g,
        ' '
      );

  }


  function normalizeAnswerList(value) {

    if (
      Array.isArray(value)
    ) {

      return value
        .map(normalizeText)
        .filter(Boolean);

    }


    return String(
      value ?? ''
    )
      .split('|')
      .map(normalizeText)
      .filter(Boolean);

  }


  function parseBoolean(
    value,
    defaultValue = false
  ) {

    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {

      return defaultValue;

    }


    return (
      String(value).toLowerCase() ===
      'true'
    );

  }


  function parseNumber(
    value,
    fallback = 0
  ) {

    const number =
      Number(
        String(value ?? '')
          .replace(',', '.')
      );


    return Number.isFinite(number)
      ? number
      : fallback;

  }


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


  function getLessonId() {

    if (
      window.Bunget &&
      typeof window.Bunget.getLessonId ===
        'function'
    ) {

      return (
        window.Bunget.getLessonId() ||
        'unknown-lesson'
      );

    }


    return (
      document.body?.dataset?.lessonId ||
      document.documentElement
        ?.dataset
        ?.lessonId ||
      'unknown-lesson'
    );

  }


  function getQuizId(
    quiz,
    index = 0
  ) {

    return (
      quiz.dataset.quizId ||
      quiz.id ||
      `quiz-${index + 1}`
    );

  }


  function getStorageKey(
    quiz,
    index = 0
  ) {

    return [
      CONFIG.storagePrefix,
      getLessonId(),
      getQuizId(
        quiz,
        index
      )
    ].join(':');

  }


  /* =========================================================================
     4. TIPUL ITEMULUI
     Poate fi declarat explicit:

     data-type="radio"
     data-type="checkbox"
     data-type="text"
     data-type="number"

     Altfel este detectat automat.
     ========================================================================= */

  function detectQuestionType(
    question
  ) {

    const explicitType =
      question.dataset.type;


    if (explicitType) {

      return explicitType
        .toLowerCase()
        .trim();

    }


    if (
      question.querySelector(
        'input[type="radio"]'
      )
    ) {

      return 'radio';

    }


    if (
      question.querySelector(
        'input[type="checkbox"]'
      )
    ) {

      return 'checkbox';

    }


    if (
      question.querySelector(
        'input[type="number"]'
      )
    ) {

      return 'number';

    }


    if (
      question.querySelector(
        'input[type="text"], textarea'
      )
    ) {

      return 'text';

    }


    return 'unknown';

  }


  /* =========================================================================
     5. CITIRE RASPUNS UTILIZATOR
     ========================================================================= */

  function getUserAnswer(
    question,
    type
  ) {

    switch (type) {


      case 'radio': {

        const selected =
          question.querySelector(
            'input[type="radio"]:checked'
          );


        return selected
          ? selected.value
          : null;

      }


      case 'checkbox': {

        return Array.from(
          question.querySelectorAll(
            'input[type="checkbox"]:checked'
          )
        )
        .map(
          input => input.value
        );

      }


      case 'number': {

        const input =
          question.querySelector(
            'input[type="number"], input[type="text"]'
          );


        if (
          !input ||
          input.value.trim() === ''
        ) {

          return null;

        }


        return parseNumber(
          input.value,
          NaN
        );

      }


      case 'text': {

        const input =
          question.querySelector(
            'input[type="text"], textarea'
          );


        if (
          !input ||
          input.value.trim() === ''
        ) {

          return null;

        }


        return input.value;

      }


      default:
        return null;

    }

  }


  /* =========================================================================
     6. RASPUNS CORECT
     Pentru checkbox se pot folosi:

     data-answer="a,b,c"

     Pentru text sunt acceptate mai multe variante:

     data-answer="miscare|miscarea"

     ========================================================================= */

  function getCorrectAnswer(
    question,
    type
  ) {

    const raw =
      question.dataset.answer ?? '';


    switch (type) {


      case 'checkbox':

        return raw
          .split(',')
          .map(normalizeText)
          .filter(Boolean);


      case 'number':

        return parseNumber(
          raw,
          NaN
        );


      case 'text':

        return normalizeAnswerList(
          raw
        );


      case 'radio':

      default:

        return normalizeText(
          raw
        );

    }

  }


  /* =========================================================================
     7. VERIFICARE ITEM
     ========================================================================= */

  function evaluateRadio(
    userAnswer,
    correctAnswer
  ) {

    if (
      userAnswer === null
    ) {

      return {
        answered: false,
        correct: false,
        fraction: 0
      };

    }


    const correct =
      normalizeText(
        userAnswer
      ) ===
      normalizeText(
        correctAnswer
      );


    return {
      answered: true,
      correct,
      fraction:
        correct
          ? 1
          : 0
    };

  }


  function evaluateCheckbox(
    question,
    userAnswer,
    correctAnswer
  ) {

    if (
      !Array.isArray(userAnswer) ||
      userAnswer.length === 0
    ) {

      return {
        answered: false,
        correct: false,
        fraction: 0
      };

    }


    const user =
      userAnswer
        .map(normalizeText)
        .filter(Boolean);


    const correct =
      correctAnswer
        .map(normalizeText)
        .filter(Boolean);


    const userSet =
      new Set(user);


    const correctSet =
      new Set(correct);


    const exact =

      userSet.size ===
        correctSet.size

      &&

      [...correctSet]
        .every(
          answer =>
            userSet.has(answer)
        );


    if (exact) {

      return {
        answered: true,
        correct: true,
        fraction: 1
      };

    }


    /*
      Punctaj partial optional.

      data-partial="true"
    */

    const allowPartial =
      parseBoolean(
        question.dataset.partial,
        false
      );


    if (!allowPartial) {

      return {
        answered: true,
        correct: false,
        fraction: 0
      };

    }


    let correctSelections = 0;

    let incorrectSelections = 0;


    userSet.forEach(
      answer => {

        if (
          correctSet.has(answer)
        ) {

          correctSelections++;

        }

        else {

          incorrectSelections++;

        }

      }
    );


    /*
      Formula:
      corecte selectate - gresite selectate
      impartit la numarul variantelor corecte.

      Nu permitem scor negativ.
    */

    const fraction =

      correctSet.size > 0

      ?

      clamp(
        (
          correctSelections -
          incorrectSelections
        )
        /
        correctSet.size,
        0,
        1
      )

      :

      0;


    return {
      answered: true,
      correct: false,
      fraction
    };

  }


  function evaluateNumber(
    question,
    userAnswer,
    correctAnswer
  ) {

    if (
      userAnswer === null ||
      !Number.isFinite(userAnswer)
    ) {

      return {
        answered: false,
        correct: false,
        fraction: 0
      };

    }


    const tolerance =
      parseNumber(
        question.dataset.tolerance,
        0
      );


    const absoluteDifference =
      Math.abs(
        userAnswer -
        correctAnswer
      );


    const correct =
      absoluteDifference <=
      tolerance;


    return {
      answered: true,
      correct,
      fraction:
        correct
          ? 1
          : 0
    };

  }


  function evaluateText(
    question,
    userAnswer,
    correctAnswers
  ) {

    if (
      userAnswer === null
    ) {

      return {
        answered: false,
        correct: false,
        fraction: 0
      };

    }


    const normalizedUser =
      normalizeText(
        userAnswer
      );


    const exactMatch =
      correctAnswers.includes(
        normalizedUser
      );


    if (exactMatch) {

      return {
        answered: true,
        correct: true,
        fraction: 1
      };

    }


    /*
      data-match="contains"

      Exemplu:
      data-answer="sistem de referinta"
      Accepta un raspuns mai lung care contine
      expresia-cheie.
    */

    const matchType =
      (
        question.dataset.match ||
        'exact'
      )
      .toLowerCase();


    if (
      matchType === 'contains'
    ) {

      const correct =

        correctAnswers.some(
          answer =>
            normalizedUser.includes(
              answer
            )
        );


      return {
        answered: true,
        correct,
        fraction:
          correct
            ? 1
            : 0
      };

    }


    return {
      answered: true,
      correct: false,
      fraction: 0
    };

  }


  function evaluateQuestion(
    question
  ) {

    const type =
      detectQuestionType(
        question
      );


    const userAnswer =
      getUserAnswer(
        question,
        type
      );


    const correctAnswer =
      getCorrectAnswer(
        question,
        type
      );


    let evaluation;


    switch (type) {


      case 'radio':

        evaluation =
          evaluateRadio(
            userAnswer,
            correctAnswer
          );

        break;


      case 'checkbox':

        evaluation =
          evaluateCheckbox(
            question,
            userAnswer,
            correctAnswer
          );

        break;


      case 'number':

        evaluation =
          evaluateNumber(
            question,
            userAnswer,
            correctAnswer
          );

        break;


      case 'text':

        evaluation =
          evaluateText(
            question,
            userAnswer,
            correctAnswer
          );

        break;


      default:

        evaluation = {
          answered: false,
          correct: false,
          fraction: 0
        };

    }


    const points =
      parseNumber(
        question.dataset.points,
        1
      );


    const earnedPoints =

      Math.round(
        points *
        evaluation.fraction *
        100
      )
      /
      100;


    return {

      ...evaluation,

      type,

      userAnswer,

      correctAnswer,

      points,

      earnedPoints

    };

  }


  /* =========================================================================
     8. FEEDBACK VIZUAL
     ========================================================================= */

  function clearQuestionState(
    question
  ) {

    question.classList.remove(

      CONFIG.classes.correct,

      CONFIG.classes.incorrect,

      CONFIG.classes.unanswered

    );


    question
      .querySelectorAll(
        CONFIG.selectors.option
      )
      .forEach(
        option => {

          option.classList.remove(

            CONFIG.classes.selectedCorrect,

            CONFIG.classes.selectedIncorrect

          );

        }
      );


    const feedback =
      question.querySelector(
        CONFIG.selectors.feedback
      );


    if (feedback) {

      feedback.remove();

    }

  }


  function formatCorrectAnswer(
    evaluation
  ) {

    if (
      Array.isArray(
        evaluation.correctAnswer
      )
    ) {

      return evaluation.correctAnswer
        .join(', ');

    }


    if (
      evaluation.correctAnswer ===
      undefined ||
      evaluation.correctAnswer ===
      null
    ) {

      return '';

    }


    return String(
      evaluation.correctAnswer
    );

  }


  function createFeedback(
    question,
    evaluation
  ) {

    const feedback =
      document.createElement(
        'div'
      );


    feedback.className =
      'quiz-feedback';


    /*
      feedback dupa corectare.

      Pentru a NU afisa raspunsul corect:
      data-reveal-answer="false"
    */

    const revealAnswer =
      parseBoolean(
        question.dataset.revealAnswer,
        true
      );


    const customCorrect =
      question.dataset.feedbackCorrect;


    const customIncorrect =
      question.dataset.feedbackIncorrect;


    if (
      !evaluation.answered
    ) {

      feedback.classList.add(
        CONFIG.classes.unanswered
      );


      feedback.textContent =
        'Nu ai raspuns la acest item.';

    }


    else if (
      evaluation.correct
    ) {

      feedback.classList.add(
        CONFIG.classes.correct
      );


      feedback.textContent =
        customCorrect ||
        `Corect. +${evaluation.earnedPoints} p`;

    }


    else if (
      evaluation.fraction > 0
    ) {

      feedback.classList.add(
        CONFIG.classes.incorrect
      );


      feedback.textContent =
        `Partial corect. +${evaluation.earnedPoints} din ${evaluation.points} p.`;


      if (revealAnswer) {

        feedback.textContent +=

          ` Raspuns asteptat: ${formatCorrectAnswer(evaluation)}.`;

      }

    }


    else {

      feedback.classList.add(
        CONFIG.classes.incorrect
      );


      feedback.textContent =
        customIncorrect ||
        'Raspuns incorect.';


      if (revealAnswer) {

        feedback.textContent +=

          ` Raspuns asteptat: ${formatCorrectAnswer(evaluation)}.`;

      }

    }


    const explanation =
      question.dataset.explanation;


    if (explanation) {

      const explanationElement =
        document.createElement(
          'div'
        );


      explanationElement.className =
        'quiz-explanation';


      explanationElement.textContent =
        explanation;


      feedback.appendChild(
        explanationElement
      );

    }


    return feedback;

  }


  function markOptions(
    question,
    evaluation
  ) {

    if (
      evaluation.type !== 'radio' &&
      evaluation.type !== 'checkbox'
    ) {

      return;

    }


    question
      .querySelectorAll(
        `${CONFIG.selectors.option} input`
      )
      .forEach(
        input => {

          if (!input.checked) {
            return;
          }


          const option =
            input.closest(
              CONFIG.selectors.option
            );


          if (!option) {
            return;
          }


          if (
            evaluation.type ===
            'radio'
          ) {

            const isCorrect =
              normalizeText(
                input.value
              ) ===
              normalizeText(
                evaluation.correctAnswer
              );


            option.classList.add(

              isCorrect
                ? CONFIG.classes.selectedCorrect
                : CONFIG.classes.selectedIncorrect

            );

          }


          if (
            evaluation.type ===
            'checkbox'
          ) {

            const correctSet =
              new Set(
                evaluation.correctAnswer
              );


            const isCorrect =
              correctSet.has(
                normalizeText(
                  input.value
                )
              );


            option.classList.add(

              isCorrect
                ? CONFIG.classes.selectedCorrect
                : CONFIG.classes.selectedIncorrect

            );

          }

        }
      );

  }


  function renderQuestionFeedback(
    question,
    evaluation
  ) {

    clearQuestionState(
      question
    );


    if (
      !evaluation.answered
    ) {

      question.classList.add(
        CONFIG.classes.unanswered
      );

    }


    else if (
      evaluation.correct
    ) {

      question.classList.add(
        CONFIG.classes.correct
      );

    }


    else {

      question.classList.add(
        CONFIG.classes.incorrect
      );

    }


    markOptions(
      question,
      evaluation
    );


    question.appendChild(

      createFeedback(
        question,
        evaluation
      )

    );

  }


  /* =========================================================================
     9. REZULTAT GENERAL
     ========================================================================= */

  function findResultBox(
    quiz
  ) {

    /*
      Prioritate:
      rezultat in interiorul quiz-ului.
    */

    const internal =
      quiz.querySelector(
        CONFIG.selectors.result
      );


    if (internal) {
      return internal;
    }


    /*
      Optional:
      data-result-target="#rezultat-test"
    */

    const target =
      quiz.dataset.resultTarget;


    if (target) {

      const targetElement =
        document.querySelector(
          target
        );


      if (targetElement) {
        return targetElement;
      }

    }


    /*
      Cream automat.
    */

    const result =
      document.createElement(
        'div'
      );


    result.className =
      'quiz-result';


    result.dataset.quizResult =
      '';


    quiz.appendChild(
      result
    );


    return result;

  }


  function getGradeMessage(
    percentage
  ) {

    if (
      percentage >= 90
    ) {

      return (
        'Notiunile sunt bine fixate.'
      );

    }


    if (
      percentage >= 75
    ) {

      return (
        'Nivel bun. Reia punctual itemii gresiti.'
      );

    }


    if (
      percentage >= 60
    ) {

      return (
        'Nivel acceptabil, dar este necesara recapitularea conceptelor neclare.'
      );

    }


    return (
      'Reia lectia inainte de a trece mai departe.'
    );

  }


  function renderQuizResult(
    quiz,
    result
  ) {

    const resultBox =
      findResultBox(
        quiz
      );


    resultBox.classList.remove(
      'correct',
      'incorrect',
      CONFIG.classes.correct,
      CONFIG.classes.incorrect
    );


    const percentage =
      result.maxPoints > 0
        ? (
            result.earnedPoints /
            result.maxPoints
          ) *
          100
        : 0;


    const roundedPercentage =
      Math.round(
        percentage
      );


    let text =

      `Punctaj: ${result.earnedPoints}/${result.maxPoints} p ` +

      `(${roundedPercentage}%). ` +

      `Itemi corecti: ${result.correctQuestions}/${result.totalQuestions}.`;


    if (
      result.unansweredQuestions > 0
    ) {

      text +=

        ` Fara raspuns: ${result.unansweredQuestions}.`;

    }


    text +=

      ` ${getGradeMessage(percentage)}`;


    resultBox.textContent =
      text;


    resultBox.classList.add(

      percentage >= 70
        ? CONFIG.classes.correct
        : CONFIG.classes.incorrect

    );


    resultBox.setAttribute(
      'role',
      'status'
    );


    resultBox.setAttribute(
      'aria-live',
      'polite'
    );

  }


  /* =========================================================================
     10. CORECTAREA UNUI QUIZ
     ========================================================================= */

  function gradeQuiz(
    quiz,
    quizIndex = 0
  ) {

    const questions =
      Array.from(
        quiz.querySelectorAll(
          CONFIG.selectors.question
        )
      );


    /*
      Nu permitem quiz fara itemi.
    */

    if (
      questions.length === 0
    ) {

      console.warn(
        '[Bunget Quiz] Quiz fara intrebari:',
        quiz
      );

      return null;

    }


    let maxPoints = 0;

    let earnedPoints = 0;

    let correctQuestions = 0;

    let unansweredQuestions = 0;


    const evaluations =
      [];


    questions.forEach(
      question => {

        const evaluation =
          evaluateQuestion(
            question
          );


        evaluations.push(
          evaluation
        );


        maxPoints +=
          evaluation.points;


        earnedPoints +=
          evaluation.earnedPoints;


        if (
          evaluation.correct
        ) {

          correctQuestions++;

        }


        if (
          !evaluation.answered
        ) {

          unansweredQuestions++;

        }


        renderQuestionFeedback(
          question,
          evaluation
        );

      }
    );


    maxPoints =
      Math.round(
        maxPoints * 100
      ) / 100;


    earnedPoints =
      Math.round(
        earnedPoints * 100
      ) / 100;


    const result = {

      lessonId:
        getLessonId(),

      quizId:
        getQuizId(
          quiz,
          quizIndex
        ),

      totalQuestions:
        questions.length,

      correctQuestions,

      unansweredQuestions,

      maxPoints,

      earnedPoints,

      percentage:

        maxPoints > 0

        ?

        Math.round(
          (
            earnedPoints /
            maxPoints
          ) *
          10000
        )
        /
        100

        :

        0,

      timestamp:
        new Date().toISOString(),

      evaluations

    };


    quiz.classList.add(
      CONFIG.classes.graded
    );


    renderQuizResult(
      quiz,
      result
    );


    saveQuizResult(
      quiz,
      quizIndex,
      result
    );


    document.dispatchEvent(

      new CustomEvent(
        'bunget:quizgraded',
        {
          detail: result
        }
      )

    );


    return result;

  }


  /* =========================================================================
     11. SALVAREA REZULTATULUI
     Nu salvam raspunsurile utilizatorului,
     doar rezultatul general.
     ========================================================================= */

  function saveQuizResult(
    quiz,
    quizIndex,
    result
  ) {

    const payload = {

      lessonId:
        result.lessonId,

      quizId:
        result.quizId,

      earnedPoints:
        result.earnedPoints,

      maxPoints:
        result.maxPoints,

      percentage:
        result.percentage,

      correctQuestions:
        result.correctQuestions,

      totalQuestions:
        result.totalQuestions,

      timestamp:
        result.timestamp

    };


    Storage.set(

      getStorageKey(
        quiz,
        quizIndex
      ),

      JSON.stringify(
        payload
      )

    );

  }


  /* =========================================================================
     12. ULTIMUL REZULTAT SALVAT
     ========================================================================= */

  function loadStoredResult(
    quiz,
    quizIndex
  ) {

    const raw =
      Storage.get(
        getStorageKey(
          quiz,
          quizIndex
        )
      );


    if (!raw) {
      return null;
    }


    try {

      return JSON.parse(
        raw
      );

    }

    catch (error) {

      return null;

    }

  }


  function displayStoredResult(
    quiz,
    quizIndex
  ) {

    const stored =
      loadStoredResult(
        quiz,
        quizIndex
      );


    if (!stored) {
      return;
    }


    /*
      Pentru a NU afisa rezultatul anterior:
      data-show-last-score="false"
    */

    const show =
      parseBoolean(
        quiz.dataset.showLastScore,
        true
      );


    if (!show) {
      return;
    }


    const resultBox =
      findResultBox(
        quiz
      );


    const date =
      new Date(
        stored.timestamp
      );


    const dateText =
      Number.isNaN(
        date.getTime()
      )
      ? ''
      : ` • ultima incercare: ${date.toLocaleDateString('ro-RO')}`;


    resultBox.textContent =

      `Ultimul punctaj salvat: ` +

      `${stored.earnedPoints}/${stored.maxPoints} p ` +

      `(${Math.round(stored.percentage)}%)` +

      dateText;

  }


  /* =========================================================================
     13. RESET QUIZ
     ========================================================================= */

  function resetQuiz(
    quiz,
    quizIndex = 0,
    options = {}
  ) {

    const {
      clearStoredResult = false
    } = options;


    /*
      Daca quiz-ul este un <form>,
      folosim reset().
    */

    if (
      typeof quiz.reset ===
      'function'
    ) {

      quiz.reset();

    }

    else {

      quiz
        .querySelectorAll(
          'input[type="radio"], input[type="checkbox"]'
        )
        .forEach(
          input => {

            input.checked = false;

          }
        );


      quiz
        .querySelectorAll(
          'input[type="text"], input[type="number"], textarea'
        )
        .forEach(
          input => {

            input.value = '';

          }
        );

    }


    quiz.classList.remove(
      CONFIG.classes.graded
    );


    quiz
      .querySelectorAll(
        CONFIG.selectors.question
      )
      .forEach(
        question => {

          clearQuestionState(
            question
          );

        }
      );


    const resultBox =
      quiz.querySelector(
        CONFIG.selectors.result
      );


    if (resultBox) {

      resultBox.className =
        'quiz-result';


      resultBox.textContent =
        'Punctajul va aparea aici.';

    }


    if (
      clearStoredResult
    ) {

      Storage.remove(

        getStorageKey(
          quiz,
          quizIndex
        )

      );

    }


    document.dispatchEvent(

      new CustomEvent(
        'bunget:quizreset',
        {
          detail: {

            lessonId:
              getLessonId(),

            quizId:
              getQuizId(
                quiz,
                quizIndex
              )

          }
        }
      )

    );

  }


  /* =========================================================================
     14. IDENTIFICAREA QUIZ-ULUI UNUI BUTON
     ========================================================================= */

  function findQuizForButton(
    button
  ) {

    /*
      Poate fi specificat explicit:

      data-quiz-target="#test-final"
    */

    const target =
      button.dataset.quizTarget;


    if (target) {

      const quiz =
        document.querySelector(
          target
        );


      if (quiz) {
        return quiz;
      }

    }


    /*
      Cautam cel mai apropiat quiz.
    */

    const closest =
      button.closest(
        CONFIG.selectors.quiz
      );


    if (closest) {
      return closest;
    }


    /*
      Compatibilitate cu pagini mai vechi:
      butonul poate fi in <form id="quiz">.
    */

    const form =
      button.closest(
        'form'
      );


    if (form) {
      return form;
    }


    return null;

  }


  /* =========================================================================
     15. BUTOANE GRADE / RESET
     ========================================================================= */

  function initGradeButtons() {

    document
      .querySelectorAll(
        CONFIG.selectors.gradeButtons
      )
      .forEach(
        button => {

          if (
            button.dataset.quizInitialized ===
            'true'
          ) {

            return;

          }


          button.dataset.quizInitialized =
            'true';


          button.addEventListener(
            'click',
            event => {

              event.preventDefault();


              const quiz =
                findQuizForButton(
                  button
                );


              if (!quiz) {

                console.warn(
                  '[Bunget Quiz] Nu am gasit quiz-ul pentru buton:',
                  button
                );

                return;

              }


              const quizzes =
                Array.from(
                  document.querySelectorAll(
                    CONFIG.selectors.quiz
                  )
                );


              const quizIndex =
                Math.max(
                  0,
                  quizzes.indexOf(
                    quiz
                  )
                );


              gradeQuiz(
                quiz,
                quizIndex
              );

            }
          );

        }
      );

  }


  function initResetButtons() {

    document
      .querySelectorAll(
        CONFIG.selectors.resetButtons
      )
      .forEach(
        button => {

          if (
            button.dataset.quizInitialized ===
            'true'
          ) {

            return;

          }


          button.dataset.quizInitialized =
            'true';


          button.addEventListener(
            'click',
            event => {

              /*
                Daca este input[type=reset],
                browserul face reset oricum,
                dar noi eliminam feedback-ul.
              */

              const quiz =
                findQuizForButton(
                  button
                );


              if (!quiz) {
                return;
              }


              const quizzes =
                Array.from(
                  document.querySelectorAll(
                    CONFIG.selectors.quiz
                  )
                );


              const quizIndex =
                Math.max(
                  0,
                  quizzes.indexOf(
                    quiz
                  )
                );


              /*
                data-clear-score="true"
                sterge inclusiv scorul salvat.
              */

              const clearStored =
                parseBoolean(
                  button.dataset.clearScore,
                  false
                );


              /*
                Daca este type="reset",
                asteptam ca browserul sa faca resetul.
              */

              if (
                button.type ===
                'reset'
              ) {

                window.setTimeout(
                  () => {

                    resetQuiz(
                      quiz,
                      quizIndex,
                      {
                        clearStoredResult:
                          clearStored
                      }
                    );

                  },
                  0
                );

              }

              else {

                event.preventDefault();


                resetQuiz(
                  quiz,
                  quizIndex,
                  {
                    clearStoredResult:
                      clearStored
                  }
                );

              }

            }
          );

        }
      );

  }


  /* =========================================================================
     16. PREVENIRE TRIMITERE FORMULAR
     Enter intr-un input text nu trebuie sa reincarce pagina.
     ========================================================================= */

  function preventQuizSubmit(
    quiz
  ) {

    if (
      quiz.tagName.toLowerCase() !==
      'form'
    ) {

      return;

    }


    if (
      quiz.dataset.quizSubmitInitialized ===
      'true'
    ) {

      return;

    }


    quiz.dataset.quizSubmitInitialized =
      'true';


    quiz.addEventListener(
      'submit',
      event => {

        event.preventDefault();


        const quizzes =
          Array.from(
            document.querySelectorAll(
              CONFIG.selectors.quiz
            )
          );


        gradeQuiz(

          quiz,

          Math.max(
            0,
            quizzes.indexOf(
              quiz
            )
          )

        );

      }
    );

  }


  /* =========================================================================
     17. ACCESIBILITATE
     ========================================================================= */

  function improveAccessibility(
    quiz,
    quizIndex
  ) {

    const quizId =
      getQuizId(
        quiz,
        quizIndex
      );


    if (
      !quiz.hasAttribute(
        'aria-label'
      )
    ) {

      quiz.setAttribute(
        'aria-label',
        `Test ${quizId}`
      );

    }


    quiz
      .querySelectorAll(
        CONFIG.selectors.question
      )
      .forEach(
        (question, questionIndex) => {

          if (
            !question.hasAttribute(
              'role'
            )
          ) {

            question.setAttribute(
              'role',
              'group'
            );

          }


          if (
            !question.hasAttribute(
              'aria-label'
            )
          ) {

            question.setAttribute(
              'aria-label',
              `Item ${questionIndex + 1}`
            );

          }

        }
      );

  }


  /* =========================================================================
     18. INITIALIZARE QUIZ
     ========================================================================= */

  function initQuiz(
    quiz,
    quizIndex
  ) {

    if (
      quiz.dataset.quizCoreInitialized ===
      'true'
    ) {

      return;

    }


    quiz.dataset.quizCoreInitialized =
      'true';


    preventQuizSubmit(
      quiz
    );


    improveAccessibility(
      quiz,
      quizIndex
    );


    /*
      Asteptam putin pentru ca un eventual
      rezultat HTML initial sa fie deja disponibil.
    */

    displayStoredResult(
      quiz,
      quizIndex
    );

  }


  function initQuizzes() {

    const quizzes =
      document.querySelectorAll(
        CONFIG.selectors.quiz
      );


    quizzes.forEach(
      (quiz, index) => {

        initQuiz(
          quiz,
          index
        );

      }
    );


    initGradeButtons();

    initResetButtons();

  }


  /* =========================================================================
     19. MUTATION OBSERVER
     Lectiile sau componentele pot fi generate dinamic.
     ========================================================================= */

  let mutationScheduled =
    false;


  function initMutationObserver() {

    if (
      !window.MutationObserver
    ) {

      return;

    }


    const observer =
      new MutationObserver(
        mutations => {

          const relevant =
            mutations.some(
              mutation =>
                mutation.addedNodes.length > 0
            );


          if (
            !relevant ||
            mutationScheduled
          ) {

            return;

          }


          mutationScheduled =
            true;


          window.requestAnimationFrame(
            () => {

              mutationScheduled =
                false;


              initQuizzes();

            }
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
     20. INITIALIZARE
     ========================================================================= */

  function init() {

    initQuizzes();

    initMutationObserver();


    document.dispatchEvent(

      new CustomEvent(
        'bunget:quizready',
        {
          detail: {

            lessonId:
              getLessonId(),

            quizzes:
              document.querySelectorAll(
                CONFIG.selectors.quiz
              ).length

          }
        }
      )

    );

  }


  if (
    document.readyState ===
    'loading'
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
     21. API PUBLIC
     ========================================================================= */

  window.BungetQuiz = {

    version:
      CONFIG.version,


    grade(
      quiz
    ) {

      if (
        typeof quiz ===
        'string'
      ) {

        quiz =
          document.querySelector(
            quiz
          );

      }


      if (!quiz) {
        return null;
      }


      const quizzes =
        Array.from(
          document.querySelectorAll(
            CONFIG.selectors.quiz
          )
        );


      return gradeQuiz(

        quiz,

        Math.max(
          0,
          quizzes.indexOf(
            quiz
          )
        )

      );

    },


    reset(
      quiz,
      clearStoredResult = false
    ) {

      if (
        typeof quiz ===
        'string'
      ) {

        quiz =
          document.querySelector(
            quiz
          );

      }


      if (!quiz) {
        return;
      }


      const quizzes =
        Array.from(
          document.querySelectorAll(
            CONFIG.selectors.quiz
          )
        );


      resetQuiz(

        quiz,

        Math.max(
          0,
          quizzes.indexOf(
            quiz
          )
        ),

        {
          clearStoredResult
        }

      );

    },


    evaluateQuestion,


    refresh:
      initQuizzes,


    getStoredResult(
      quiz
    ) {

      if (
        typeof quiz ===
        'string'
      ) {

        quiz =
          document.querySelector(
            quiz
          );

      }


      if (!quiz) {
        return null;
      }


      const quizzes =
        Array.from(
          document.querySelectorAll(
            CONFIG.selectors.quiz
          )
        );


      return loadStoredResult(

        quiz,

        Math.max(
          0,
          quizzes.indexOf(
            quiz
          )
        )

      );

    }

  };

})();
