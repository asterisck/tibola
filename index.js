const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = 5000;

app.use((req, res, next) => {
    const ipAddress = req.ip || req.connection.remoteAddress;
    console.log(`Request from IP address: ${ipAddress}`);
    next();
});
app.use(bodyParser.json());
app.use((req, res, next) => {
    // Set CORS headers to allow all origins
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Continue to the next middleware
    next();
});

function generateToken() {
    const url = 'https://api.penpencil.co/v3/oauth/token';

    const headers = {
        'Host': 'api.penpencil.co',
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'Sec-Ch-Ua-Mobile': '?0',
        'Client-Version': '2.4.16',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    const payload = {
        username: "8471801440",
        password: "123456",
        client_id: "system-admin",
        client_secret: "KjPXuAVfC5xbmgreETNMaL7z",
        grant_type: "password",
        organizationId: "5eb393ee95fab7468a79d189",
        latitude: 0,
        longitude: 0,
    };

    return axios.post(url, payload, { headers })
        .then(response => {
            const data = response.data.data;
            console.log(data.access_token, data.refresh_token);
            return [data.access_token, data.refresh_token];
        })
        .catch(error => {
            console.error(`Failed to generate token. Status Code: ${error.response.status}`);
            return null;
        });
}

function isTokenExpired(access_token) {
    const url = 'https://api.penpencil.co/v3/oauth/verify-token';

    const headers = {
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'sec-ch-ua-mobile': '?0',
        'integration-with': '',
        'client-version': '2.6.8',
        'Authorization': `Bearer ${access_token}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://www.pw.live/',
        'randomId': 'a29281b5-1f39-4f44-afdf-f523d88b5aa3',
        'client-id': '5eb393ee95fab7468a79d189',
        'client-type': 'WEB',
        'sec-ch-ua-platform': '"Windows"',
    };

    return axios.post(url, null, { headers })
        .then(response => {
            const success = response.data.success;
            console.log(success);
            return success;
        })
        .catch(error => {
            console.error(`Failed to verify token. Status Code: ${error.response.status}`);
            return false;
        });
}

app.get('/validate_token', async (req, res) => {
    const token = req.query.token;
    if (!token) {
        return res.status(400).json({ error: 'Token not provided in query parameters' });
    }

    if (!(await isTokenExpired(token))) {
        const regeneratedToken = await generateToken();
        return res.json({ status: false, token: regeneratedToken[0], retoken: regeneratedToken[1] });
    } else {
        return res.json({ status: true });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
