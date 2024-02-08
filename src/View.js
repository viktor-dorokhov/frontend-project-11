import onChange from 'on-change';
import DOMPurify from 'dompurify';

const noop = () => {};

export default class View {
  constructor(elements, handlers, i18n) {
    this.elements = elements;
    this.handlers = handlers;
    this.i18n = i18n;
  }

  setFeedBack(content = '', cls = '') {
    this.elements.feedback.textContent = content;
    this.elements.feedback.classList.remove('text-success');
    this.elements.feedback.classList.remove('text-danger');
    if (cls) {
      this.elements.feedback.classList.add(cls);
    }
  }

  validationErrorsHandler(error) {
    if (!error.message) {
      this.setFeedBack();
      this.elements.input.classList.remove('is-invalid');
      return;
    }
    this.setFeedBack(this.i18n.t(error.message), 'text-danger');
    this.elements.input.classList.add('is-invalid');
  }

  processErrorsHandler(error) {
    this.setFeedBack(this.i18n.t(error), 'text-danger');
  }

  setFormElementsAvailability(enable) {
    this.elements.input.disabled = !enable;
    this.elements.submit.disabled = !enable;
  }

  handleProcessState(process) {
    const processMapping = {
      filling: () => {
        this.setFormElementsAvailability(true);
      },
      sending: () => {
        this.setFormElementsAvailability(false);
      },
      error: () => {
        this.setFormElementsAvailability(true);
      },
      success: () => {
        this.setFormElementsAvailability(true);
        this.setFeedBack(this.i18n.t('loadSuccess'), 'text-success');
        this.elements.form.reset();
        this.elements.input.focus();
      },
    };
    (processMapping[process] ?? noop)();
  }

  renderFeeds(feeds) {
    this.elements.feeds.innerHTML = '';
    const card = document.createElement('div');
    card.classList.add('card', 'border-0');
    card.innerHTML = `<div class="card-body">
      <h2 class="card-title h4">${this.i18n.t('feeds')}</h2>
    </div>
    <ul class="list-group border-0 rounded-0"></ul>`;
    const list = card.querySelector('ul');
    list.innerHTML = feeds.map(({ title, description, id }) => (
      `<li class="list-group-item border-0 border-end-0" data-id="${id}">
      <h3 class="h6 m-0">${DOMPurify.sanitize(title)}</h3>
      <p class="m-0 small text-black-50">${DOMPurify.sanitize(description)}</p></li>`
    )).join('');
    this.elements.feeds.append(card);
  }

  renderPosts(posts) {
    this.elements.posts.innerHTML = '';
    const card = document.createElement('div');
    card.classList.add('card', 'border-0');
    card.innerHTML = `<div class="card-body">
      <h2 class="card-title h4">${this.i18n.t('posts')}</h2>
    </div>
    <ul class="list-group border-0 rounded-0"></ul>`;
    const list = card.querySelector('ul');
    list.innerHTML = posts.map(({ title, link, id }) => {
      const linkClass = this.watchState.ui.visitedPosts.has(id) ? 'fw-normal link-secondary' : 'fw-bold';
      return `<li class="list-group-item d-flex justify-content-between align-items-start border-0 border-end-0" data-id="${id}">
        <a href="${DOMPurify.sanitize(link)}" class="${linkClass}" data-id="${id}" target="_blank" rel="noopener noreferrer">${DOMPurify.sanitize(title)}</a>
        <button type="button" class="btn btn-outline-primary btn-sm" data-id="${id}" data-bs-toggle="modal" data-bs-target="#modal">${this.i18n.t('view')}</button>`;
    }).join('');
    const links = list.querySelectorAll('a');
    links.forEach((item) => {
      item.addEventListener('click', this.handlers.onLinkClick.bind(this));
    });
    const buttons = list.querySelectorAll('button');
    buttons.forEach((item) => {
      item.addEventListener('click', this.handlers.onButtonClick.bind(this));
    });
    this.elements.posts.append(card);
  }

  renderVisitedPosts() {
    const links = this.elements.posts.querySelectorAll('a');
    Array.from(links)
      .filter((link) => this.watchState.ui.visitedPosts.has(Number(link.dataset.id)))
      .forEach((link) => {
        link.classList.remove('fw-bold');
        link.classList.add('fw-normal', 'link-secondary');
      });
  }

  renderModalContent(activePostId) {
    const activePost = this.watchState.data.posts.find(({ id }) => id === activePostId);
    this.elements.modal.querySelector('.modal-title').innerHTML = DOMPurify.sanitize(activePost.title);
    this.elements.modal.querySelector('.modal-body').innerHTML = DOMPurify.sanitize(activePost.description);
    this.elements.modal.querySelector('.full-article').setAttribute('href', DOMPurify.sanitize(activePost.link));
  }

  createWatchState(state) {
    const onChangeMapping = {
      'form.processState': (value) => {
        this.handleProcessState(value);
      },
      'form.errors': (value) => {
        this.validationErrorsHandler(value);
      },
      'form.processError': (value) => {
        if (value) {
          this.processErrorsHandler(value);
        }
      },
      'data.feeds': (value) => {
        this.renderFeeds(value);
      },
      'data.posts': (value) => {
        this.renderPosts(value);
      },
      'ui.visitedPosts': () => {
        this.renderVisitedPosts();
      },
      'ui.activePostId': (value) => {
        this.renderModalContent(value);
      },
    };
    this.watchState = onChange(state, (path, value) => {
      (onChangeMapping[path] ?? noop)(value);
    });
    return this.watchState;
  }
}
