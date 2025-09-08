# ApiLense

CLI tool to test and collecting stats of API endpoints by OpenApi specification
file.

## Brief info

* Name: ApiLense
* Platform/Framework: deno
* Interface: CLI
* Versioning: git, github
* СI/CD service: github actions
* Output: binary file
* Target platform: linux, windows, macos
* Publishing on: github packages, package managers: Chocolatey, homebrew

## Team

* [__SylvaticGhost__](https://github.com/SylvaticGhost)
* [Layron](https://github.com/layron11)
* [SofiaDivine](https://github.com/SofiaDivine)

## Main use case

User has an OpenApi specification file(local or remote) and wants to test all
endpoints defined in the file. He loads schema and optionaly can add it to
specified group(group is collection of schemas). After he selects endpoint, he
can fill parameters or fill json body for if needed. Util send specified number
of requests and collect stats about success, failed requests, average response
time, min/max response time and etc.

## Developing milestones
#### a) Planing
1. Write requirements
2. Chose tech stack and draft team members
#### b) Planning and preparation
1. Plan project structure by diagrams
2. Project data storages
3. Plan statistics theory
4. Plan CLI interface
5. Create repository, set up CI/CD
#### c) Implementation
1. Storing and manages OpenApi schemas
2. Sending requests to endpoints
3. *Creating complex scenarios with multiple endpoints
4. Collecting and showing statistics
5. Predictive analysis of endpoints
#### d) Testing
1. Unit tests
2. Integration/e2e tests
3. Performance tests
4. Fixing bugs & refactoring
#### e) Publishing
1. Publishing in package managers

## Requirements
### Functional
1. Load OpenApi schema from local file or remote url
2. Store loaded schemas in local storage
3. Manage schemas by groups
4. Test specified endpoint
5. Fill parameters and body for endpoint
6. Send specified number of requests to endpoint
7. Collect and show statistics about requests
8. Save statistics to local storage
### Non-functional
1. CLI interface
2. Cross-platform
3. Binary file output
4. Interactive list selection
