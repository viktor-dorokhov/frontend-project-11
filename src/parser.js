export default (source) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(source, 'application/xml');
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) {
    throw new Error('errors.parser');
  }
  const titleNode = doc.querySelector('rss > channel > title');
  const descriptionNode = doc.querySelector('rss > channel > description');
  if (!titleNode) {
    throw new Error('errors.parser');
  }
  const result = {
    title: titleNode.textContent,
    description: descriptionNode?.textContent || '',
  };
  const itemNodes = doc.querySelectorAll('rss > channel > item');
  const items = Array.from(itemNodes).map((item) => (
    {
      title: item.querySelector('title')?.textContent || '',
      description: item.querySelector('description')?.textContent || '',
      link: item.querySelector('link')?.textContent || '',
    }
  ));
  result.items = items;
  return result;
};
