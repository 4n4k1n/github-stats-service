// server.js
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// GitHub stats endpoint
app.get('/api/stats', async (req, res) => {
const { username = '4n4k1n' } = req.query;

try {
	// Fetch GitHub user data
	const userResponse = await fetch(`https://api.github.com/users/${username}`, {
	headers: {
		'Authorization': process.env.GITHUB_TOKEN ? `token ${process.env.GITHUB_TOKEN}` : '',
		'Accept': 'application/vnd.github.v3+json',
		'User-Agent': 'GitHub-Stats-Service'
	}
	});
	
	if (!userResponse.ok) {
	throw new Error(`GitHub API error: ${userResponse.status}`);
	}
	
	const userData = await userResponse.json();
	
	// Fetch repositories
	const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, {
	headers: {
		'Authorization': process.env.GITHUB_TOKEN ? `token ${process.env.GITHUB_TOKEN}` : '',
		'Accept': 'application/vnd.github.v3+json',
		'User-Agent': 'GitHub-Stats-Service'
	}
	});
	
	const repos = await reposResponse.json();
	
	// Calculate stats from actual data
	const totalRepos = userData.public_repos || 0;
	const followers = userData.followers || 0;
	const following = userData.following || 0;
	
	// Calculate real commit counts and lines from repositories
	let totalCommits = 0;
	let totalAdditions = 0;
	let totalDeletions = 0;
	let contributedRepos = 0;
	
	// Fetch commit data for all repositories
	for (let i = 0; i < repos.length; i++) {
		const repo = repos[i];
		// Include all repos including forks
		try {
			// Get commit count for this repo
			const commitsResponse = await fetch(`https://api.github.com/repos/${username}/${repo.name}/commits?per_page=1&author=${username}`, {
				headers: {
					'Authorization': process.env.GITHUB_TOKEN ? `token ${process.env.GITHUB_TOKEN}` : '',
					'Accept': 'application/vnd.github.v3+json',
					'User-Agent': 'GitHub-Stats-Service'
				}
			});
			
			if (commitsResponse.ok) {
				const linkHeader = commitsResponse.headers.get('link');
				if (linkHeader) {
					// Parse the link header to get total pages
					const lastPageMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
					if (lastPageMatch) {
						totalCommits += parseInt(lastPageMatch[1]);
					}
				} else {
					// If no link header, there's only one page
					const commits = await commitsResponse.json();
					totalCommits += commits.length;
				}
			}
			
			// Get stats for this repo
			const statsResponse = await fetch(`https://api.github.com/repos/${username}/${repo.name}/stats/contributors`, {
				headers: {
					'Authorization': process.env.GITHUB_TOKEN ? `token ${process.env.GITHUB_TOKEN}` : '',
					'Accept': 'application/vnd.github.v3+json',
					'User-Agent': 'GitHub-Stats-Service'
				}
			});
			
			if (statsResponse.ok) {
				try {
					const stats = await statsResponse.json();
					// Ensure stats is an array before using find
					if (Array.isArray(stats)) {
						// Find the user's contributions
						const userStats = stats.find(contributor => 
							contributor.author && contributor.author.login === username
						);
						
						if (userStats && userStats.weeks) {
							// Sum up all weeks' additions and deletions
							userStats.weeks.forEach(week => {
								totalAdditions += week.a || 0;
								totalDeletions += week.d || 0;
							});
						}
					}
				} catch (jsonError) {
					// Skip parsing if JSON is malformed
					console.warn(`Error parsing stats JSON for ${repo.name}:`, jsonError.message);
				}
			}
		} catch (repoError) {
			// Skip this repo if there's an error
			console.warn(`Error fetching stats for ${repo.name}:`, repoError.message);
		}
	}
	
	// // If we couldn't get real data, provide reasonable estimates
	// if (totalCommits === 0) {
	// 	totalCommits = Math.max(1, Math.floor(totalRepos * 15 + followers * 2));
	// }
	// if (totalAdditions === 0) {
	// 	totalAdditions = Math.floor(totalCommits * 35);
	// }
	// if (totalDeletions === 0) {
	// 	totalDeletions = Math.floor(totalCommits * 8);
	// }
	
	// Generate animated SVG
	const svg = `
	<svg width="360" height="200" xmlns="http://www.w3.org/2000/svg">
		<defs>
		<linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
			<stop offset="0%" style="stop-color:#1a1f2e;stop-opacity:1" />
			<stop offset="50%" style="stop-color:#16213e;stop-opacity:1" />
			<stop offset="100%" style="stop-color:#0f3460;stop-opacity:1" />
		</linearGradient>
		
		<linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
			<stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:1">
			<animate attributeName="stop-color" values="#ff6b6b;#4ecdc4;#45b7d1;#ff6b6b" dur="6s" repeatCount="indefinite"/>
			</stop>
			<stop offset="50%" style="stop-color:#4ecdc4;stop-opacity:1">
			<animate attributeName="stop-color" values="#4ecdc4;#45b7d1;#ff6b6b;#4ecdc4" dur="6s" repeatCount="indefinite"/>
			</stop>
			<stop offset="100%" style="stop-color:#45b7d1;stop-opacity:1">
			<animate attributeName="stop-color" values="#45b7d1;#ff6b6b;#4ecdc4;#45b7d1" dur="6s" repeatCount="indefinite"/>
			</stop>
		</linearGradient>
		
		<linearGradient id="topBorder" x1="0%" y1="0%" x2="100%" y2="0%">
			<stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:1" />
			<stop offset="25%" style="stop-color:#4ecdc4;stop-opacity:1" />
			<stop offset="50%" style="stop-color:#45b7d1;stop-opacity:1" />
			<stop offset="75%" style="stop-color:#96ceb4;stop-opacity:1" />
			<stop offset="100%" style="stop-color:#feca57;stop-opacity:1" />
		</linearGradient>
		
		<filter id="glow">
			<feGaussianBlur stdDeviation="2" result="coloredBlur"/>
			<feMerge> 
			<feMergeNode in="coloredBlur"/>
			<feMergeNode in="SourceGraphic"/>
			</feMerge>
		</filter>
		
		<filter id="shadow">
			<feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="rgba(0,0,0,0.3)"/>
		</filter>
		</defs>
		
		<!-- Background with subtle animation -->
		<rect width="360" height="200" rx="12" fill="url(#bgGradient)" stroke="#58a6ff" stroke-width="1" filter="url(#shadow)">
		<animate attributeName="stroke-opacity" values="0.6;1;0.6" dur="4s" repeatCount="indefinite"/>
		</rect>
		
		<!-- Animated top border -->
		<rect width="360" height="3" rx="12" fill="url(#topBorder)">
		<animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite"/>
		<animateTransform attributeName="transform" type="scale" values="1,1;1.02,1;1,1" dur="5s" repeatCount="indefinite"/>
		</rect>
		
		<!-- GitHub icon -->
		<g transform="translate(20, 20)">
		<circle cx="7" cy="7" r="8" fill="#58a6ff" opacity="0.1">
			<animate attributeName="r" values="8;10;8" dur="3s" repeatCount="indefinite"/>
		</circle>
		<path d="M7,0 C3.13,0 0,3.13 0,7 C0,10.1 2.01,12.77 4.8,13.67 C5.15,13.74 5.27,13.52 5.27,13.33 C5.27,13.16 5.27,12.7 5.26,12.07 C3.31,12.49 2.9,11.13 2.9,11.13 C2.59,10.36 2.12,10.14 2.12,10.14 C1.47,9.71 2.17,9.72 2.17,9.72 C2.89,9.77 3.26,10.48 3.26,10.48 C3.86,11.56 4.83,11.26 5.28,11.08 C5.34,10.61 5.53,10.31 5.73,10.14 C4.17,9.96 2.54,9.35 2.54,6.66 C2.54,5.89 2.8,5.26 3.27,4.78 C3.2,4.6 2.95,3.88 3.33,2.91 C3.33,2.91 3.88,2.72 5.26,3.63 C5.8,3.48 6.4,3.4 7,3.4 C7.6,3.4 8.2,3.48 8.74,3.63 C10.12,2.72 10.67,2.91 10.67,2.91 C11.05,3.88 10.8,4.6 10.73,4.78 C11.2,5.26 11.46,5.89 11.46,6.66 C11.46,9.36 9.83,9.96 8.26,10.13 C8.51,10.35 8.73,10.78 8.73,11.44 C8.73,12.39 8.72,13.16 8.72,13.33 C8.72,13.52 8.84,13.75 9.2,13.67 C11.99,12.76 14,10.1 14,7 C14,3.13 10.87,0 7,0 Z" fill="#58a6ff" opacity="0.8"/>
		</g>
		
		<!-- Username -->
		<text x="45" y="31" font-family="Segoe UI, sans-serif" font-size="12" fill="#58a6ff" font-weight="500">${username}</text>
		
		<!-- Main commit count with pulsing animation -->
		<g transform="translate(180, 85)">
		<text x="0" y="0" font-family="Segoe UI, sans-serif" font-size="38" font-weight="700" fill="url(#textGradient)" text-anchor="middle" filter="url(#glow)">
			${totalCommits.toLocaleString()}
			<animate attributeName="font-size" values="38;42;38" dur="4s" repeatCount="indefinite"/>
		</text>
		</g>
		
		<!-- Commit label -->
		<g transform="translate(180, 108)">
		<text x="0" y="0" font-family="Segoe UI, sans-serif" font-size="13" fill="#96ceb4" text-anchor="middle" font-weight="500" letter-spacing="1px">TOTAL COMMITS</text>
		</g>
		
		<!-- Lines added box with hover effect -->
		<g transform="translate(55, 135)">
		<rect width="105" height="52" rx="8" fill="rgba(33, 38, 45, 0.9)" stroke="#30363d" stroke-width="1" filter="url(#shadow)">
			<animate attributeName="fill-opacity" values="0.9;1;0.9" dur="5s" repeatCount="indefinite"/>
		</rect>
		<text x="52.5" y="28" font-family="Segoe UI, sans-serif" font-size="19" font-weight="600" fill="#7ee787" text-anchor="middle" filter="url(#glow)">
			+${totalAdditions.toLocaleString()}
			<animate attributeName="fill" values="#7ee787;#90ff96;#7ee787" dur="3s" repeatCount="indefinite"/>
		</text>
		<text x="52.5" y="43" font-family="Segoe UI, sans-serif" font-size="10" fill="#7d8590" text-anchor="middle" letter-spacing="0.5px">ADDED</text>
		</g>
		
		<!-- Lines removed box with hover effect -->
		<g transform="translate(200, 135)">
		<rect width="105" height="52" rx="8" fill="rgba(33, 38, 45, 0.9)" stroke="#30363d" stroke-width="1" filter="url(#shadow)">
			<animate attributeName="fill-opacity" values="0.9;1;0.9" dur="5s" repeatCount="indefinite"/>
		</rect>
		<text x="52.5" y="28" font-family="Segoe UI, sans-serif" font-size="19" font-weight="600" fill="#ff6b6b" text-anchor="middle" filter="url(#glow)">
			-${totalDeletions.toLocaleString()}
			<animate attributeName="fill" values="#ff6b6b;#ff8080;#ff6b6b" dur="3s" repeatCount="indefinite"/>
		</text>
		<text x="52.5" y="43" font-family="Segoe UI, sans-serif" font-size="10" fill="#7d8590" text-anchor="middle" letter-spacing="0.5px">REMOVED</text>
		</g>
		
		<!-- Subtle background particles -->
		<circle cx="50" cy="60" r="1" fill="#58a6ff" opacity="0.3">
		<animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite"/>
		<animate attributeName="cy" values="60;50;60" dur="4s" repeatCount="indefinite"/>
		</circle>
		<circle cx="320" cy="40" r="1.5" fill="#4ecdc4" opacity="0.4">
		<animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite"/>
		<animate attributeName="cx" values="320;310;320" dur="5s" repeatCount="indefinite"/>
		</circle>
		<circle cx="280" cy="170" r="0.8" fill="#ff6b6b" opacity="0.5">
		<animate attributeName="opacity" values="0.5;0.9;0.5" dur="2.5s" repeatCount="indefinite"/>
		</circle>
	</svg>
	`;
	
	// Set cache headers
	res.setHeader('Content-Type', 'image/svg+xml');
	res.setHeader('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600'); // 30min cache
	res.setHeader('Access-Control-Allow-Origin', '*');
	
	return res.send(svg);
	
} catch (error) {
	console.error('Error fetching GitHub stats:', error);
	
	// Check if it's a rate limit error
	let errorMessage = 'Error loading stats';
	let subMessage = 'Check GitHub token or username';
	
	if (error.message.includes('403')) {
		errorMessage = 'Rate limit exceeded';
		subMessage = 'Add GITHUB_TOKEN or try again later';
	} else if (error.message.includes('404')) {
		errorMessage = 'User not found';
		subMessage = 'Check the username';
	}
	
	// Return animated error SVG
	const errorSvg = `
	<svg width="360" height="200" xmlns="http://www.w3.org/2000/svg">
		<defs>
		<linearGradient id="errorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
			<stop offset="0%" style="stop-color:#2d1b1b;stop-opacity:1" />
			<stop offset="100%" style="stop-color:#1a1a2e;stop-opacity:1" />
		</linearGradient>
		</defs>
		<rect width="360" height="200" rx="12" fill="url(#errorGradient)" stroke="#ff6b6b" stroke-width="2">
		<animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/>
		</rect>
		<text x="180" y="90" font-family="Arial, sans-serif" font-size="16" fill="#ff6b6b" text-anchor="middle">⚠️ ${errorMessage}</text>
		<text x="180" y="110" font-family="Arial, sans-serif" font-size="12" fill="#ff9999" text-anchor="middle">${subMessage}</text>
		<text x="180" y="130" font-family="Arial, sans-serif" font-size="10" fill="#666" text-anchor="middle">User: ${username}</text>
	</svg>
	`;
	
	res.setHeader('Content-Type', 'image/svg+xml');
	return res.status(500).send(errorSvg);
}
});

// Health check endpoint
app.get('/health', (req, res) => {
res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
res.json({ 
	message: 'GitHub Stats Service', 
	endpoints: {
	stats: '/api/stats?username=YOUR_GITHUB_USERNAME',
	health: '/health'
	}
});
});

app.listen(port, () => {
console.log(`🚀 GitHub Stats Service running on port ${port}`);
console.log(`📊 Stats endpoint: http://localhost:${port}/api/stats?username=4n4k1n`);
});

module.exports = app;
