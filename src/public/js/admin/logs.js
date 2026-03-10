/**
 * Admin Logs Panel - Client-side JavaScript
 */

(function() {
    'use strict';

    // DOM Elements
    const adminBadge = document.getElementById('adminBadge');
    const usersList = document.getElementById('usersList');
    const content = document.getElementById('content');

    // Templates
    const templates = {
        userItem: document.getElementById('template-user-item'),
        datePill: document.getElementById('template-date-pill'),
        logLine: document.getElementById('template-log-line'),
        statCard: document.getElementById('template-stat-card'),
        emptyState: document.getElementById('template-empty-state')
    };

    // State
    let currentUserId = null;
    let currentDate = null;

    // ============================================
    // Helper Functions
    // ============================================

    /**
     * Escape HTML to prevent XSS attacks
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    function escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }

    /**
     * Format a log line with CSS classes for styling
     * @param {object|string} line - Log line data
     * @returns {object} Formatted log data with classes
     */
    function formatLogLine(line) {
        if (typeof line === 'string') {
            // Parse string log format: [timestamp] [level] message {metadata}
            const timestampMatch = line.match(/^\[([^\]]+)\]/);
            const levelMatch = line.match(/\[(INFO|WARN|ERROR|DEBUG)\]/i);
            const metadataMatch = line.match(/\{[^}]+\}$/);

            return {
                timestamp: timestampMatch ? timestampMatch[1] : '',
                level: levelMatch ? levelMatch[1].toUpperCase() : 'INFO',
                message: line
                    .replace(/^\[[^\]]+\]\s*/, '')
                    .replace(/\[(INFO|WARN|ERROR|DEBUG)\]\s*/i, '')
                    .replace(/\{[^}]+\}$/, '')
                    .trim(),
                metadata: metadataMatch ? metadataMatch[0] : '',
                levelClass: getLevelClass(levelMatch ? levelMatch[1] : 'info')
            };
        }

        // Object format
        return {
            timestamp: line.timestamp || '',
            level: (line.level || 'INFO').toUpperCase(),
            message: line.message || line.msg || '',
            metadata: line.metadata ? JSON.stringify(line.metadata) : '',
            levelClass: getLevelClass(line.level || 'info')
        };
    }

    /**
     * Get CSS class for log level
     * @param {string} level - Log level
     * @returns {string} CSS class name
     */
    function getLevelClass(level) {
        const levelLower = (level || 'info').toLowerCase();
        switch (levelLower) {
            case 'error':
            case 'err':
                return 'level-error';
            case 'warn':
            case 'warning':
                return 'level-warn';
            case 'debug':
                return 'level-debug';
            case 'info':
            default:
                return 'level-info';
        }
    }

    /**
     * Update URL with query parameters without page reload
     * @param {object} params - Parameters to set
     */
    function updateUrl(params) {
        const url = new URL(window.location);

        Object.entries(params).forEach(([key, value]) => {
            if (value === null || value === undefined) {
                url.searchParams.delete(key);
            } else {
                url.searchParams.set(key, value);
            }
        });

        history.pushState({}, '', url);
    }

    /**
     * Get URL parameters
     * @returns {object} URL parameters
     */
    function getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            user: params.get('user'),
            date: params.get('date')
        };
    }

    /**
     * Show error message to user
     * @param {string} message - Error message
     */
    function showError(message) {
        renderEmptyState('error', 'Error', message);
    }

    // ============================================
    // Render Functions
    // ============================================

    /**
     * Render users list in sidebar
     * @param {Array} users - List of users
     * @param {string} selectedUserId - Currently selected user ID
     */
    function renderUsers(users, selectedUserId) {
        usersList.innerHTML = '';

        // Update user count badge
        const userCountEl = document.getElementById('userCount');
        if (userCountEl) {
            userCountEl.textContent = users ? users.length : 0;
        }

        if (!users || users.length === 0) {
            usersList.innerHTML = '<p class="no-users">No users with logs</p>';
            return;
        }

        users.forEach(user => {
            const template = templates.userItem.content.cloneNode(true);
            const item = template.querySelector('.user-item');

            item.dataset.userId = user.id || user._id;
            item.querySelector('.user-name').textContent = escapeHtml(user.username || user.email || user.name || 'Unknown');
            item.querySelector('.user-log-count').textContent = user.logCount ? `${user.logCount} logs` : '';

            if (String(user.id || user._id) === String(selectedUserId)) {
                item.classList.add('selected');
            }

            item.addEventListener('click', () => handleUserClick(user.id || user._id));

            usersList.appendChild(template);
        });
    }

    /**
     * Render date pills for log selection
     * @param {Array} dates - Available log dates
     * @param {string} selectedDate - Currently selected date
     * @param {string} userId - Current user ID
     */
    function renderDatePills(dates, selectedDate, userId) {
        const container = document.createElement('div');
        container.className = 'date-pills-container';

        const header = document.createElement('h3');
        header.className = 'dates-header';
        header.textContent = 'Available Logs';
        container.appendChild(header);

        const pillsWrapper = document.createElement('div');
        pillsWrapper.className = 'date-pills';

        if (!dates || dates.length === 0) {
            const noLogs = document.createElement('p');
            noLogs.className = 'no-logs';
            noLogs.textContent = 'No logs available for this user';
            pillsWrapper.appendChild(noLogs);
        } else {
            dates.forEach(date => {
                const template = templates.datePill.content.cloneNode(true);
                const pill = template.querySelector('.date-pill');

                pill.dataset.date = date;
                pill.querySelector('.date-text').textContent = formatDate(date);

                if (date === selectedDate) {
                    pill.classList.add('selected');
                }

                pill.addEventListener('click', () => handleDateClick(userId, date));

                pillsWrapper.appendChild(template);
            });
        }

        container.appendChild(pillsWrapper);

        // Clear content and add dates
        content.innerHTML = '';
        content.appendChild(container);

        // Add placeholder for log content
        const logContainer = document.createElement('div');
        logContainer.id = 'logContainer';
        logContainer.className = 'log-container';
        content.appendChild(logContainer);

        if (!selectedDate) {
            const logContainerEl = document.getElementById('logContainer');
            logContainerEl.innerHTML = '';
            const emptyTemplate = templates.emptyState.content.cloneNode(true);
            const emptyState = emptyTemplate.querySelector('.empty-state');
            emptyState.querySelector('.empty-icon').textContent = '📅';
            emptyState.querySelector('.empty-title').textContent = 'Select a Date';
            emptyState.querySelector('.empty-message').textContent = 'Choose a date from above to view logs';
            logContainerEl.appendChild(emptyTemplate);
        }
    }

    /**
     * Format date for display
     * @param {string} dateStr - Date string
     * @returns {string} Formatted date
     */
    function formatDate(dateStr) {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    }

    /**
     * Render log content with stats and lines
     * @param {object} logData - Log data from API
     */
    function renderLogContent(logData) {
        const logContainer = document.getElementById('logContainer');
        if (!logContainer) return;

        logContainer.innerHTML = '';

        const lines = logData.lines || logData.logs || logData.content || [];

        if (lines.length === 0) {
            const emptyTemplate = templates.emptyState.content.cloneNode(true);
            const emptyState = emptyTemplate.querySelector('.empty-state');
            emptyState.querySelector('.empty-icon').textContent = '📄';
            emptyState.querySelector('.empty-title').textContent = 'No Log Entries';
            emptyState.querySelector('.empty-message').textContent = 'No log entries found for this date';
            logContainer.appendChild(emptyTemplate);
            return;
        }

        // Calculate stats
        const stats = calculateStats(lines);

        // Render stats
        const statsContainer = document.createElement('div');
        statsContainer.className = 'stats-container';

        const statsData = [
            { label: 'Total Entries', value: stats.total },
            { label: 'Errors', value: stats.errors, class: 'stat-error' },
            { label: 'Warnings', value: stats.warnings, class: 'stat-warn' },
            { label: 'Info', value: stats.info, class: 'stat-info' }
        ];

        statsData.forEach(stat => {
            const template = templates.statCard.content.cloneNode(true);
            const card = template.querySelector('.stat-card');
            card.querySelector('.stat-value').textContent = stat.value;
            card.querySelector('.stat-label').textContent = stat.label;
            if (stat.class) {
                card.classList.add(stat.class);
            }
            statsContainer.appendChild(template);
        });

        logContainer.appendChild(statsContainer);

        // Add download button
        if (currentUserId && currentDate) {
            const downloadBtn = document.createElement('a');
            downloadBtn.href = `/api/admin/logs/${currentUserId}/${currentDate}/download`;
            downloadBtn.className = 'download-btn';
            downloadBtn.textContent = 'Download Log File';
            downloadBtn.download = '';
            logContainer.appendChild(downloadBtn);
        }

        // Render log lines
        const linesContainer = document.createElement('div');
        linesContainer.className = 'log-lines';

        lines.forEach(line => {
            const formatted = formatLogLine(line);
            const template = templates.logLine.content.cloneNode(true);
            const logLine = template.querySelector('.log-line');

            logLine.classList.add(formatted.levelClass);
            logLine.querySelector('.log-timestamp').textContent = escapeHtml(formatted.timestamp);
            logLine.querySelector('.log-level').textContent = escapeHtml(formatted.level);
            logLine.querySelector('.log-message').textContent = escapeHtml(formatted.message);

            const metadataEl = logLine.querySelector('.log-metadata');
            if (formatted.metadata) {
                metadataEl.textContent = escapeHtml(formatted.metadata);
            } else {
                metadataEl.remove();
            }

            linesContainer.appendChild(template);
        });

        logContainer.appendChild(linesContainer);
    }

    /**
     * Calculate log statistics
     * @param {Array} lines - Log lines
     * @returns {object} Statistics
     */
    function calculateStats(lines) {
        const stats = {
            total: lines.length,
            errors: 0,
            warnings: 0,
            info: 0,
            debug: 0
        };

        lines.forEach(line => {
            const formatted = formatLogLine(line);
            const level = formatted.level.toLowerCase();

            if (level === 'error' || level === 'err') {
                stats.errors++;
            } else if (level === 'warn' || level === 'warning') {
                stats.warnings++;
            } else if (level === 'debug') {
                stats.debug++;
            } else {
                stats.info++;
            }
        });

        return stats;
    }

    /**
     * Render empty state in content area
     * @param {string} icon - Icon/emoji to display
     * @param {string} title - Title text
     * @param {string} message - Message text
     */
    function renderEmptyState(icon, title, message) {
        content.innerHTML = '';

        const template = templates.emptyState.content.cloneNode(true);
        const emptyState = template.querySelector('.empty-state');

        emptyState.querySelector('.empty-icon').textContent = icon;
        emptyState.querySelector('.empty-title').textContent = escapeHtml(title);
        emptyState.querySelector('.empty-message').textContent = escapeHtml(message);

        if (icon === 'error') {
            emptyState.classList.add('error-state');
            emptyState.querySelector('.empty-icon').textContent = '⚠️';
        }

        content.appendChild(template);
    }

    // ============================================
    // API Functions
    // ============================================

    /**
     * Fetch current admin user info
     */
    async function fetchAdminInfo() {
        try {
            const response = await fetch('/api/admin/me');

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/admin/logs/login?error=session';
                    return;
                }
                throw new Error('Failed to fetch admin info');
            }

            const data = await response.json();
            const adminData = data.data || data;
            adminBadge.textContent = escapeHtml(adminData.username || adminData.name || 'Admin');
        } catch (error) {
            console.error('Error fetching admin info:', error);
        }
    }

    /**
     * Fetch users with logs
     */
    async function fetchUsers() {
        try {
            const response = await fetch('/api/admin/users');

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/admin/logs/login?error=session';
                    return;
                }
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();
            const users = data.data?.users || data.users || data || [];
            const params = getUrlParams();

            renderUsers(users, params.user);

            return users;
        } catch (error) {
            console.error('Error fetching users:', error);
            usersList.innerHTML = '<p class="error-text">Failed to load users</p>';
            return [];
        }
    }

    /**
     * Fetch available log dates for a user
     * @param {string} userId - User ID
     */
    async function fetchLogDates(userId) {
        try {
            const response = await fetch(`/api/admin/logs/${userId}`);

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/admin/logs/login?error=session';
                    return;
                }
                throw new Error('Failed to fetch log dates');
            }

            const data = await response.json();
            const logsData = data.data || data;
            return logsData.logs || logsData.dates || [];
        } catch (error) {
            console.error('Error fetching log dates:', error);
            showError('Failed to load log dates');
            return [];
        }
    }

    /**
     * Fetch log content for a specific date
     * @param {string} userId - User ID
     * @param {string} date - Date string
     */
    async function fetchLogContent(userId, date) {
        try {
            const response = await fetch(`/api/admin/logs/${userId}/${date}`);

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/admin/logs/login?error=session';
                    return;
                }
                throw new Error('Failed to fetch log content');
            }

            const data = await response.json();
            return data.data || data;
        } catch (error) {
            console.error('Error fetching log content:', error);
            showError('Failed to load log content');
            return null;
        }
    }

    // ============================================
    // Event Handlers
    // ============================================

    /**
     * Handle user click in sidebar
     * @param {string} userId - Clicked user ID
     */
    async function handleUserClick(userId) {
        if (currentUserId === userId) return;

        currentUserId = userId;
        currentDate = null;

        updateUrl({ user: userId, date: null });

        // Update selected state in sidebar
        document.querySelectorAll('.user-item').forEach(item => {
            item.classList.toggle('selected', item.dataset.userId === String(userId));
        });

        // Show loading state
        content.innerHTML = '<div class="loading">Loading log dates...</div>';

        // Fetch and render dates
        const dates = await fetchLogDates(userId);
        renderDatePills(dates, null, userId);
    }

    /**
     * Handle date pill click
     * @param {string} userId - User ID
     * @param {string} date - Selected date
     */
    async function handleDateClick(userId, date) {
        if (currentDate === date) return;

        currentDate = date;

        updateUrl({ user: userId, date: date });

        // Update selected state in date pills
        document.querySelectorAll('.date-pill').forEach(pill => {
            pill.classList.toggle('selected', pill.dataset.date === date);
        });

        // Show loading state in log container
        const logContainer = document.getElementById('logContainer');
        if (logContainer) {
            logContainer.innerHTML = '<div class="loading">Loading log content...</div>';
        }

        // Fetch and render log content
        const logData = await fetchLogContent(userId, date);
        if (logData) {
            renderLogContent(logData);
        }
    }

    // ============================================
    // Initialization
    // ============================================

    /**
     * Initialize the admin panel
     */
    async function init() {
        // Show initial loading state
        renderEmptyState('📋', 'Select a User', 'Choose a user from the sidebar to view their logs');

        // Fetch admin info and users in parallel
        await Promise.all([
            fetchAdminInfo(),
            fetchUsers()
        ]);

        // Check URL params and auto-select if present
        const params = getUrlParams();

        if (params.user) {
            currentUserId = params.user;

            // Update sidebar selection
            document.querySelectorAll('.user-item').forEach(item => {
                item.classList.toggle('selected', item.dataset.userId === params.user);
            });

            // Fetch dates for selected user
            const dates = await fetchLogDates(params.user);
            renderDatePills(dates, params.date, params.user);

            // If date is also specified, fetch log content
            if (params.date) {
                currentDate = params.date;

                // Update date pill selection
                document.querySelectorAll('.date-pill').forEach(pill => {
                    pill.classList.toggle('selected', pill.dataset.date === params.date);
                });

                const logData = await fetchLogContent(params.user, params.date);
                if (logData) {
                    renderLogContent(logData);
                }
            }
        }
    }

    // Handle browser back/forward navigation
    window.addEventListener('popstate', async () => {
        const params = getUrlParams();

        if (params.user !== currentUserId) {
            if (params.user) {
                await handleUserClick(params.user);
            } else {
                currentUserId = null;
                currentDate = null;
                document.querySelectorAll('.user-item').forEach(item => item.classList.remove('selected'));
                renderEmptyState('📋', 'Select a User', 'Choose a user from the sidebar to view their logs');
            }
        }

        if (params.user && params.date !== currentDate) {
            if (params.date) {
                await handleDateClick(params.user, params.date);
            } else {
                currentDate = null;
                document.querySelectorAll('.date-pill').forEach(pill => pill.classList.remove('selected'));
                const logContainer = document.getElementById('logContainer');
                if (logContainer) {
                    logContainer.innerHTML = '';
                    const emptyTemplate = templates.emptyState.content.cloneNode(true);
                    const emptyState = emptyTemplate.querySelector('.empty-state');
                    emptyState.querySelector('.empty-icon').textContent = '📅';
                    emptyState.querySelector('.empty-title').textContent = 'Select a Date';
                    emptyState.querySelector('.empty-message').textContent = 'Choose a date from above to view logs';
                    logContainer.appendChild(emptyTemplate);
                }
            }
        }
    });

    // Start initialization when DOM is ready
    document.addEventListener('DOMContentLoaded', init);

})();
