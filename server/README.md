# Mintlify Backend

## Installation

`npm install`

Install [Rust](https://www.rust-lang.org/tools/install)

`cd node_modules/@mintlify/grove/parser && npm install`

Install [Redis](https://redis.io/)
1. Download & cd into the redis folder
2. `make`
3. `make install` (sudo if necessary)

## Run
* In the redis folder, run `redis-server`
* Open 2 instances of the backend folder in your terminal
  * Run `npm run worker`
  * Run `npm run dev`

