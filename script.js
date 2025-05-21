let page = 1;

const usernameInput = document.getElementById('username');
const getProfileButton = document.getElementById('getProfileButton');
const toggleDarkModeButton = document.getElementById('toggleDarkModeButton');

const profileSection = document.getElementById('profile');
const statsSection = document.getElementById('stats');
const activitySection = document.getElementById('activity');

getProfileButton.addEventListener('click', getProfileData);
toggleDarkModeButton.addEventListener('click', toggleDarkMode);

window.onload = () => {
  const savedUsername = localStorage.getItem('githubUsername');
  if (savedUsername) {
    usernameInput.value = savedUsername;
    getProfileData();
  }

  if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
    toggleDarkModeButton.textContent = '☀️';
  }
};

function getProfileData() {
  const username = usernameInput.value.trim();
  if (!username) return alert('Please enter a username');

  localStorage.setItem('githubUsername', username);

  fetchProfile(username);
  fetchStats(username);
  fetchActivity(username);
}

async function fetchProfile(username) {
  try {
    const res = await fetch(`https://api.github.com/users/${username}`);
    if (!res.ok) throw new Error(res.status === 403 ? 'Rate limit exceeded, please try again later.' : 'Failed to fetch profile.');
    const data = await res.json();
    displayProfile(data);
  } catch (err) {
    profileSection.innerHTML = `<p class="error">Error: ${err.message}</p>`;
  }
}

function displayProfile(data) {
  profileSection.innerHTML = `
    <img src="${data.avatar_url}" alt="Avatar of ${data.login}" />
    <div class="profile-details">
      <h2>${data.name || data.login}</h2>
      <p class="bio">${data.bio || 'No bio available'}</p>
      <p class="follow">Followers: ${data.followers} | Following: ${data.following}</p>
      <a href="${data.html_url}" target="_blank" rel="noopener noreferrer">View Profile on GitHub</a>
    </div>
  `;
}

async function fetchStats(username) {
  try {
    // Fetch user info and repos in parallel
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`),
      fetch(`https://api.github.com/users/${username}/repos?per_page=100`)
    ]);

    if (!userRes.ok) throw new Error('Failed to fetch user info.');
    if (!reposRes.ok) throw new Error('Failed to fetch repos.');

    const user = await userRes.json();
    const repos = await reposRes.json();

    displayStats(user, repos);
  } catch (error) {
    statsSection.innerHTML = `<p class="error">Error: ${error.message}</p>`;
  }
}

function displayStats(user, repos) {
  let totalStars = 0,
    totalForks = 0,
    totalRepos = repos.length,
    totalIssues = 0,
    forkedReposCount = 0;

  const languageCount = {};

  let latestRepoDate = null;

  repos.forEach((repo) => {
    totalStars += repo.stargazers_count;
    totalForks += repo.forks_count;
    totalIssues += repo.open_issues_count;

    if (repo.fork) forkedReposCount++;

    if (repo.language) {
      languageCount[repo.language] = (languageCount[repo.language] || 0) + 1;
    }

    const updatedAt = new Date(repo.updated_at);
    if (!latestRepoDate || updatedAt > latestRepoDate) {
      latestRepoDate = updatedAt;
    }
  });

  const mostUsedLanguage = Object.entries(languageCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const largestRepo = repos.reduce((max, repo) => (repo.size > max.size ? repo : max), { size: 0 });

  const createdDate = new Date(user.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const latestRepoUpdated = latestRepoDate
    ? latestRepoDate.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'N/A';

  const avgStars = totalRepos ? (totalStars / totalRepos).toFixed(2) : '0.00';

  statsSection.innerHTML = `
    <h2>GitHub Stats</h2>
    <div class="stats-grid">
      <div class="stat-item">
        <strong>${totalRepos}</strong>
        <span>Public Repositories</span>
      </div>
      <div class="stat-item">
        <strong>${totalStars}</strong>
        <span>Total Stars</span>
      </div>
        <div class="stat-item">
        <strong>${avgStars}</strong>
        <span>Average Stars per Repo</span>
      </div>
      <div class="stat-item">
        <strong>${totalForks}</strong>
        <span>Total Forks</span>
      </div>
      <div class="stat-item">
        <strong>${totalIssues}</strong>
        <span>Open Issues</span>
      </div>
      <div class="stat-item">
        <strong>${user.public_gists}</strong>
        <span>Public Gists</span>
      </div>
      <div class="stat-item">
        <strong>${forkedReposCount}</strong>
        <span>Forked Repositories</span>
      </div>
      <div class="stat-item">
        <strong>${mostUsedLanguage}</strong>
        <span>Most Used Language</span>
      </div>
      <div class="stat-item">
        <strong>${(largestRepo.size / 1024).toFixed(2)} MB</strong>
        <span>Largest Repo Size</span>
      </div>
      <div class="stat-item">
        <strong>${latestRepoUpdated}</strong>
        <span>Latest Repo Updated</span>
      </div>
      <div class="stat-item">
        <strong>${createdDate}</strong>
        <span>Joined GitHub</span>
      </div>
    </div>
  `;
}

async function fetchActivity(username) {
  try {
    const res = await fetch(`https://api.github.com/users/${username}/events?page=${page}`);
    if (!res.ok) throw new Error(res.status === 403 ? 'Rate limit exceeded, please try again later.' : 'Failed to fetch activity.');
    const events = await res.json();
    displayActivity(events);
  } catch (err) {
    activitySection.innerHTML = `<p class="error">Error: ${err.message}</p>`;
  }
}

function displayActivity(events) {
  activitySection.innerHTML = `<h2>Recent Activity</h2><div class="activity-list"></div>`;
  const list = activitySection.querySelector('.activity-list');

  if (events.length === 0) {
    list.innerHTML = '<p>No recent activity found.</p>';
    return;
  }

  events.slice(0, 7).forEach((event) => {
    const repoName = event.repo.name;
    const eventType = event.type.replace(/Event$/, '');
    const repoUrl = `https://github.com/${repoName}`;

    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
      <p><strong>${eventType}</strong> at <a href="${repoUrl}" target="_blank" rel="noopener noreferrer">${repoName}</a></p>
    `;
    list.appendChild(item);
  });
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  if (document.body.classList.contains('dark-mode')) {
    localStorage.setItem('darkMode', 'enabled');
    toggleDarkModeButton.textContent = '☀️';
  } else {
    localStorage.removeItem('darkMode');
    toggleDarkModeButton.textContent = '🌙';
  }
}