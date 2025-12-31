// Vibe Bot Website JavaScript
// Built 24/7 live on Twitch with the community

// ============================================
// Cookie Consent Banner
// ============================================
function initCookieConsent() {
  const cookieConsent = document.getElementById('cookieConsent');
  const acceptBtn = document.getElementById('acceptCookies');
  const declineBtn = document.getElementById('declineCookies');

  if (!cookieConsent) return;

  // Check if user has already made a choice
  const cookieChoice = localStorage.getItem('cookieConsent');

  if (!cookieChoice) {
    // Show banner after 2 seconds
    setTimeout(() => {
      cookieConsent.style.display = 'block';
    }, 2000);
  }

  acceptBtn?.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'accepted');
    cookieConsent.style.animation = 'slideDown 0.5s ease-out';
    setTimeout(() => {
      cookieConsent.style.display = 'none';
    }, 500);

    // Initialize analytics if accepted
    initAnalytics();
  });

  declineBtn?.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'declined');
    cookieConsent.style.animation = 'slideDown 0.5s ease-out';
    setTimeout(() => {
      cookieConsent.style.display = 'none';
    }, 500);
  });
}

// ============================================
// Privacy-Friendly Analytics
// ============================================
function initAnalytics() {
  const consent = localStorage.getItem('cookieConsent');
  if (consent !== 'accepted') return;

  // Simple page view tracking (privacy-friendly)
  const pageViews = parseInt(localStorage.getItem('pageViews') || '0') + 1;
  localStorage.setItem('pageViews', pageViews.toString());

  console.log('📊 Page views:', pageViews);

  // You can add Plausible or Fathom Analytics here
  // Example: plausible('pageview');
}

// ============================================
// Premium Links Function
// ============================================
function openPremiumLinks() {
  // Open Ko-fi in a new tab
  window.open('https://ko-fi.com/airis0', '_blank');
  // Small delay to ensure both tabs open (some browsers block rapid popups)
  setTimeout(function () {
    window.open('activate.html', '_blank');
  }, 100);
}

// ============================================
// Smooth Scrolling
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    // Skip if href is just "#" (used for JavaScript buttons)
    if (href === '#') {
      return;
    }
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      // Close mobile menu if open
      const navLinks = document.querySelector('.nav-links');
      const mobileToggle = document.getElementById('mobileMenuToggle');
      if (navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        mobileToggle.classList.remove('active');
      }
    }
  });
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 50) {
    navbar.style.background = 'rgba(255, 255, 255, 0.98)';
  } else {
    navbar.style.background = 'rgba(255, 255, 255, 0.95)';
  }
});

// Animate elements on scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px',
};

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observe all cards
document
  .querySelectorAll('.story-card, .feature-card, .command-category')
  .forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(card);
  });

// ============================================
// Dark Mode Toggle
// ============================================
const darkModeToggle = document.getElementById('darkModeToggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Load saved theme or use system preference
const savedTheme =
  localStorage.getItem('theme') || (prefersDark ? 'dark' : 'light');
document.documentElement.setAttribute('data-theme', savedTheme);
updateDarkModeButton(savedTheme);

darkModeToggle.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateDarkModeButton(newTheme);
});

