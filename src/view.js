import onChange from 'on-change';
import DOMPurify from 'dompurify';

const setFeedBack = (elements, content = '', cls = '') => {
  const feedbackEl = elements.feedback;
  feedbackEl.textContent = content;
  feedbackEl.classList.remove('text-success');
  feedbackEl.classList.remove('text-danger');
  if (cls) {
    feedbackEl.classList.add(cls);
  }
};

const validationErrorHandler = (elements, i18n, error) => {
  const inputEl = elements.input;
  if (!error.message) {
    setFeedBack(elements);
    inputEl.classList.remove('is-invalid');
    return;
  }
  setFeedBack(elements, i18n.t(error.message), 'text-danger');
  inputEl.classList.add('is-invalid');
};

const processErrorHandler = (elements, i18n, error) => {
  setFeedBack(elements, i18n.t(error), 'text-danger');
};

const setFormElementsAvailability = (elements, enable) => {
  const inputEl = elements.input;
  const submitEl = elements.submit;
  inputEl.disabled = !enable;
  submitEl.disabled = !enable;
};

const processStateHandler = (elements, i18n, process) => {
  const processMapping = {
    filling: () => {
      setFormElementsAvailability(elements, true);
    },
    sending: () => {
      setFormElementsAvailability(elements, false);
    },
    error: () => {
      setFormElementsAvailability(elements, true);
    },
    success: () => {
      setFormElementsAvailability(elements, true);
      setFeedBack(elements, i18n.t('loadSuccess'), 'text-success');
      elements.form.reset();
      elements.input.focus();
    },
  };
  if (process in processMapping) {
    processMapping[process]();
  }
};

const renderFeeds = (elements, i18n, feeds) => {
  const feedsBoxEl = elements.feeds;
  feedsBoxEl.innerHTML = '';
  const card = document.createElement('div');
  card.classList.add('card', 'border-0');
  card.innerHTML = `<div class="card-body">
      <h2 class="card-title h4">${i18n.t('feeds')}</h2>
    </div>
    <ul class="list-group border-0 rounded-0"></ul>`;
  const list = card.querySelector('ul');
  list.innerHTML = feeds.map(({ title, description, id }) => (
    `<li class="list-group-item border-0 border-end-0" data-id="${id}">
      <h3 class="h6 m-0">${DOMPurify.sanitize(title)}</h3>
      <p class="m-0 small text-black-50">${DOMPurify.sanitize(description)}</p></li>`
  )).join('');
  feedsBoxEl.append(card);
};

const renderPosts = (state, elements, i18n, posts) => {
  const postsBoxEl = elements.posts;
  postsBoxEl.innerHTML = '';
  const card = document.createElement('div');
  card.classList.add('card', 'border-0');
  card.innerHTML = `<div class="card-body">
      <h2 class="card-title h4">${i18n.t('posts')}</h2>
    </div>
    <ul class="list-group border-0 rounded-0"></ul>`;
  const list = card.querySelector('ul');
  list.innerHTML = posts.map(({ title, link, id }) => {
    const linkClass = state.ui.visitedPosts.has(id) ? 'fw-normal text-secondary' : 'fw-bold';
    return `<li class="list-group-item d-flex justify-content-between align-items-start border-0 border-end-0">
        <a href="${DOMPurify.sanitize(link)}" class="${linkClass}" data-id="${id}" target="_blank" rel="noopener noreferrer">${DOMPurify.sanitize(title)}</a>
        <button type="button" class="btn btn-outline-primary btn-sm" data-id="${id}" data-bs-toggle="modal" data-bs-target="#modal">${i18n.t('view')}</button>`;
  }).join('');
  postsBoxEl.append(card);
};

const renderVisitedPosts = (state, elements) => {
  const links = elements.posts.querySelectorAll('a');
  Array.from(links)
    .filter((link) => state.ui.visitedPosts.has(link.dataset.id))
    .forEach((link) => {
      link.classList.remove('fw-bold');
      link.classList.add('fw-normal', 'text-secondary');
    });
};

const renderModalContent = (state, elements, activePostId) => {
  const modalBoxEl = elements.modal;
  const activePost = state.data.posts.find(({ id }) => id === activePostId);
  modalBoxEl.querySelector('.modal-title').innerHTML = DOMPurify.sanitize(activePost.title);
  modalBoxEl.querySelector('.modal-body').innerHTML = DOMPurify.sanitize(activePost.description);
  modalBoxEl.querySelector('.full-article').setAttribute('href', DOMPurify.sanitize(activePost.link));
};

export default (state, elements, i18n) => {
  const onChangeMapping = {
    'form.error': (value) => {
      validationErrorHandler(elements, i18n, value);
    },
    'process.state': (value) => {
      processStateHandler(elements, i18n, value);
    },
    'process.error': (value) => {
      if (value) {
        processErrorHandler(elements, i18n, value);
      }
    },
    'data.feeds': (value) => {
      renderFeeds(elements, i18n, value);
    },
    'data.posts': (value) => {
      renderPosts(state, elements, i18n, value);
    },
    'ui.visitedPosts': () => {
      renderVisitedPosts(state, elements);
    },
    'ui.activePostId': (value) => {
      renderModalContent(state, elements, value);
    },
  };
  return onChange(state, (path, value) => {
    if (path in onChangeMapping) {
      onChangeMapping[path](value);
    }
  });
};
