export default class View {
  constructor(elements, i18n) {
    this.elements = elements;
    this.i18n = i18n;
  }

  validationErrorsHandler(error) {
    if (!error.message) {
      this.elements.feedback.textContent = '';
      this.elements.input.classList.remove('is-invalid');
      return;
    }
    this.elements.feedback.textContent = this.i18n.t(error.message);
    this.elements.feedback.classList.remove('text-success');
    this.elements.feedback.classList.add('text-danger');
    this.elements.input.classList.add('is-invalid');
  }

  processErrorsHandler(error) {
    this.elements.feedback.textContent = this.i18n.t(error);
    this.elements.feedback.classList.remove('text-success');
    this.elements.feedback.classList.add('text-danger');
  }

  handleProcessState(process) {
    switch (process) {
      case 'filling':
        this.elements.input.disabled = false;
        this.elements.submit.disabled = false;
        break;
      case 'sending':
        this.elements.submit.disabled = true;
        this.elements.input.disabled = true;
        break;
      case 'error':
        this.elements.submit.disabled = false;
        this.elements.input.disabled = false;
        break;
      case 'success':
        this.elements.submit.disabled = false;
        this.elements.input.disabled = false;
        this.elements.feedback.textContent = this.i18n.t('loadSuccess');
        this.elements.feedback.classList.remove('text-danger');
        this.elements.feedback.classList.add('text-success');
        this.elements.form.reset();
        this.elements.input.focus();
        break;
      default:
        throw new Error(`Unknown process ${process}`);
    }
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
      <h3 class="h6 m-0">${title}</h3>
      <p class="m-0 small text-black-50">${description}</p></li>`
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
    list.innerHTML = posts.map(({ title, link, id }) => (
      `<li class="list-group-item d-flex justify-content-between align-items-start border-0 border-end-0" data-id="${id}">
        <a href="${link}" class="fw-bold" data-id="${id}" target="_blank" rel="noopener noreferrer">${title}</a>
        <button type="button" class="btn btn-outline-primary btn-sm" data-id="2" data-bs-toggle="modal" data-bs-target="#modal">${this.i18n.t('view')}</button>`
    )).join('');
    this.elements.posts.append(card);
  }

  watcher() {
    return (path, value) => {
      switch (path) {
        case 'form.processState':
          this.handleProcessState(value);
          break;
        case 'form.errors':
          this.validationErrorsHandler(value);
          break;
        case 'form.processError':
          if (!value) {
            break;
          }
          this.processErrorsHandler(value);
          break;
        case 'data.feeds':
          this.renderFeeds(value);
          break;
        case 'data.posts':
          this.renderPosts(value);
          break;
        default:
          break;
      }
    };
  }
}
