import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import 'bootstrap/js/dist/modal.js';
import View from './View.js';
import parser from './parser.js';
import resources from './locales/index.js';

const autoRefreshDelay = 5000;

const routes = {
  allOrigins: (url) => `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`,
};

yup.setLocale({
  mixed: {
    required: 'errors.validation.required',
    notOneOf: 'errors.validation.notOneOf',
  },
  string: {
    url: 'errors.validation.url',
  },
});

const getSchema = (feeds) => (
  yup.string().url().required().notOneOf(feeds)
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
      errors: {},
      processState: '',
      processError: null,
    },
    data: {
      feeds: [],
      posts: [],
    },
    ui: {
      visitedPosts: new Set(),
      activePostId: null,
    },
    autoRefresh: false,
  };

  const elements = {
    form: document.querySelector('form'),
    input: document.getElementById('url-input'),
    submit: document.querySelector('[type="submit"]'),
    feedback: document.querySelector('.feedback'),
    posts: document.querySelector('.posts'),
    feeds: document.querySelector('.feeds'),
    modal: document.getElementById('modal'),
  };
  const handlers = {
    onLinkClick(event) {
      const id = Number(event.target.dataset.id);
      this.watchState.ui.visitedPosts.add(id);
    },
    onButtonClick(event) {
      const id = Number(event.target.dataset.id);
      this.watchState.ui.visitedPosts.add(id);
      this.watchState.ui.activePostId = id;
    },
  };

  const view = new View(elements, handlers, i18nInstance);
  const watchState = view.createWatchState(state);

  const addFeedToState = (url, { title, description }) => {
    const newFeedId = watchState.data.feeds.length + 1;
    watchState.data.feeds.unshift({
      url,
      title,
      description,
      id: newFeedId,
    });
    return newFeedId;
  };

  const addPostsToState = (items, feedId) => {
    if (items.length === 0) {
      return;
    }
    const postsLength = watchState.data.posts.length;
    const posts = items.reduce((acc, item) => (
      [...acc, { ...item, id: postsLength + acc.length + 1, feedId }]
    ), []);
    watchState.data.posts = [...posts, ...watchState.data.posts];
  };

  const autoRefresh = () => {
    const promises = watchState.data.feeds.map((feed) => (
      axios.get(routes.allOrigins(feed.url))
        .then((response) => parser(response.data.contents))
        .then((rss) => {
          const postsOfThisFeed = watchState.data.posts.filter(({ feedId }) => feedId === feed.id);
          const newPosts = rss.items.filter(({ title, guid }) => (
            !postsOfThisFeed.find((post) => title === post.title && guid === post.guid)
          ));
          addPostsToState(newPosts, feed.id);
        })
    ));
    Promise.all(promises)
      .catch(() => {})
      .finally(() => setTimeout(autoRefresh, autoRefreshDelay));
  };

  const startAutoRefresh = () => {
    if (watchState.autoRefresh) {
      return;
    }
    watchState.autoRefresh = true;
    setTimeout(autoRefresh, autoRefreshDelay);
  };

  const processErrors = (err) => {
    const errorType = err.constructor.name;
    const errorMapping = {
      ValidationError: () => { watchState.form.errors = err; },
      AxiosError: () => { watchState.form.processError = 'errors.network'; },
      Default: () => { watchState.form.processError = err.message; },
    };
    (errorMapping[errorType] ?? errorMapping.Default)();
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
        return axios.get(routes.allOrigins(watchState.form.field));
      })
      .then((response) => parser(response.data.contents))
      .then((rss) => {
        watchState.form.processState = 'success';
        const newFeedId = addFeedToState(watchState.form.field, rss);
        addPostsToState(rss.items, newFeedId);
        startAutoRefresh();
      })
      .catch((err) => {
        watchState.form.processState = 'error';
        processErrors(err);
      });
  });
};

export default app;
