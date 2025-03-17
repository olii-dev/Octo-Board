let page = 1;

document.getElementById('getProfileButton').addEventListener('click', getProfileData);
document.getElementById('toggleDarkModeButton').addEventListener('click', toggleDarkMode);

function getProfileData() {
    const username = document.getElementById("username").value;
    if (!username) return alert("Please enter a username");

    localStorage.setItem('githubUsername', username);
    fetchProfile(username);
    fetchActivity(username);
    fetchRepos(username);
    fetchStats(username);
}

window.onload = () => {
    const savedUsername = localStorage.getItem('githubUsername');
    if (savedUsername) {
        document.getElementById("username").value = savedUsername;
        fetchProfile(savedUsername);
        fetchActivity(savedUsername);
        fetchRepos(savedUsername);
        fetchStats(savedUsername);
    }
};

async function fetchProfile(username) {
    try {
        const response = await fetch(`https://api.github.com/users/${username}`);
        if (!response.ok) throw new Error(response.status === 403 ? 'Rate limit has been exceeded, please try again in one hour.' : 'Network response was not ok');
        const data = await response.json();
        displayProfile(data);
    } catch (error) {
        document.getElementById("profile").innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

function displayProfile(data) {
    document.getElementById("profile").innerHTML = `
        <img src="${data.avatar_url}" alt="Avatar">
        <h2>${data.name || data.login}</h2>
        <p>${data.bio || "No bio available"}</p>
        <p>Followers: ${data.followers} | Following: ${data.following}</p>
        <p><a href="${data.html_url}" target="_blank">View Profile</a></p>
    `;
}

async function fetchStats(username) {
    try {
        const response = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
        if (!response.ok) throw new Error(response.status === 403 ? 'Rate limit has been exceeded, please try again in one hour.' : 'Network response was not ok');
        const data = await response.json();
        displayStats(data);
    } catch (error) {
        document.getElementById("stats").innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

function displayStats(data) {
    let totalStars = 0;
    let totalForks = 0;
    let totalRepos = 0;
    let totalIssues = 0;
    let totalPRs = 0;

    data.forEach(repo => {
        totalStars += repo.stargazers_count;
        totalForks += repo.forks_count;
        totalRepos++;
        totalIssues += repo.open_issues_count;
        totalPRs += repo.pull_requests_count || 0;
    });

    document.getElementById("stats").innerHTML = `
        <h2>GitHub Stats</h2>
        <div class="stat-card">
            <span>Total Public Repositories:</span>
            <span>${totalRepos}</span>
        </div>
        <div class="stat-card">
            <span>Total Stars Earned:</span>
            <span>${totalStars}</span>
        </div>
        <div class="stat-card">
            <span>Total Forks:</span>
            <span>${totalForks}</span>
        </div>
        <div class="stat-card">
            <span>Total Issues:</span>
            <span>${totalIssues}</span>
        </div>
        <div class="stat-card">
            <span>Total Pull Requests:</span>
            <span>${totalPRs}</span>
        </div>
    `;
}

async function fetchActivity(username) {
    try {
        const response = await fetch(`https://api.github.com/users/${username}/events?page=${page}`);
        if (!response.ok) throw new Error(response.status === 403 ? 'Rate limit has been exceeded, please try again in one hour.' : 'Network response was not ok');
        const data = await response.json();
        displayActivity(data);
    } catch (error) {
        document.getElementById("activity").innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

function displayActivity(data) {
    const activityDiv = document.getElementById("activity");
    if (page === 1) activityDiv.innerHTML = "<h2>Recent Activity</h2>";

    const recentEvents = data.slice(0, 5);
    recentEvents.forEach(event => {
        activityDiv.innerHTML += `
            <div class="activity-card">
                <p>${event.type} at <a href="${event.repo.url}" target="_blank">${event.repo.name}</a></p>
            </div>
        `;
    });
}

async function fetchRepos(username) {
    try {
        const response = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
        if (!response.ok) throw new Error(response.status === 403 ? 'Rate limit has been exceeded, please try again in one hour.' : 'Network response was not ok');
        const data = await response.json();
        displayRepos(data);
    } catch (error) {
        document.getElementById("repos").innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

function displayRepos(data) {
    const repoDiv = document.getElementById("repos");
    repoDiv.innerHTML = "<h2>Repositories</h2>";

    data.forEach(repo => {
        repoDiv.innerHTML += `
            <div class="repo-card">
                <div><strong>${repo.name}</strong> - ${repo.language || "N/A"}</div>
                <div>⭐ ${repo.stargazers_count} | 🍴 ${repo.forks_count}</div>
                <a href="${repo.html_url}" target="_blank">View Repo</a>
            </div>
        `;
    });
}

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
}