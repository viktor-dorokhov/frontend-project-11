// import axios from 'axios';
import * as yup from 'yup';
import i18next from 'i18next';
import onChange from 'on-change';
import View from './View.js';
import resources from './locales/index.js';

yup.setLocale({
  mixed: {
    notOneOf: 'errors.validation.notOneOf',
  },
  string: {
    url: 'errors.validation.url',
  },
});

const getSchema = (feeds) => (
  yup.string().url().notOneOf(feeds)
);

const app = () => {
  const defaultLng = 'ru';
  const i18nInstance = i18next.createInstance();
  i18nInstance.init({
    lng: defaultLng,
    debug: false,
    resources,
  });

  const state = {
    form: {
      field: '',
      processState: '',
      response: {},
      errors: {},
      processError: null,
    },
    feeds: [],
  };

  const elements = {
    form: document.querySelector('form'),
    input: document.getElementById('url-input'),
    submit: document.querySelector('[type="submit"]'),
    feedback: document.querySelector('.feedback'),
  };

  const view = new View(elements, i18nInstance);
  const watchState = onChange(state, view.watcher());

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchState.form.field = elements.input.value.trim();
    getSchema(watchState.feeds).validate(watchState.form.field)
      .then(() => {
        watchState.form.errors = {};
        watchState.form.processState = 'sending';
        setTimeout(() => {
          watchState.feeds.push(watchState.form.field);
          watchState.form.processState = 'success';
        }, 1000);
      })
      .catch((err) => {
        watchState.form.errors = err;
      });
  });
};

export default app;
