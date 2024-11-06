// public/js/scripts.js


document.addEventListener('DOMContentLoaded', () => {
    const deleteForms = document.querySelectorAll('form[action*="?_method=DELETE"]');
    deleteForms.forEach(form => {
      form.addEventListener('submit', (e) => {
        if (!confirm('conform to Delete？')) {
          e.preventDefault();
        }
      });
    });
  });
  