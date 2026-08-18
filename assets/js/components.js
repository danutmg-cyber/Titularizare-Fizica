```javascript
/* ==========================================================================
   COMPONENTS.JS
   Titularizare Fizica
   Ion Bunget - Compendiu de Fizica

   Repository:
   /assets/js/components.js

   Rol:
   - genereaza header-ul comun
   - genereaza breadcrumbs
   - genereaza navigarea lectia precedenta / urmatoare
   - genereaza footer-ul
   - citeste structura lectiilor din assets/data/lessons.json
   - determina automat calea repository-ului si a cursului Bunget
   - sincronizeaza componentele cu bunget.js

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

    repoName: 'Titularizare-Fizica',

    courseFolder:
      '7. Bunget-Compendiu-Fizica',

    defaultLessonsFile:
      'assets/data/lessons.json',

    selectors: {

      header:
        '#site-header',

      footer:
        '#site-footer',

      breadcrumbs:
        '#breadcrumbs',

      lessonNavigation:
        '#lesson-navigation',

      hero:
        '.lesson-hero, .hero',

      main:
        'main',

      lessonTitle:
        'h1'

    }

  };


  /* =========================================================================
     2. STARE INTERNA
     ========================================================================= */

  const State = {

    lessons: [],

    lessonMap:
      new Map(),

    currentLesson:
      null,

    paths:
      null,

    dataLoaded:
      false,

    initialized:
      false

  };


  /* =========================================================================
     3. UTILITARE
     ========================================================================= */

  function cleanString(value) {

    if (
      value === undefined ||
      value === null
    ) {

      return '';

    }

    return String(value).trim();

  }


  function normalizeSlash(path) {

    if (!path) {
      return '/';
    }


    let result =
      String(path)
        .replace(/\\/g, '/')
        .replace(/\/+/g, '/');


    if (
      !result.startsWith('/')
    ) {

      result =
        '/' + result;

    }


    if (
      !result.endsWith('/')
    ) {

      result += '/';

    }


    return result;

  }


  function trimSlashes(path) {

    return String(path || '')
      .replace(/^\/+/, '')
      .replace(/\/+$/, '');

  }


  function joinPath(
    base,
    relative
  ) {

    const cleanBase =
      normalizeSlash(base);


    const cleanRelative =
      trimSlashes(relative);


    if (!cleanRelative) {
      return cleanBase;
    }


    return (
      cleanBase +
      cleanRelative
    );

  }


  function createElement(
    tag,
    options = {}
  ) {

    const element =
      document.createElement(tag);


    if (options.className) {

      element.className =
        options.className;

    }


    if (
      options.text !== undefined
    ) {

      element.textContent =
        options.text;

    }


    if (options.id) {

      element.id =
        options.id;

    }


    if (options.href) {

      element.setAttribute(
        'href',
        options.href
      );

    }


    if (options.title) {

      element.setAttribute(
        'title',
        options.title
      );

    }


    if (options.type) {

      element.setAttribute(
        'type',
        options.type
      );

    }


    if (options.attributes) {

      Object.entries(
        options.attributes
      )
      .forEach(
        ([name, value]) => {

          if (
            value !== undefined &&
            value !== null
          ) {

            element.setAttribute(
              name,
              String(value)
            );

          }

        }
      );

    }


    return element;

  }


  function appendChildren(
    parent,
    ...children
  ) {

    children
      .flat()
      .filter(Boolean)
      .forEach(
        child => {

          parent.appendChild(child);

        }
      );


    return parent;

  }


  /* =========================================================================
     4. META CONFIG OPTIONAL
     Poti suprascrie automat caile in HTML:

     <meta
       name="bunget-repo-root"
       content="/Titularizare-Fizica/"
     >

     <meta
       name="bunget-course-root"
       content="/Titularizare-Fizica/1. TEMATICA STIINTIFICA/7. Bunget-Compendiu-Fizica/"
     >

     <meta
       name="bunget-lessons-json"
       content="/Titularizare-Fizica/assets/data/lessons.json"
     >
     ========================================================================= */

  function getMetaContent(name) {

    return (
      document
        .querySelector(
          `meta[name="${name}"]`
        )
        ?.getAttribute('content')
        ?.trim()
      ||
      ''
    );

  }


  /* =========================================================================
     5. DETECTAREA AUTOMATA A CAILOR
     ========================================================================= */

  function detectRepoRoot() {

    const metaRoot =
      getMetaContent(
        'bunget-repo-root'
      );


    if (metaRoot) {

      return normalizeSlash(
        metaRoot
      );

    }


    const path =

      decodeURIComponent(
        window.location.pathname
      );


    const marker =

      `/${CONFIG.repoName}/`;


    const index =
      path.indexOf(marker);


    if (index !== -1) {

      return normalizeSlash(
        path.slice(
          0,
          index + marker.length
        )
      );

    }


    /*
      GitHub Pages pe domeniu custom poate avea
      proiectul direct in root.
    */

    return '/';

  }


  function detectCourseRoot(
    repoRoot
  ) {

    const metaRoot =
      getMetaContent(
        'bunget-course-root'
      );


    if (metaRoot) {

      return normalizeSlash(
        metaRoot
      );

    }


    const decodedPath =

      decodeURIComponent(
        window.location.pathname
      );


    const marker =

      `/${CONFIG.courseFolder}/`;


    const index =
      decodedPath.indexOf(
        marker
      );


    if (index !== -1) {

      return normalizeSlash(
        decodedPath.slice(
          0,
          index + marker.length
        )
      );

    }


    /*
      Fallback pentru structura actuala.
    */

    return normalizeSlash(

      joinPath(
        repoRoot,
        '1. TEMATICA STIINTIFICA/7. Bunget-Compendiu-Fizica/'
      )

    );

  }


  function detectLessonsUrl(
    repoRoot
  ) {

    const metaUrl =
      getMetaContent(
        'bunget-lessons-json'
      );


    if (metaUrl) {
      return metaUrl;
    }


    return joinPath(
      repoRoot,
      CONFIG.defaultLessonsFile
    );

  }


  function detectPaths() {

    const repoRoot =
      detectRepoRoot();


    const courseRoot =
      detectCourseRoot(
        repoRoot
      );


    const lessonsUrl =
      detectLessonsUrl(
        repoRoot
      );


    return {

      repoRoot,

      courseRoot,

      lessonsUrl,

      courseIndex:
        joinPath(
          courseRoot,
          'index.html'
        ),

      repositoryIndex:
        joinPath(
          repoRoot,
          'index.html'
        )

    };

  }


  /* =========================================================================
     6. IDENTIFICAREA LECTIEI CURENTE
     Preferinta:
     <body data-lesson-id="I-1.1">
     ========================================================================= */

  function getCurrentLessonId() {

    if (
      window.Bunget &&
      typeof window.Bunget.getLessonId ===
        'function'
    ) {

      const id =
        window.Bunget.getLessonId();


      if (
        id &&
        id !== 'unknown-lesson'
      ) {

        return id;

      }

    }


    const bodyId =
      document.body
        ?.dataset
        ?.lessonId;


    if (bodyId) {
      return bodyId;
    }


    const htmlId =
      document.documentElement
        ?.dataset
        ?.lessonId;


    if (htmlId) {
      return htmlId;
    }


    /*
      Incercam sa extragem:
      1.1-miscare-si-repaus.html
      ->
      1.1
    */

    const file =

      decodeURIComponent(
        window.location.pathname
      )
      .split('/')
      .pop()
      || '';


    const match =
      file.match(
        /^([0-9]+\.[0-9]+)/
      );


    if (match) {

      return match[1];

    }


    return '';

  }


  /* =========================================================================
     7. NORMALIZAREA lessons.json

     Sunt acceptate mai multe formate.

     VARIANTA A:

     {
       "I-1.1": {
         "title": "Miscare si repaus",
         ...
       }
     }

     VARIANTA B:

     {
       "lessons": [
         {
           "id": "I-1.1",
           ...
         }
       ]
     }

     VARIANTA C:

     [
       {
         "id": "I-1.1",
         ...
       }
     ]
     ========================================================================= */

  function normalizeLessonData(data) {

    let lessons = [];


    if (Array.isArray(data)) {

      lessons =
        data;

    }


    else if (
      data &&
      Array.isArray(
        data.lessons
      )
    ) {

      lessons =
        data.lessons;

    }


    else if (
      data &&
      typeof data.lessons ===
        'object'
    ) {

      lessons =

        Object.entries(
          data.lessons
        )
        .map(
          ([id, lesson]) => ({

            id,

            ...lesson

          })
        );

    }


    else if (
      data &&
      typeof data ===
        'object'
    ) {

      lessons =

        Object.entries(data)
        .map(
          ([id, lesson]) => ({

            id,

            ...lesson

          })
        );

    }


    lessons =

      lessons
        .filter(
          lesson =>
            lesson &&
            typeof lesson ===
              'object'
        )
        .map(
          (lesson, index) => {

            const normalized = {

              ...lesson,

              id:
                cleanString(
                  lesson.id
                ),

              title:
                cleanString(
                  lesson.title
                ),

              part:
                cleanString(
                  lesson.part
                ),

              chapter:
                cleanString(
                  lesson.chapter
                ),

              file:
                cleanString(
                  lesson.file
                ),

              sourcePages:
                cleanString(
                  lesson.sourcePages
                ),

              previous:
                cleanString(
                  lesson.previous
                ),

              next:
                cleanString(
                  lesson.next
                ),

              order:

                Number.isFinite(
                  Number(
                    lesson.order
                  )
                )

                ?

                Number(
                  lesson.order
                )

                :

                index

            };


            return normalized;

          }
        );


    /*
      Daca exista camp order,
      respectam ordinea declarata.
    */

    lessons.sort(
      (a, b) =>
        a.order - b.order
    );


    return lessons;

  }


  /* =========================================================================
     8. INDEXAREA LECTIILOR
     ========================================================================= */

  function indexLessons(
    lessons
  ) {

    State.lessonMap.clear();


    lessons.forEach(
      lesson => {

        if (lesson.id) {

          State.lessonMap.set(
            lesson.id,
            lesson
          );

        }

      }
    );

  }


  /* =========================================================================
     9. INCARCA lessons.json
     ========================================================================= */

  async function loadLessons() {

    try {

      const response =

        await fetch(
          State.paths.lessonsUrl,
          {
            cache: 'no-cache'
          }
        );


      if (!response.ok) {

        throw new Error(
          `HTTP ${response.status}`
        );

      }


      const data =
        await response.json();


      State.lessons =
        normalizeLessonData(data);


      indexLessons(
        State.lessons
      );


      State.dataLoaded =
        true;


      return State.lessons;

    }


    catch (error) {

      console.warn(
        '[Bunget Components] Nu am putut incarca lessons.json:',
        State.paths.lessonsUrl,
        error
      );


      State.lessons = [];

      State.lessonMap.clear();

      State.dataLoaded =
        false;


      return [];

    }

  }


  /* =========================================================================
     10. GASIREA LECTIEI CURENTE
     ========================================================================= */

  function findCurrentLesson() {

    const currentId =
      getCurrentLessonId();


    if (!currentId) {
      return null;
    }


    /*
      Match exact.
    */

    if (
      State.lessonMap.has(
        currentId
      )
    ) {

      return State.lessonMap.get(
        currentId
      );

    }


    /*
      Compatibilitate:
      body data-lesson-id="1.1"
      lessons.json id="I-1.1"
    */

    const suffixMatch =

      State.lessons.find(
        lesson =>
          lesson.id === currentId ||
          lesson.id.endsWith(
            `-${currentId}`
          )
      );


    if (suffixMatch) {
      return suffixMatch;
    }


    /*
      Match dupa filename.
    */

    const currentFile =

      decodeURIComponent(
        window.location.pathname
      )
      .split('/')
      .pop();


    if (currentFile) {

      const fileMatch =

        State.lessons.find(
          lesson => {

            const lessonFile =

              decodeURIComponent(
                lesson.file || ''
              )
              .split('/')
              .pop();


            return (
              lessonFile ===
              currentFile
            );

          }
        );


      if (fileMatch) {
        return fileMatch;
      }

    }


    return null;

  }


  /* =========================================================================
     11. URL CATRE O LECTIE
     ========================================================================= */

  function getLessonUrl(
    lesson
  ) {

    if (
      !lesson ||
      !lesson.file
    ) {

      return '#';

    }


    if (
      /^https?:\/\//i.test(
        lesson.file
      )
    ) {

      return lesson.file;

    }


    return joinPath(
      State.paths.courseRoot,
      lesson.file
    );

  }


  /* =========================================================================
     12. LECTIA PRECEDENTA / URMATOARE
     ========================================================================= */

  function getAdjacentLessons(
    lesson
  ) {

    if (!lesson) {

      return {
        previous: null,
        next: null
      };

    }


    let previous =
      null;


    let next =
      null;


    /*
      Daca sunt declarate explicit
      previous si next.
    */

    if (lesson.previous) {

      previous =
        State.lessonMap.get(
          lesson.previous
        )
        ||
        null;

    }


    if (lesson.next) {

      next =
        State.lessonMap.get(
          lesson.next
        )
        ||
        null;

    }


    /*
      Daca nu sunt declarate,
      deducem din ordinea din JSON.
    */

    const index =
      State.lessons.findIndex(
        item =>
          item.id === lesson.id
      );


    if (index !== -1) {

      if (
        !previous &&
        index > 0
      ) {

        previous =
          State.lessons[
            index - 1
          ];

      }


      if (
        !next &&
        index <
          State.lessons.length - 1
      ) {

        next =
          State.lessons[
            index + 1
          ];

      }

    }


    return {
      previous,
      next
    };

  }


  /* =========================================================================
     13. HEADER
     ========================================================================= */

  function createHeader() {

    const header =

      createElement(
        'header',
        {
          className:
            'site-header'
        }
      );


    const inner =

      createElement(
        'div',
        {
          className:
            'site-header-inner'
        }
      );


    /* ---------- BRAND ---------- */

    const brand =

      createElement(
        'a',
        {
          className:
            'site-brand',

          href:
            State.paths.courseIndex,

          title:
            'Bunget - Compendiu de Fizica'
        }
      );


    const brandMain =

      createElement(
        'span',
        {
          text:
            'Titularizare'
        }
      );


    const brandAccent =

      createElement(
        'span',
        {
          className:
            'site-brand-accent',

          text:
            'Fizica'
        }
      );


    appendChildren(
      brand,
      brandMain,
      brandAccent
    );


    /* ---------- TOOLBAR ---------- */

    const toolbar =

      createElement(
        'div',
        {
          className:
            'header-actions'
        }
      );


    /* A- */

    const fontDown =

      createElement(
        'button',
        {
          className:
            'tool-btn',

          type:
            'button',

          title:
            'Micsoreaza textul',

          attributes: {

            'data-action':
              'font-down',

            'aria-label':
              'Micsoreaza dimensiunea textului'

          }
        }
      );


    fontDown.textContent =
      'A−';


    /* A+ */

    const fontUp =

      createElement(
        'button',
        {
          className:
            'tool-btn',

          type:
            'button',

          title:
            'Mareste textul',

          attributes: {

            'data-action':
              'font-up',

            'aria-label':
              'Mareste dimensiunea textului'

          }
        }
      );


    fontUp.textContent =
      'A+';


    /* THEME */

    const theme =

      createElement(
        'button',
        {
          className:
            'tool-btn',

          type:
            'button',

          title:
            'Tema Zi / Noapte',

          attributes: {

            'data-action':
              'toggle-theme',

            'aria-label':
              'Schimba tema Zi / Noapte'

          }
        }
      );


    const themeIcon =

      createElement(
        'span',
        {
          text: '☾',

          attributes: {
            'data-theme-icon': ''
          }
        }
      );


    const themeLabel =

      createElement(
        'span',
        {
          className:
            'btn-label',

          text:
            'Noapte'
        }
      );


    appendChildren(
      theme,
      themeIcon,
      themeLabel
    );


    /* PDF */

    const pdf =

      createElement(
        'button',
        {
          className:
            'tool-btn pdf-btn',

          type:
            'button',

          title:
            'Salveaza lectia in format PDF',

          attributes: {

            'data-action':
              'save-pdf',

            'aria-label':
              'Salveaza lectia in format PDF'

          }
        }
      );


    const pdfIcon =

      createElement(
        'span',
        {
          text: '↓'
        }
      );


    const pdfLabel =

      createElement(
        'span',
        {
          className:
            'btn-label',

          text:
            'PDF'
        }
      );


    appendChildren(
      pdf,
      pdfIcon,
      pdfLabel
    );


    appendChildren(
      toolbar,
      fontDown,
      fontUp,
      theme,
      pdf
    );


    appendChildren(
      inner,
      brand,
      toolbar
    );


    header.appendChild(
      inner
    );


    return header;

  }


  function renderHeader() {

    const placeholder =

      document.querySelector(
        CONFIG.selectors.header
      );


    /*
      Daca exista deja header-ul generat,
      nu duplicam.
    */

    if (
      document.querySelector(
        'header.site-header[data-bunget-component="true"]'
      )
    ) {

      return;

    }


    const header =
      createHeader();


    header.dataset.bungetComponent =
      'true';


    if (placeholder) {

      placeholder.replaceWith(
        header
      );

    }

    else {

      document.body.prepend(
        header
      );

    }

  }


  /* =========================================================================
     14. BREADCRUMBS
     ========================================================================= */

  function createBreadcrumbSeparator() {

    return createElement(
      'span',
      {
        className:
          'breadcrumb-separator',

        text:
          '›',

        attributes: {
          'aria-hidden':
            'true'
        }
      }
    );

  }


  function createBreadcrumbText(
    text
  ) {

    return createElement(
      'span',
      {
        text
      }
    );

  }


  function createBreadcrumbLink(
    text,
    href
  ) {

    return createElement(
      'a',
      {
        text,
        href
      }
    );

  }


  function createBreadcrumbs(
    lesson
  ) {

    const nav =

      createElement(
        'nav',
        {
          className:
            'breadcrumbs',

          attributes: {

            'aria-label':
              'Navigare ierarhica',

            'data-bunget-component':
              'true'

          }
        }
      );


    appendChildren(

      nav,

      createBreadcrumbLink(
        'Bunget',
        State.paths.courseIndex
      )

    );


    if (
      lesson?.part
    ) {

      appendChildren(
        nav,

        createBreadcrumbSeparator(),

        createBreadcrumbText(
          lesson.part
        )
      );

    }


    if (
      lesson?.chapter
    ) {

      appendChildren(
        nav,

        createBreadcrumbSeparator(),

        createBreadcrumbText(
          lesson.chapter
        )
      );

    }


    const title =

      lesson?.title
      ||
      document.querySelector(
        CONFIG.selectors.lessonTitle
      )
      ?.textContent
      ?.trim();


    if (title) {

      appendChildren(
        nav,

        createBreadcrumbSeparator(),

        createBreadcrumbText(
          title
        )
      );

    }


    return nav;

  }


  function renderBreadcrumbs(
    lesson
  ) {

    if (
      document.querySelector(
        '.breadcrumbs[data-bunget-component="true"]'
      )
    ) {

      return;

    }


    const breadcrumbs =
      createBreadcrumbs(
        lesson
      );


    const placeholder =

      document.querySelector(
        CONFIG.selectors.breadcrumbs
      );


    if (placeholder) {

      placeholder.replaceWith(
        breadcrumbs
      );

      return;

    }


    const main =

      document.querySelector(
        CONFIG.selectors.main
      );


    const hero =

      document.querySelector(
        CONFIG.selectors.hero
      );


    if (
      main &&
      hero
    ) {

      main.insertBefore(
        breadcrumbs,
        hero
      );

    }

    else if (main) {

      main.prepend(
        breadcrumbs
      );

    }

  }


  /* =========================================================================
     15. NAVIGARE PRECEDENTA / URMATOARE
     ========================================================================= */

  function createLessonNavLink(
    lesson,
    direction
  ) {

    const isNext =
      direction === 'next';


    const link =

      createElement(
        'a',
        {
          className:

            'lesson-nav-link ' +

            (
              isNext
                ? 'lesson-nav-next'
                : 'lesson-nav-previous'
            ),

          href:
            getLessonUrl(
              lesson
            )
        }
      );


    const label =

      createElement(
        'span',
        {
          className:
            'lesson-nav-label',

          text:
            isNext
              ? 'Lectia urmatoare'
              : 'Lectia precedenta'
        }
      );


    const title =

      createElement(
        'span',
        {
          className:
            'lesson-nav-title',

          text:

            (
              isNext
                ? ''
                : '← '
            )

            +

            (
              lesson.id
                ? lesson.id + ' '
                : ''
            )

            +

            lesson.title

            +

            (
              isNext
                ? ' →'
                : ''
            )
        }
      );


    appendChildren(
      link,
      label,
      title
    );


    return link;

  }


  function createCourseIndexNavLink() {

    const link =

      createElement(
        'a',
        {
          className:
            'lesson-nav-link',

          href:
            State.paths.courseIndex
        }
      );


    appendChildren(

      link,

      createElement(
        'span',
        {
          className:
            'lesson-nav-label',

          text:
            'Navigare'
        }
      ),

      createElement(
        'span',
        {
          className:
            'lesson-nav-title',

          text:
            '← Cuprinsul Compendiului'
        }
      )

    );


    return link;

  }


  function createLessonNavigation(
    lesson
  ) {

    const nav =

      createElement(
        'nav',
        {
          id:
            'lesson-navigation',

          className:
            'lesson-navigation',

          attributes: {

            'aria-label':
              'Navigare intre lectii',

            'data-bunget-component':
              'true'

          }
        }
      );


    const adjacent =
      getAdjacentLessons(
        lesson
      );


    /*
      Prima lectie:
      stanga = Cuprins.
    */

    if (
      adjacent.previous
    ) {

      nav.appendChild(

        createLessonNavLink(
          adjacent.previous,
          'previous'
        )

      );

    }

    else {

      nav.appendChild(
        createCourseIndexNavLink()
      );

    }


    /*
      Ultima lectie poate sa nu aiba next.
    */

    if (
      adjacent.next
    ) {

      nav.appendChild(

        createLessonNavLink(
          adjacent.next,
          'next'
        )

      );

    }


    return nav;

  }


  function renderLessonNavigation(
    lesson
  ) {

    if (!lesson) {
      return;
    }


    const existing =

      document.querySelector(
        '#lesson-navigation[data-bunget-component="true"]'
      );


    if (existing) {
      return;
    }


    const nav =
      createLessonNavigation(
        lesson
      );


    const placeholder =

      document.querySelector(
        CONFIG.selectors.lessonNavigation
      );


    if (
      placeholder &&
      placeholder !== nav
    ) {

      placeholder.replaceWith(
        nav
      );

      return;

    }


    const main =

      document.querySelector(
        CONFIG.selectors.main
      );


    if (main) {

      main.appendChild(
        nav
      );

    }

  }


  /* =========================================================================
     16. FOOTER
     ========================================================================= */

  function createFooter(
    lesson
  ) {

    const footer =

      createElement(
        'footer',
        {
          className:
            'site-footer',

          attributes: {
            'data-bunget-component':
              'true'
          }
        }
      );


    const container =

      createElement(
        'div',
        {
          className:
            'container'
        }
      );


    const sourceTitle =

      createElement(
        'strong',
        {
          text:
            'Sursa principala'
        }
      );


    const sourceText =

      createElement(
        'p',
        {
          text:

            'Ion Bunget si colaboratorii, ' +

            'Compendiu de fizica pentru admitere ' +

            'in invatamantul superior, ' +

            'Editura Stiintifica, Bucuresti, 1972.'
        }
      );


    appendChildren(
      container,
      sourceTitle,
      sourceText
    );


    /* ---------- TAGS ---------- */

    const tags =

      createElement(
        'div',
        {
          className:
            'footer-tags'
        }
      );


    if (
      lesson?.id
    ) {

      tags.appendChild(

        createElement(
          'span',
          {
            className:
              'source-tag',

            text:
              `Lectia ${lesson.id}`
          }
        )

      );

    }


    if (
      lesson?.sourcePages
    ) {

      tags.appendChild(

        createElement(
          'span',
          {
            className:
              'source-tag',

            text:
              `Compendiu: pp. ${lesson.sourcePages}`
          }
        )

      );

    }


    if (
      lesson?.part
    ) {

      tags.appendChild(

        createElement(
          'span',
          {
            className:
              'source-tag',

            text:
              lesson.part
          }
        )

      );

    }


    container.appendChild(
      tags
    );


    /* ---------- DISCLAIMER ---------- */

    const note =

      createElement(
        'p',
        {
          className:
            'muted',

          text:

            'Schemele, graficele, simularile, exercitiile si testele ' +

            'interactive sunt elemente didactice ale platformei de recapitulare.'
        }
      );


    note.style.marginTop =
      '16px';


    container.appendChild(
      note
    );


    /* ---------- LINK CUPRINS ---------- */

    const indexLink =

      createElement(
        'p'
      );


    const anchor =

      createElement(
        'a',
        {
          href:
            State.paths.courseIndex,

          text:
            '← Inapoi la cuprinsul Compendiului'
        }
      );


    indexLink.appendChild(
      anchor
    );


    container.appendChild(
      indexLink
    );


    footer.appendChild(
      container
    );


    return footer;

  }


  function renderFooter(
    lesson
  ) {

    if (
      document.querySelector(
        'footer.site-footer[data-bunget-component="true"]'
      )
    ) {

      return;

    }


    const footer =
      createFooter(
        lesson
      );


    const placeholder =

      document.querySelector(
        CONFIG.selectors.footer
      );


    if (placeholder) {

      placeholder.replaceWith(
        footer
      );

    }

    else {

      document.body.appendChild(
        footer
      );

    }

  }


  /* =========================================================================
     17. ACTUALIZARE TITLU DOCUMENT
     ========================================================================= */

  function updateDocumentTitle(
    lesson
  ) {

    if (!lesson) {
      return;
    }


    if (
      document.body
        ?.dataset
        ?.autoTitle ===
      'false'
    ) {

      return;
    }


    const lessonNumber =
      lesson.id
        ? `${lesson.id} `
        : '';


    document.title =
      `${lessonNumber}${lesson.title} | Titularizare Fizica`;

  }


  /* =========================================================================
     18. ADAUGA META SOURCE IN HERO
     OPTIONAL:

     <div data-lesson-source></div>
     ========================================================================= */

  function renderLessonSourceMeta(
    lesson
  ) {

    if (!lesson) {
      return;
    }


    document
      .querySelectorAll(
        '[data-lesson-source]'
      )
      .forEach(
        container => {

          container.textContent = '';


          if (
            lesson.sourcePages
          ) {

            container.appendChild(

              createElement(
                'span',
                {
                  className:
                    'chip',

                  text:
                    `Bunget: pp. ${lesson.sourcePages}`
                }
              )

            );

          }


          if (
            lesson.chapter
          ) {

            container.appendChild(

              createElement(
                'span',
                {
                  className:
                    'chip',

                  text:
                    lesson.chapter
                }
              )

            );

          }

        }
      );

  }


  /* =========================================================================
     19. ADAUGA INFO LECTIE IN ELEMENTE DATA
     Exemple:

     <span data-lesson-title></span>
     <span data-lesson-id></span>
     <span data-source-pages></span>
     ========================================================================= */

  function populateLessonBindings(
    lesson
  ) {

    if (!lesson) {
      return;
    }


    const bindings = {

      '[data-lesson-id]':
        lesson.id,

      '[data-lesson-title]':
        lesson.title,

      '[data-lesson-part]':
        lesson.part,

      '[data-lesson-chapter]':
        lesson.chapter,

      '[data-source-pages]':
        lesson.sourcePages

    };


    Object.entries(
      bindings
    )
    .forEach(
      ([selector, value]) => {

        document
          .querySelectorAll(
            selector
          )
          .forEach(
            element => {

              /*
                Nu modificam body[data-lesson-id].
              */

              if (
                element ===
                document.body
              ) {

                return;

              }


              if (
                value
              ) {

                element.textContent =
                  value;

              }

            }
          );

      }
    );

  }


  /* =========================================================================
     20. REFRESH BUNGET.JS
     Dupa ce componentele au fost adaugate dinamic,
     bunget.js trebuie sa ataseze event listeners.
     ========================================================================= */

  function refreshBungetControls() {

    if (
      window.Bunget &&
      typeof window.Bunget.refresh ===
        'function'
    ) {

      window.Bunget.refresh();

    }

  }


  /* =========================================================================
     21. RANDERE COMPLETA
     ========================================================================= */

  function renderComponents() {

    renderHeader();


    State.currentLesson =
      findCurrentLesson();


    renderBreadcrumbs(
      State.currentLesson
    );


    if (
      State.currentLesson
    ) {

      renderLessonNavigation(
        State.currentLesson
      );


      updateDocumentTitle(
        State.currentLesson
      );


      renderLessonSourceMeta(
        State.currentLesson
      );


      populateLessonBindings(
        State.currentLesson
      );

    }


    renderFooter(
      State.currentLesson
    );


    refreshBungetControls();


    document.dispatchEvent(

      new CustomEvent(
        'bunget:componentsready',
        {
          detail: {

            lesson:
              State.currentLesson,

            paths:
              State.paths,

            lessonsLoaded:
              State.dataLoaded

          }
        }
      )

    );

  }


  /* =========================================================================
     22. INITIALIZARE
     ========================================================================= */

  async function init() {

    if (
      State.initialized
    ) {

      return;

    }


    State.initialized =
      true;


    State.paths =
      detectPaths();


    /*
      Header-ul nu depinde de lessons.json,
      deci il afisam imediat.
    */

    renderHeader();


    /*
      Incarcam structura lectiilor.
    */

    await loadLessons();


    /*
      Randam restul componentelor.
    */

    renderComponents();

  }


  /* =========================================================================
     23. PORNIRE
     ========================================================================= */

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
     24. API PUBLIC
     ========================================================================= */

  window.BungetComponents = {

    version:
      CONFIG.version,


    getState() {

      return {
        ...State
      };

    },


    getPaths() {

      return {
        ...State.paths
      };

    },


    getLessons() {

      return [
        ...State.lessons
      ];

    },


    getCurrentLesson() {

      return State.currentLesson;
    },


    getLesson(id) {

      return (
        State.lessonMap.get(id)
        ||
        null
      );

    },


    getLessonUrl,


    getAdjacentLessons,


    async reloadData() {

      await loadLessons();


      State.currentLesson =
        findCurrentLesson();


      return State.lessons;

    },


    render() {

      renderComponents();

    },


    refresh() {

      refreshBungetControls();

    }

  };

})();
```
