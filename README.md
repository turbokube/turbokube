# turbokube

Monorepo development to Kubernetes.

Turbokube solves suprisingly hard problems that developers face when approaching the container ecosystem.

 * Build containers locally

 * Container builds can have local dependencies

 * Test locally in a cluster

All of the above can be done without remote infrastructure.

## Disclaimer

Despite the name we're not affiliated with Turborepo or Turbopack.
We're only ispired by their focus on monorepo and lightness.

Note also that this project is not really public yet, it's only open source.
Hence the lack of documentation.
If you're interested anyway please reach out to [solsson](https://github.com/solsson) using the corresponding gmail address.

## Go to production

Local, transparent and composable: Turbokube facilitates experimentation and learning.

When ready for production, the following is clearly reviewable from an ops perspective:

 * Image builds are reproducible and can be promoted to production registries.

 * Kubernetes resource yaml is compatible with Kustomize / `kubectl apply -k`

 * Dependencies are defined

## Getting started

 1. Add `127.0.0.1 kube.local` to your hosts file

## More

 * [github org](https://github.com/turbokube)
 * [npmjs org](https://www.npmjs.com/org/turbokube)

## Build base images

 - Full build: `./build.sh`
 - Example subset: `BUILD_SUBSET="^j(dk|re)17$" BUILDX_ARGS="--progress=plain" ./build.sh`
 - Re-test an already built image: `BUILD=false BUILD_SUBSET="^jdk17$" ./build.sh`
