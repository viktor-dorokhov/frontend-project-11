export default (source) => (
  new Promise((resolve, reject) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(source, 'application/xml');
    const errorNode = doc.querySelector('parsererror');
    if (errorNode) {
      reject(new Error('errors.parser'));
      return;
    }
    const titleNode = doc.querySelector('rss > channel > title');
    const descriptionNode = doc.querySelector('rss > channel > description');
    if (!titleNode) {
      reject(new Error('errors.parser'));
      return;
    }
    const result = {
      title: titleNode.textContent,
      description: descriptionNode?.textContent || '',
    };
    const itemNodes = doc.querySelectorAll('rss > channel > item');
    const items = Array.from(itemNodes).reduce((acc, item) => (
      [...acc, {
        title: item.querySelector('title')?.textContent || '',
        description: item.querySelector('description')?.textContent || '',
        link: item.querySelector('link')?.textContent || '',
        guid: item.querySelector('guid')?.textContent || '',
      }]
    ), []);
    result.items = items;
    resolve(result);
  })
);
