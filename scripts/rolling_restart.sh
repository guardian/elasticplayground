#!/usr/bin/env bash

if [ "$1" == "" ]; then
  echo 'Usage: rolling_restart [statefulset/setname | deployment/deploymentname]'
  exit 1
fi

ITERATION=$(kubectl get "$1" -o json | jq -r '.spec.template.metadata.labels.iteration')
if [ "$?" != "0" ]; then
  exit 2  #error message should have been shown by kubectl
fi

NEW_ITERATION=$(( $ITERATION + 1 ))

echo Old iteration was $ITERATION, new iteration is $NEW_ITERATION

kubectl patch "$1" -p "{\"spec\":{\"template\":{\"metadata\":{\"labels\":{\"iteration\":\"$NEW_ITERATION\"}}}}}"

kubectl rollout status "$1"