import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import { uniqueId } from 'lodash';
import 'bootstrap/js/dist/modal.js';
import createWatchState from './view.js';
import parseRss from './parser.js';
import resources from './locales/index.js';

const autoRefreshDelay = 5000;

const getProxyUrl = (url) => {
  const proxyUrl = new URL('get', 'https://allorigins.hexlet.app');
  proxyUrl.searchParams.set('disableCache', true);
  proxyUrl.searchParams.set('url', url);
  return proxyUrl;
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

const runApp = (state, elements, i18nInstance) => {
  const watchState = createWatchState(state, elements, i18nInstance);

  const addFeed = (url, { title, description }) => {
    const newFeedId = uniqueId('feed_');
    watchState.data.feeds.unshift({
      url,
      title,
      description,
      id: newFeedId,
    });
    return newFeedId;
  };

  const addPosts = (items, feedId) => {
    if (items.length === 0) {
      return;
    }
    const posts = items.map((item) => (
      { ...item, id: uniqueId('post_'), feedId }
    ));
    watchState.data.posts.unshift(...posts);
  };

  const autoRefresh = () => {
    const promises = watchState.data.feeds.map((feed) => (
      axios.get(getProxyUrl(feed.url))
        .then((response) => parseRss(response.data.contents))
        .then((rss) => {
          const postsOfThisFeed = watchState.data.posts.filter(({ feedId }) => feedId === feed.id);
          const newPosts = rss.items.filter(({ title }) => (
            !postsOfThisFeed.find((post) => title === post.title)
          ));
          addPosts(newPosts, feed.id);
        })
    ));
    Promise.all(promises)
      .catch(() => {})
      .finally(() => setTimeout(autoRefresh, autoRefreshDelay));
  };
  setTimeout(autoRefresh, autoRefreshDelay);

  const processErrors = (err) => {
    const errorType = err.constructor.name;
    const errorMapping = {
      ValidationError: () => {
        watchState.form.state = 'invalid';
        watchState.form.error = err;
      },
      AxiosError: () => {
        watchState.process.state = 'error';
        watchState.process.error = 'errors.network';
      },
      Default: () => {
        watchState.process.state = 'error';
        watchState.process.error = err.message;
      },
    };
    (errorMapping[errorType] ?? errorMapping.Default)();
  };

  const loadRss = () => {
    watchState.process.state = 'sending';
    watchState.process.error = null;
    axios.get(getProxyUrl(watchState.form.field))
      .then((response) => parseRss(response.data.contents))
      .then((rss) => {
        watchState.process.state = 'success';
        const feedId = addFeed(watchState.form.field, rss);
        addPosts(rss.items, feedId);
      })
      .catch((err) => {
        processErrors(err);
      });
  };

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    watchState.form.field = data.get('url').trim();
    watchState.form.processError = null;
    getSchema(watchState.data.feeds.map(({ url }) => url))
      .validate(watchState.form.field)
      .then(() => {
        watchState.form.state = 'valid';
        watchState.form.error = {};
        loadRss();
      })
      .catch((err) => {
        processErrors(err);
      });
  });

  elements.posts.addEventListener('click', (e) => {
    if (!e.target.dataset.id) {
      return;
    }
    const { id } = e.target.dataset;
    watchState.ui.visitedPosts.add(id);
    watchState.ui.activePostId = id;
  });
};

const initApp = () => {
  const state = {
    form: {
      state: 'filling',
      error: {},
      field: '',
    },
    process: {
      state: 'idle',
      error: null,
    },
    data: {
      feeds: [],
      posts: [],
    },
    ui: {
      visitedPosts: new Set(),
      activePostId: null,
    },
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

  const defaultLng = 'ru';
  const i18nInstance = i18next.createInstance();
  i18nInstance.init({
    lng: defaultLng,
    debug: false,
    resources,
  }).then(() => runApp(state, elements, i18nInstance));
};

export default initApp;
