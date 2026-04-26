/**
 * Codex Usage Tracker - Content Script
 * Matches the style of OpenAI's usage analytics page and adds a time progress bar.
 */

function init() {
  const observer = new MutationObserver((mutations) => {
    const usageArticles = document.querySelectorAll('article');
    usageArticles.forEach(article => {
      if (article.textContent.includes('Weekly usage limit') && !article.querySelector('.time-progress-container')) {
        addTimeProgressBar(article);
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function addTimeProgressBar(article) {
  // 1. Find the title and reset text
  const titleElement = article.querySelector('p');
  const resetTextElement = Array.from(article.querySelectorAll('div')).find(el => el.textContent.includes('Resets'));
  
  if (!titleElement || !resetTextElement) return;

  const title = titleElement.textContent;
  const resetStr = resetTextElement.textContent.replace('Resets ', '').trim();
  
  // Try to parse the date. OpenAI usually uses "MMM D, YYYY h:mm A"
  const resetDate = new Date(resetStr);
  if (isNaN(resetDate.getTime())) return;

  // 2. Determine the interval
  let intervalMs = 7 * 24 * 60 * 60 * 1000; // Default: Weekly (7 days)
  
  const hourMatch = title.match(/(\d+)\s*hour/i);
  const dayMatch = title.match(/(\d+)\s*day/i);

  if (hourMatch) {
    intervalMs = parseInt(hourMatch[1]) * 60 * 60 * 1000;
  } else if (dayMatch) {
    intervalMs = parseInt(dayMatch[1]) * 24 * 60 * 60 * 1000;
  } else if (title.toLowerCase().includes('weekly')) {
    intervalMs = 7 * 24 * 60 * 60 * 1000;
  } else if (title.toLowerCase().includes('monthly')) {
    intervalMs = 30 * 24 * 60 * 60 * 1000;
  }

  // 3. Calculate time progress
  const now = new Date();
  const cycleStart = new Date(resetDate.getTime() - intervalMs);
  
  let percentElapsed = ((now - cycleStart) / intervalMs) * 100;
  percentElapsed = Math.max(0, Math.min(100, percentElapsed));
  const percentRemaining = 100 - percentElapsed;

  // 4. Create the new section
  // We want to insert it AFTER the usage progress bar but BEFORE the reset text.
  const container = document.createElement('div');
  container.className = 'time-progress-container mt-4 pt-4 border-t border-token-border-subtle flex flex-col gap-3';

  // Label for the time progress
  const timeLabel = document.createElement('div');
  timeLabel.className = 'flex justify-between items-baseline';
  timeLabel.innerHTML = `
    <span class="text-token-text-tertiary text-xs font-medium uppercase tracking-wider">Time Progress</span>
    <div class="text-token-text-primary flex items-baseline gap-1">
      <span class="text-xl font-bold">${Math.floor(percentRemaining)}%</span>
      <span class="text-xs font-medium text-token-text-tertiary">remaining</span>
    </div>
  `;

  // Progress Bar
  const barContainer = document.createElement('div');
  barContainer.className = 'relative w-full bg-token-main-surface-secondary rounded-full overflow-hidden';
  barContainer.style.height = '8px'; // Slightly thinner than usage bar to distinguish

  const barFill = document.createElement('div');
  // Match the green color if we want identical style, or blue for distinction
  // The user said "completely match the style", but also "compare and see if im on track"
  // If usage is 85% and time is 90%, you're good.
  const isOnTrack = true; // Logic could go here
  barFill.className = `absolute top-0 left-0 h-full rounded-full transition-all duration-700 bg-blue-500`;
  barFill.style.width = `${percentRemaining}%`;
  
  barContainer.appendChild(barFill);
  container.appendChild(timeLabel);
  container.appendChild(barContainer);

  // Insert before the reset text element
  resetTextElement.parentNode.insertBefore(container, resetTextElement);
}

// Start looking for the elements
init();
