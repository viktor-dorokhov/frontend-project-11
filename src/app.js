// import axios from 'axios';
import * as yup from 'yup';
// import _ from 'lodash';
import onChange from 'on-change';
import View from './View.js';

const getSchema = (feeds) => (
  yup.string().url('Ссылка должна быть валидным URL').notOneOf(feeds, 'RSS уже существует')
);

const app = () => {
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

  const view = new View(elements);
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
