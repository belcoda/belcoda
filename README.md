## Queue System (pg-boss)

Background jobs are processed using [pg-boss](https://github.com/timgit/pg-boss).

### HMR Limitation

Queue workers do not support Hot Module Replacement (HMR). Workers register their handlers once at startup, and the running processes retain references to the initial handler code. **To see changes in queue handlers, you must restart the dev server.**
