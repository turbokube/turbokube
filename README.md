# turbokube

Fast, cheap and hackable devloops for containers.

 * Works with any container you can copy files to.
 * No image registry required.
 * First class monorepo support.
 * Nothing fancy or opaque or low-level involved.
 * Gets you started with microservices on Kubernetes.

All of the above can be done without remote infrastructure.
Turbokube provides examples of how to bootstrap local Kubernetes environments.

## Disclaimer

Despite the name we're not affiliated with Turborepo or Turbopack.
We're only ispired by their focus on monorepo and lightness.

Note also that this project is not really public yet, it's only open source.
Hence the lack of documentation.
If you're interested anyway please reach out to [solsson](https://github.com/solsson) using the corresponding gmail address.

## Go to production

Local, transparent and composable: Turbokube facilitates experimentation and learning.

When ready for production, the following is clearly reviewable from an ops perspective:

 * Your local build workflow can be reused to build production images.

   - Thanks to having defined file sync patterns for your dev loops.

 * Image builds are reproducible and can be promoted to production registries.

   - Thanks to local declarative builds using [contain](https://github.com/turbokube/contain).

 * Kubernetes resource yaml is compatible with Kustomize / `kubectl apply -k`

 * Dependencies are already declared, in terms of [endpoints](#endpoints).

   - Again thanks to depending on them for your dev loops.

   - This lets you self host - i.e. actually understand - your backends during development.

## Getting started

 1. Add `127.0.0.1 kube.local` to your hosts file

## Endpoints

When you want to take your endpoints and Kustomize bases to production,
your Operations/SRE team will be interested in what _endpoints_ you'll depend on.
They'll likely configure third party components differently that you've done in development.
That doesn't matter as long as endpoints are compatible.
Turbokube provides a declarative approach to facilitate this transition.
In practice endpoints are kubernetes [services](https://kubernetes.io/docs/concepts/services-networking/service/) applied to the same namespaces as your application.

## More

 * [github org](https://github.com/turbokube)
 * [npmjs org](https://www.npmjs.com/org/turbokube)

## The Turborepo source

The remainder of this readme concerns how to contribute to Turborepo.

### Build base images

 - Full build: `./build.sh`
 - Example subset: `BUILD_SUBSET="^j(dk|re)17$" BUILDX_ARGS="--progress=plain" ./build.sh`
 - Re-test an already built image: `BUILD=false BUILD_SUBSET="^jdk17$" ./build.sh`
