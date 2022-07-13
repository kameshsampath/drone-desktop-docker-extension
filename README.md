# Drone Desktop

A Docker Desktop extension to run and manage [drone](https://drone.io) pipelines.

> WARNING: This extension is under active development and expect to undergo lots of change and refactoring

## Pre-requisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Features

### Discover Drone Pipelines

Search and import existing Drone Pipelines, ideally these are project source folders that has `.drone.yml`:

![Import Pipelines](./docs/images/drone_desktop_feature_import.gif)

### Open Drone pipeline project in Visual Studio Code

The extension allows you to open and edit Drone Pipelines project in Visual Studio Code

![Open in Visual Studio Code](./docs/images/drone_desktop_feature_open_in_vs_code.gif)

### View Running Pipeline Containers

The extension allows you view the running containers of a pipeline along with its status.

![View running Pipeline Containers](./docs/images/drone_desktop_feature_run_pipelines.gif)

### Remove Pipelines

Finally you can also remove one or more Drone pipelines, removing does not physically delete but the pipeline is ignored by the extension watchers.

![Remove Pipelines](./docs/images/drone_desktop_feature_remove_pipelines.gif)

## TODO

- [ ] [View Logs](https://github.com/kameshsampath/drone-desktop-docker-extension/issues/1)
- [ ] [Exec into running container](https://github.com/kameshsampath/drone-desktop-docker-extension/issues/2)
- [ ] [Use DB for backend over JSON file](https://github.com/kameshsampath/drone-desktop-docker-extension/issues/3)

## Install Extension

```shell
make install-extension
```

## Remove Extension

```shell
make uninstall-extension
```

## Issues

Welcome all feedback and improvements. Please open an [issue](https://github.com/kameshsampath/drone-desktop-docker-extension/issues) for any bugs, feature requests

## Disclaimer

This is not an officially supported Harness product.
