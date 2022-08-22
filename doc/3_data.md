# Adding some Data

1. Obtain your snapshot, and save it somewhere on your host.  In this example, it's at `${HOME}/capi_snapshots`
2. 
## Notes for future additions
```
ps ax | grep qemu
rsync -av -e 'ssh -p 57116' capi_snapshots docker@localhost:/data --port 57116
```