function updateDarkModeButton(theme) {
  darkModeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ============================================
// Mobile Menu Toggle
// ============================================
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navLinks = document.querySelector('.nav-links');

mobileMenuToggle.addEventListener('click', () => {
  navLinks.classList.toggle('active');
  mobileMenuToggle.classList.toggle('active');
});

// Close mobile menu when clicking outside
document.addEventListener('click', e => {
  if (!e.target.closest('.navbar')) {
    navLinks.classList.remove('active');
    mobileMenuToggle.classList.remove('active');
  }
});

// ============================================
// FAQ Accordion
// ============================================
document.querySelectorAll('.faq-question').forEach(button => {
  button.addEventListener('click', () => {
    const faqItem = button.parentElement;
    const isActive = faqItem.classList.contains('active');

    // Close all other FAQs
    document.querySelectorAll('.faq-item').forEach(item => {
      item.classList.remove('active');
    });

    // Toggle current FAQ
    if (!isActive) {
      faqItem.classList.add('active');
    }
  });
});

// ============================================
// Command Search and Filter
// ============================================
const commandSearch = document.getElementById('commandSearch');
const filterButtons = document.querySelectorAll('.filter-btn');
const commandsGrid = document.getElementById('commandsGrid');

// Command data
const commands = [
  {
    name: 'ban',
    category: 'moderation',
    description: 'Ban a user from the server',
  },
  {
    name: 'kick',
    category: 'moderation',
    description: 'Kick a user from the server',
  },
  { name: 'warn', category: 'moderation', description: 'Warn a user' },
  { name: 'mute', category: 'moderation', description: 'Mute a user' },
  { name: 'balance', category: 'economy', description: 'Check your balance' },
  { name: 'daily', category: 'economy', description: 'Claim daily rewards' },
  { name: 'work', category: 'economy', description: 'Work to earn money' },
  { name: 'shop', category: 'economy', description: 'Browse the shop' },
  { name: '8ball', category: 'fun', description: 'Ask the magic 8ball' },
  { name: 'meme', category: 'fun', description: 'Generate a random meme' },
  { name: 'pet', category: 'fun', description: 'Manage your virtual pet' },
  { name: 'trivia', category: 'fun', description: 'Play trivia games' },
  { name: 'weather', category: 'utility', description: 'Check the weather' },
  { name: 'translate', category: 'utility', description: 'Translate text' },
  {
    name: 'serverinfo',
    category: 'utility',
    description: 'View server information',
  },
  {
    name: 'userinfo',
    category: 'utility',
    description: 'View user information',
  },
];

// Populate commands grid
function populateCommands(filter = 'all', search = '') {
  commandsGrid.innerHTML = '';

  const categories = {
    moderation: { icon: '🛡️', title: 'Moderation', commands: [] },
    economy: { icon: '💰', title: 'Economy', commands: [] },
    fun: { icon: '🎮', title: 'Fun', commands: [] },
    utility: { icon: '🔧', title: 'Utility', commands: [] },
  };

  // Filter and group commands
  commands.forEach(cmd => {
    if (
      (filter === 'all' || cmd.category === filter) &&
      (search === '' ||
        cmd.name.toLowerCase().includes(search.toLowerCase()) ||
        cmd.description.toLowerCase().includes(search.toLowerCase()))
    ) {
      categories[cmd.category].commands.push(cmd);
    }
  });

  // Create category cards
  Object.entries(categories).forEach(([key, cat]) => {
    if (cat.commands.length > 0 || filter === 'all') {
      const categoryCard = document.createElement('div');
      categoryCard.className = 'command-category';
      categoryCard.setAttribute('data-category', key);

      let commandsList = '';
      if (cat.commands.length > 0) {
        commandsList = cat.commands
          .map(
            cmd =>
              `<li><strong>//${cmd.name}</strong> - ${cmd.description}</li>`
          )
          .join('');
      } else {
        commandsList = '<li>No commands found</li>';
      }

      categoryCard.innerHTML = `
                <h3>${cat.icon} ${cat.title} (${cat.commands.length})</h3>
                <ul>${commandsList}</ul>
            `;

      commandsGrid.appendChild(categoryCard);
    }
  });
}

// Initialize commands
populateCommands();

// Search functionality
if (commandSearch) {
  commandSearch.addEventListener('input', e => {
    const activeFilter =
      document.querySelector('.filter-btn.active').dataset.category;
    populateCommands(activeFilter, e.target.value);
  });
}

// Filter functionality
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const searchValue = commandSearch ? commandSearch.value : '';
    populateCommands(btn.dataset.category, searchValue);
  });
});

