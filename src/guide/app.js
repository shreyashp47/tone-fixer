document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('closeGuide');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.close();
    });
  }
});
