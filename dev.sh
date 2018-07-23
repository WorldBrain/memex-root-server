#!/bin/bash
tmux new -d -s mr_prepare
tmux send-keys -t mr_prepare 'nvm use 8'
tmux send-keys -t mr_prepare 'Enter'
tmux send-keys -t mr_prepare 'npm run prepare:watch'
tmux send-keys -t mr_prepare 'Enter'

tmux new -d -s mr_devmon
tmux send-keys -t mr_devmon 'nvm use 8'
tmux send-keys -t mr_devmon 'Enter'
tmux send-keys -t mr_devmon 'npm run devmon'