// ============================================
// Update Stats Dynamically
// ============================================
function updateStats() {
  // Animate numbers counting up
  const animateValue = (element, start, end, duration) => {
    let startTimestamp = null;
    const step = timestamp => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const value = Math.floor(progress * (end - start) + start);
      element.textContent = value.toLocaleString();
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        // Add "+" for large numbers
        if (end >= 1000) {
          element.textContent = value.toLocaleString() + '+';
        }
      }
    };
    window.requestAnimationFrame(step);
  };

  const serverCount = document.getElementById('serverCount');
  const userCount = document.getElementById('userCount');
  const commandCount = document.getElementById('commandCount');

  // Add loading state
  if (serverCount) serverCount.classList.add('loading');
  if (userCount) userCount.classList.add('loading');
  if (commandCount) commandCount.classList.add('loading');

  // Try to fetch real stats from the API
  // You'll need to update this URL to your actual API endpoint
  const API_URL = 'http://localhost:3001/api/stats'; // Change this to your production URL

  fetch(API_URL)
    .then(response => {
      if (!response.ok) {
        throw new Error('API not available');
      }
      return response.json();
    })
    .then(data => {
      console.log('📊 Stats loaded:', data);

      // Remove loading state
      if (serverCount) serverCount.classList.remove('loading');
      if (userCount) userCount.classList.remove('loading');
      if (commandCount) commandCount.classList.remove('loading');

      // Animate the stats
      if (serverCount) {
        animateValue(serverCount, 0, data.servers || 0, 1500);
      }
      if (userCount) {
        animateValue(userCount, 0, data.users || 0, 1500);
      }
      if (commandCount) {
        animateValue(commandCount, 0, data.commands || 220, 1500);
      }

      // Update social proof stats
      const serversUsing = document.getElementById('serversUsing');
      const usersServed = document.getElementById('usersServed');
      if (serversUsing && data.servers) {
        animateValue(serversUsing, 0, data.servers, 1500);
      }
      if (usersServed && data.users) {
        animateValue(usersServed, 0, data.users, 1500);
      }

      // Update bot status
      updateBotStatusFromData(data);
    })
    .catch(error => {
      console.warn('⚠️ Could not fetch stats from API:', error.message);
      console.log('💡 Using fallback values. To enable real stats:');
      console.log('   1. Set ENABLE_STATS_API=true in your .env file');
      console.log('   2. Update API_URL in script.js to your production URL');

      // Remove loading state
      if (serverCount) serverCount.classList.remove('loading');
      if (userCount) userCount.classList.remove('loading');
      if (commandCount) commandCount.classList.remove('loading');

      // Use fallback values
      if (serverCount) {
        serverCount.textContent = '---';
        serverCount.title = 'Stats API not available';
      }
      if (userCount) {
        userCount.textContent = '---';
        userCount.title = 'Stats API not available';
      }
      if (commandCount) {
        commandCount.textContent = '220+';
      }
    });

  // Refresh stats every 30 seconds
  setInterval(() => {
    fetch(API_URL)
      .then(response => response.json())
      .then(data => {
        if (serverCount)
          serverCount.textContent = data.servers.toLocaleString();
        if (userCount) userCount.textContent = data.users.toLocaleString();
        if (commandCount) commandCount.textContent = data.commands + '+';
        updateBotStatusFromData(data);
      })
      .catch(() => {
        // Silently fail on refresh
      });
  }, 30000);
}

function updateBotStatusFromData(data) {
  const statusElement = document.querySelector('.bot-status');
  if (statusElement && data.online !== undefined) {
    if (data.online) {
      statusElement.classList.add('online');
      statusElement.classList.remove('offline');
      statusElement.textContent = '● Online';
      statusElement.title = `Ping: ${data.ping}ms | Uptime: ${data.uptimeFormatted || 'N/A'}`;
    } else {
      statusElement.classList.add('offline');
      statusElement.classList.remove('online');
      statusElement.textContent = '● Offline';
      statusElement.title = 'Bot is currently offline';
    }
  }
}

