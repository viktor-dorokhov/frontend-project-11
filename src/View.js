export default class View {
  constructor(elements) {
    this.elements = elements;
  }

  renderErrorsHandler(errors) {
    if (!errors.message) {
      this.elements.feedback.textContent = '';
      this.elements.input.classList.remove('is-invalid');
      return;
    }
    this.elements.feedback.textContent = errors.message;
    this.elements.feedback.classList.remove('text-success');
    this.elements.feedback.classList.add('text-danger');
    this.elements.input.classList.add('is-invalid');
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
        this.elements.feedback.textContent = 'RSS успешно загружен';
        this.elements.feedback.classList.remove('text-danger');
        this.elements.feedback.classList.add('text-success');
        this.elements.form.reset();
        this.elements.input.focus();
        break;
      default:
        throw new Error(`Unknown process ${process}`);
    }
  }
}
