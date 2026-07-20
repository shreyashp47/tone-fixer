document.addEventListener('DOMContentLoaded', () => {
  const link = document.getElementById('closeGuide');
  if (link) {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      window.close();
    });
  }
});
