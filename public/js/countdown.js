/**
 * Countdown Timer Component
 * Creates live countdown timers for concert dates.
 */

function createCountdown(targetDate, element) {
  function update() {
    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();
    const diff = target - now;

    if (diff <= 0) { element.textContent = 'Event Started!'; return; }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) element.textContent = `${days}d ${hours}h ${mins}m ${secs}s`;
    else element.textContent = `${hours}h ${mins}m ${secs}s`;
  }
  update();
  return setInterval(update, 1000);
}

function createCountdownShort(targetDate) {
  const now = new Date().getTime();
  const target = new Date(targetDate).getTime();
  const diff = target - now;
  if (diff <= 0) return 'Live Now!';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 30) return `${Math.floor(days / 30)} months`;
  if (days > 0) return `${days} days left`;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  return `${hours} hours left`;
}
