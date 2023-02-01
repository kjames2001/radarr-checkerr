# radarr-checkerr
check for and delete stalled radarr downloads

This container runs a node js script with a cron schedule to detect stalled torrents, removes it and blocks it, so that radarr should start a new download of the same movie.

All credits goes to u/Douglas96 on reddit, he's the one who wrote the script.

Warning: DO NOT use it if you use private trackers, it will get you banned!

you can use the script as is, or use the docker version by building it or pull from my [dockerhub repo](https://hub.docker.com/r/kjames2001/radarr-checkerr).