// ============================================
// Live Stream Status Check (using DecAPI)
// ============================================
function checkLiveStatus() {
  const liveBadge = document.querySelector('.live-badge');
  const TWITCH_USERNAME = 'projectdraguk';

  if (!liveBadge) return;

  // Show loading state
  liveBadge.textContent = '⏳ Checking...';
  liveBadge.classList.add('checking');

  // Check if stream is live using DecAPI
  fetch(`https://decapi.me/twitch/uptime/${TWITCH_USERNAME}`)
    .then(response => response.text())
    .then(uptime => {
      // Wait 5 seconds before showing result
      setTimeout(() => {
        if (uptime && !uptime.includes('offline') && !uptime.includes('error')) {
          // Stream is live!
          liveBadge.textContent = '🔴 LIVE NOW';
          liveBadge.classList.add('live');
          liveBadge.classList.remove('offline', 'checking');
          liveBadge.title = `Live for ${uptime}`;
        } else {
          // Stream is offline
          liveBadge.textContent = '⚫ Offline';
          liveBadge.classList.add('offline');
          liveBadge.classList.remove('live', 'checking');
          liveBadge.title = 'Stream is currently offline';
        }
      }, 5000);
    })
    .catch(error => {
      // Wait 5 seconds even on error
      setTimeout(() => {
        console.warn('Could not check stream status:', error);
        liveBadge.textContent = '🔴 Watch Stream';
        liveBadge.classList.remove('checking');
      }, 5000);
    });

  // Check every 2 minutes
  setInterval(() => {
    // Show checking state
    liveBadge.textContent = '⏳ Checking...';
    liveBadge.classList.add('checking');
    liveBadge.classList.remove('live', 'offline');

    fetch(`https://decapi.me/twitch/uptime/${TWITCH_USERNAME}`)
      .then(response => response.text())
      .then(uptime => {
        // Wait 5 seconds before showing result
        setTimeout(() => {
          if (
            uptime &&
            !uptime.includes('offline') &&
            !uptime.includes('error')
          ) {
            liveBadge.textContent = '🔴 LIVE NOW';
            liveBadge.classList.add('live');
            liveBadge.classList.remove('offline', 'checking');
            liveBadge.title = `Live for ${uptime}`;
          } else {
            liveBadge.textContent = '⚫ Offline';
            liveBadge.classList.add('offline');
            liveBadge.classList.remove('live', 'checking');
            liveBadge.title = 'Stream is currently offline';
          }
        }, 5000);
      })
      .catch(() => {
        // Silently fail on refresh after 5 seconds
        setTimeout(() => {
          liveBadge.classList.remove('checking');
        }, 5000);
      });
  }, 120000); // 2 minutes
}

// ============================================
// Bot Status Check
// ============================================
function checkBotStatus() {
  const statusElement = document.querySelector('.bot-status');
  const API_URL = 'http://localhost:3001/api/status';

  fetch(API_URL)
    .then(response => response.json())
    .then(data => {
      if (statusElement) {
        if (data.online) {
          statusElement.classList.add('online');
          statusElement.classList.remove('offline');
          statusElement.textContent = '● Online';
        } else {
          statusElement.classList.add('offline');
          statusElement.classList.remove('online');
          statusElement.textContent = '● Offline';
        }
      }
    })
    .catch(() => {
      // Fallback to showing offline if API is not available
      if (statusElement) {
        statusElement.classList.add('offline');
        statusElement.classList.remove('online');
        statusElement.textContent = '● Offline';
        statusElement.title = 'Cannot connect to stats API';
      }
    });

  // Check status every 60 seconds
  setInterval(() => {
    fetch(API_URL)
      .then(response => response.json())
      .then(data => {
        if (statusElement) {
          if (data.online) {
            statusElement.classList.add('online');
            statusElement.classList.remove('offline');
            statusElement.textContent = '● Online';
          } else {
            statusElement.classList.add('offline');
            statusElement.classList.remove('online');
            statusElement.textContent = '● Offline';
          }
        }
      })
      .catch(() => {
        if (statusElement) {
          statusElement.classList.add('offline');
          statusElement.classList.remove('online');
          statusElement.textContent = '● Offline';
        }
      });
  }, 60000);
}

// Mobile menu toggle (if needed in future)
function toggleMobileMenu() {
  const navLinks = document.querySelector('.nav-links');
  navLinks.classList.toggle('active');
}

// Add easter egg for fun
let konamiCode = [];
const konamiSequence = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

document.addEventListener('keydown', e => {
  konamiCode.push(e.key);
  konamiCode = konamiCode.slice(-10);

  if (konamiCode.join('') === konamiSequence.join('')) {
    document.body.style.animation = 'rainbow 2s infinite';
    setTimeout(() => {
      document.body.style.animation = '';
    }, 5000);
  }
});

