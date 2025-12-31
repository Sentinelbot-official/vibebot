// Vibe Bot Website JavaScript
// Built 24/7 live on Twitch with the community

// ============================================
// Smooth Scrolling
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
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
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards
document.querySelectorAll('.story-card, .feature-card, .command-category').forEach(card => {
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
const savedTheme = localStorage.getItem('theme') || (prefersDark ? 'dark' : 'light');
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
document.addEventListener('click', (e) => {
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
    { name: 'ban', category: 'moderation', description: 'Ban a user from the server' },
    { name: 'kick', category: 'moderation', description: 'Kick a user from the server' },
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
    { name: 'serverinfo', category: 'utility', description: 'View server information' },
    { name: 'userinfo', category: 'utility', description: 'View user information' }
];

// Populate commands grid
function populateCommands(filter = 'all', search = '') {
    commandsGrid.innerHTML = '';
    
    const categories = {
        moderation: { icon: '🛡️', title: 'Moderation', commands: [] },
        economy: { icon: '💰', title: 'Economy', commands: [] },
        fun: { icon: '🎮', title: 'Fun', commands: [] },
        utility: { icon: '🔧', title: 'Utility', commands: [] }
    };
    
    // Filter and group commands
    commands.forEach(cmd => {
        if ((filter === 'all' || cmd.category === filter) &&
            (search === '' || cmd.name.toLowerCase().includes(search.toLowerCase()) || 
             cmd.description.toLowerCase().includes(search.toLowerCase()))) {
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
                commandsList = cat.commands.map(cmd => 
                    `<li><strong>//${cmd.name}</strong> - ${cmd.description}</li>`
                ).join('');
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
    commandSearch.addEventListener('input', (e) => {
        const activeFilter = document.querySelector('.filter-btn.active').dataset.category;
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
        const step = (timestamp) => {
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
            
            // Update bot status
            updateBotStatusFromData(data);
        })
        .catch(error => {
            console.warn('⚠️ Could not fetch stats from API:', error.message);
            console.log('💡 Using fallback values. To enable real stats:');
            console.log('   1. Set ENABLE_STATS_API=true in your .env file');
            console.log('   2. Update API_URL in script.js to your production URL');
            
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
                if (serverCount) serverCount.textContent = data.servers.toLocaleString();
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
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
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
        if (currentDomain === 'localhost' || currentDomain === '127.0.0.1' || currentDomain === '') {
            // For local testing, use localhost as parent
            iframe.src = currentSrc.replace('parent=sentinelbot-official.github.io', 'parent=localhost');
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

// Console message for developers
console.log('%c🎵 Vibe Bot', 'font-size: 40px; font-weight: bold; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;');
console.log('%cBuilt 24/7 live on Twitch with the community!', 'font-size: 16px; color: #9b59b6;');
console.log('%cWatch the journey: https://twitch.tv/projectdraguk', 'font-size: 14px; color: #3498db;');
console.log('%cContribute: https://github.com/Sentinelbot-official/vibebot', 'font-size: 14px; color: #2ecc71;');

// ============================================
// Initialize Everything
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    updateStats();
    checkBotStatus();
    console.log('✅ Vibe Bot website loaded successfully!');
    console.log('💜 Theme:', document.documentElement.getAttribute('data-theme'));
});
