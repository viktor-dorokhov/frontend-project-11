import * as yup from 'yup';
import i18next from 'i18next';
import onChange from 'on-change';
import axios, { AxiosError } from 'axios';
import View from './View.js';
import parser from './parser.js';
import resources from './locales/index.js';

const routes = {
  allOrigins: (url) => `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`,
};

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
    data: {
      feeds: [],
      posts: [],
    },
  };

  const elements = {
    form: document.querySelector('form'),
    input: document.getElementById('url-input'),
    submit: document.querySelector('[type="submit"]'),
    feedback: document.querySelector('.feedback'),
    posts: document.querySelector('.posts'),
    feeds: document.querySelector('.feeds'),
  };

  const view = new View(elements, i18nInstance);
  const watchState = onChange(state, view.watcher());

  const addFeedToState = (url, rss) => {
    const newFeedId = watchState.data.feeds.length + 1;
    watchState.data.feeds.unshift({
      url,
      title: rss.title,
      description: rss.description,
      id: newFeedId,
    });
  };

  const addPostsToState = (rss) => {
    const postsLength = watchState.data.posts.length;
    const posts = rss.items.reduce((acc, item) => (
      [...acc, { ...item, id: postsLength + acc.length + 1 }]
    ), []);
    watchState.data.posts = [...posts, ...watchState.data.posts];
  };

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchState.form.field = elements.input.value.trim();
    watchState.form.processError = null;
    getSchema(watchState.data.feeds.map(({ url }) => url))
      .validate(watchState.form.field)
      .then(() => {
        watchState.form.errors = {};
        watchState.form.processState = 'sending';
      })
      .then(() => axios.get(routes.allOrigins(watchState.form.field)))
      .then((response) => parser(response.data.contents))
      .then((rss) => {
        watchState.form.processState = 'success';
        addFeedToState(watchState.form.field, rss);
        addPostsToState(rss);
      })
      .catch((err) => {
        // console.log(err);
        watchState.form.processState = 'error';
        if (err instanceof AxiosError) {
          watchState.form.processError = 'errors.network';
          return;
        }
        if (err instanceof yup.ValidationError) {
          watchState.form.errors = err;
          return;
        }
        if (err instanceof Error) {
          watchState.form.processError = err.message;
        }
      });
  });
};

export default app;
