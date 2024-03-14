#!/bin/bash

# Install the application from the current lock file
npm ci
npm run build
npm run package