// Rainbow animation for easter egg
const style = document.createElement('style');
style.textContent = `
    @keyframes rainbow {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Fix Twitch embed parent domain based on current location
(function fixTwitchEmbed() {
  const iframe = document.querySelector('.stream-embed iframe');
  const fallback = document.querySelector('.stream-fallback');

  if (iframe) {
    const currentDomain = window.location.hostname || 'localhost';
    const currentSrc = iframe.src;

    // Update parent parameter to match current domain
    if (
      currentDomain === 'localhost' ||
      currentDomain === '127.0.0.1' ||
      currentDomain === ''
    ) {
      // For local testing, use localhost as parent
      iframe.src = currentSrc.replace(
        'parent=sentinelbot-official.github.io',
        'parent=localhost'
      );
    }
    // For GitHub Pages, it's already correct

    console.log('🎬 Twitch embed configured for:', currentDomain);

    // Hide fallback message after iframe loads
    iframe.addEventListener('load', () => {
      if (fallback) {
        setTimeout(() => {
          fallback.style.opacity = '0';
          setTimeout(() => {
            fallback.style.display = 'none';
          }, 300);
        }, 1000);
      }
    });

    // If iframe fails to load after 10 seconds, show helpful message
    setTimeout(() => {
      if (fallback && fallback.style.display !== 'none') {
        fallback.innerHTML = `
                    <h3>⚠️ Stream Embed Blocked</h3>
                    <p><a href="https://twitch.tv/projectdraguk" target="_blank" style="font-size: 1.2rem;">🔴 Watch Live on Twitch</a></p>
                    <p style="font-size: 0.9rem; opacity: 0.7; margin-top: 1rem;">
                        Your browser's tracking prevention is blocking the embed.<br>
                        Click above to watch on Twitch directly!
                    </p>
                `;
      }
    }, 10000);
  }
})();

// ============================================
// Scroll to Top Button
// ============================================
const scrollToTopBtn = document.getElementById('scrollToTop');

if (scrollToTopBtn) {
  // Show/hide button based on scroll position
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      scrollToTopBtn.classList.add('visible');
    } else {
      scrollToTopBtn.classList.remove('visible');
    }
  });

  // Scroll to top when clicked
  scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  });
}

// ============================================
// Feature Voting System
// ============================================
function initVoting() {
  const voteButtons = document.querySelectorAll('.vote-btn');

  // Load votes from localStorage
  const votes = JSON.parse(localStorage.getItem('vibebot_votes') || '{}');

  voteButtons.forEach(btn => {
    const feature = btn.dataset.feature;
    const countSpan = btn.querySelector('.vote-count');

    // Check if user has voted
    if (votes[feature]) {
      btn.classList.add('voted');
      btn.title = 'You voted for this!';
    }

    btn.addEventListener('click', () => {
      if (votes[feature]) {
        // Remove vote
        delete votes[feature];
        btn.classList.remove('voted');
        btn.title = '';
        const currentCount = parseInt(countSpan.textContent);
        countSpan.textContent = currentCount - 1;
      } else {
        // Add vote
        votes[feature] = true;
        btn.classList.add('voted');
        btn.title = 'You voted for this!';
        const currentCount = parseInt(countSpan.textContent);
        countSpan.textContent = currentCount + 1;

        // Show thank you message
        const voteItem = btn.closest('.vote-item');
        const originalBg = voteItem.style.background;
        voteItem.style.background = 'rgba(46, 204, 113, 0.1)';
        setTimeout(() => {
          voteItem.style.background = originalBg;
        }, 1000);
      }

      // Save to localStorage
      localStorage.setItem('vibebot_votes', JSON.stringify(votes));
    });
  });
}

// Console message for developers
console.log(
  '%c🎵 Vibe Bot',
  'font-size: 40px; font-weight: bold; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;'
);
console.log(
  '%cBuilt 24/7 live on Twitch with the community!',
  'font-size: 16px; color: #9b59b6;'
);
console.log(
  '%cWatch the journey: https://twitch.tv/projectdraguk',
  'font-size: 14px; color: #3498db;'
);
console.log(
  '%cContribute: https://github.com/Sentinelbot-official/vibebot',
  'font-size: 14px; color: #2ecc71;'
);

// ============================================
// Social Proof Stats
// ============================================
function updateSocialProof() {
  const serversUsing = document.getElementById('serversUsing');
  const usersServed = document.getElementById('usersServed');

  if (serversUsing && usersServed) {
    // These will be updated by the stats API
    // For now, show loading state
    serversUsing.textContent = '...';
    usersServed.textContent = '...';
  }
}

// ============================================
// Animated Background Particles
// ============================================
function createParticles() {
  const particlesContainer = document.createElement('div');
  particlesContainer.className = 'particles-container';
  document.body.prepend(particlesContainer);

  const particleCount = 30;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 15 + 's';
    particle.style.animationDuration = 15 + Math.random() * 10 + 's';
    particlesContainer.appendChild(particle);
  }
}

// ============================================
// Social Share Buttons
// ============================================
function addShareButtons() {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(
    'Check out Vibe Bot - 220+ Commands Discord Bot!'
  );

  const shareButtons = document.createElement('div');
  shareButtons.className = 'share-buttons';
  shareButtons.innerHTML = `
    <button class="share-btn" data-tooltip="Share on Twitter" onclick="window.open('https://twitter.com/intent/tweet?url=${url}&text=${title}', '_blank')">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
      </svg>
    </button>
    <button class="share-btn" data-tooltip="Share on Facebook" onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=${url}', '_blank')">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
      </svg>
    </button>
    <button class="share-btn" data-tooltip="Copy Link" onclick="copyToClipboard('${decodeURIComponent(url)}')">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    </button>
  `;

  document.body.appendChild(shareButtons);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('✅ Link copied to clipboard!');
  });
}

// ============================================
// Quick Start Wizard
// ============================================
function initQuickStartWizard() {
  const wizard = document.getElementById('quickStartWizard');
  const closeBtn = document.getElementById('closeWizard');
  const finishBtn = document.getElementById('finishWizard');
  const nextBtns = document.querySelectorAll('.wizard-next');
  const steps = document.querySelectorAll('.wizard-step');
  const progressFill = document.getElementById('wizardProgress');
  const currentStepText = document.getElementById('currentStep');

  if (!wizard) return;

  let currentStep = 1;
  const totalSteps = steps.length;

  // Check if user has seen wizard
  const hasSeenWizard = localStorage.getItem('hasSeenWizard');

  if (!hasSeenWizard) {
    // Show wizard after 3 seconds
    setTimeout(() => {
      wizard.style.display = 'flex';
    }, 3000);
  }

  function updateProgress() {
    const progress = (currentStep / totalSteps) * 100;
    progressFill.style.width = progress + '%';
    currentStepText.textContent = currentStep;
  }

  function showStep(step) {
    steps.forEach((s, index) => {
      s.style.display = index + 1 === step ? 'block' : 'none';
    });
    currentStep = step;
    updateProgress();
  }

  nextBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentStep < totalSteps) {
        showStep(currentStep + 1);
      }
    });
  });

  closeBtn?.addEventListener('click', () => {
    wizard.style.display = 'none';
    localStorage.setItem('hasSeenWizard', 'true');
  });

  finishBtn?.addEventListener('click', () => {
    wizard.style.display = 'none';
    localStorage.setItem('hasSeenWizard', 'true');
  });

  updateProgress();
}

// ============================================
// Tooltips
// ============================================
function initTooltips() {
  const tooltipElements = document.querySelectorAll('[data-tooltip]');

  tooltipElements.forEach(element => {
    element.addEventListener('mouseenter', e => {
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.textContent = element.getAttribute('data-tooltip');
      document.body.appendChild(tooltip);

      const rect = element.getBoundingClientRect();
      tooltip.style.left =
        rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
      tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';

      element._tooltip = tooltip;
    });

    element.addEventListener('mouseleave', e => {
      if (element._tooltip) {
        element._tooltip.remove();
        element._tooltip = null;
      }
    });
  });
}

// ============================================
// Initialize Everything
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  updateStats();
  checkBotStatus();
  checkLiveStatus();
  initVoting();
  updateSocialProof();
  initCookieConsent();
  initTooltips();
  createParticles();
  addShareButtons();
  initQuickStartWizard();

  // Check cookie consent and init analytics
  const consent = localStorage.getItem('cookieConsent');
  if (consent === 'accepted') {
    initAnalytics();
  }

  console.log('✅ Vibe Bot website loaded successfully!');
  console.log('💜 Theme:', document.documentElement.getAttribute('data-theme'));
});
