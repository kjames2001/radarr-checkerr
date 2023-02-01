const fetch = require('node-fetch');
const { readFileSync, writeFileSync } = require('fs');

const filePath = "./radarrTorrents.json" // where to store info about current torrents being downloaded
const maxAcceptedDownloadTime = process.env.DOWNLOAD_TIME; // any torrent that takes longer than this time (in milliseconds) to download is abandonded 
const maxFileSize = process.env.FILE_SIZE // any torrent greater than this size (in bytes) is exempt from the time limit restriction
const waitTime = process.env.WAIT_TIME; // how much time (in milliseconds) to give the torrent to find peers and lower it's download time
const dateLocale = "en-GB";
const dateOptions = { dateStyle: 'short', timeStyle: 'short' };

const radarrUrl = process.env.RADARR_URL; // change this to match your Radarr URL
const apiKey = process.env.RADARR_API_KEY; // change this to match your Radarr API Key
const baseUrl = radarrUrl + "/api/v3/queue";
const apiKeyString = `&apikey=${apiKey}`;

let fetchMoviesUrl = baseUrl + "?includeUnknownMovieItems=true&includeMovie=true" + apiKeyString;

let torrents;
try {
    const torrentsFile = readFileSync(filePath);
    torrents = JSON.parse(torrentsFile);
    if (!torrents.lastRun) {
        torrents.lastRun = new Intl.DateTimeFormat(dateLocale, dateOptions).format(new Date());
    }
    if (!torrents.movies) {
        torrents.movies = {};
    }
} catch (e) {
    torrents = {
        lastRun: new Intl.DateTimeFormat(dateLocale, dateOptions).format(new Date()),
        movies: {},
    }
}


const currTime = new Intl.DateTimeFormat(dateLocale, dateOptions).format(new Date());
fetch(fetchMoviesUrl, { method: "Get" })
    .then(res => res.json())
    .then((json) => {
        json.records.forEach(t => {
            if (t.size && t.size > maxFileSize) return; // if size doesn't exist then its still processing the torrent

            // torrent is new
            if (!torrents.movies[t.id]) {
                torrents.movies[t.id] = {
                    title: t.title,
                    id: t.id,
                    timeleft: t.timeleft,
                    timeleftInMS: hmsToMilliseconds(t.timeleft)
                }
            } 
            // torrent was previously seen
            else {
                const timeleftInMS = hmsToMilliseconds(t.timeleft);
                torrents.movies[t.id].timeleft = t.timeleft;
                torrents.movies[t.id].timeleftInMS = timeleftInMS;

                // torrent will take too long to download
                if (timeleftInMS > maxAcceptedDownloadTime || timeleftInMS == null) {
                    // torrent has previously been marked as gonna take too long to download
                    if (torrents.movies[t.id].firstFailedAt) {
                        const first = Number(new Date(torrents.movies[t.id].firstFailedAt));
                        const now = Number(new Date());
                        // its been past the wait time to let the torrent figure its shit out
                        if (now - first > waitTime) {
                            console.log(`[${currTime}] Third Strike [DELETE] (time left: ${msToTime(timeleftInMS)}): ${t.tile}`);
                            const delUrl = `${baseUrl}/${t.id}?removeFromClient=true&blocklist=true${apiKeyString}`;
                            fetch(delUrl, {method: 'DELETE'});
                        } else {
                            console.log(`[${currTime}] Second Strike (time left: ${msToTime(timeleftInMS)}): ${t.tile}`);
                        }
                    // first time torrent has been marked as gonna take too long to download
                    } else {
                        console.log(`[${currTime}] First Strike (time left: ${msToTime(timeleftInMS)}): ${t.tile}`);
                        torrents.movies[t.id].firstFailedAt = new Date();
                    }
                // torrent used to be marked as gonna take too long to download, but has since recovered
                } else if (torrents.movies[t.id].firstFailedAt) {
                    console.log(`[${currTime}] Recovered: ${t.tile}`);
                    delete torrents.movies[t.id].firstFailedAt;
                }
            }
        })

        // remove any torrents that were completed/deleted
        Object.keys(torrents.movies).forEach(k => {
            if (!json.records.find(r => r.id == k)) {
                console.log(`[${currTime}] Completed or deleted: `, torrents.movies[k].title)
                delete torrents.movies[k];
            }
        })
        torrents.lastRun = new Intl.DateTimeFormat(dateLocale, dateOptions).format(new Date());

        // write the results to the file
        try {
            writeFileSync(filePath, JSON.stringify(torrents, null, 2), 'utf8');
          } catch (error) {
            console.log(`[${currTime}] An error has occurred writing to file`, error);
          }
    });

function hmsToMilliseconds(str) {
    if (!str) return;
    var p = str.split(':'),
        s = 0, m = 1;

    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10);
        m *= 60;
    }

    return s * 1000;
}

function msToTime(duration) {
    if (!duration) return "infinite";
    var milliseconds = parseInt((duration%1000)/100)
        , seconds = parseInt((duration/1000)%60)
        , minutes = parseInt((duration/(1000*60))%60)
        , hours = parseInt((duration/(1000*60*60))%24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
}
