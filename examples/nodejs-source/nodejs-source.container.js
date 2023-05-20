
import ImageTestRuntime from '../ImageTestRuntime';

describe("nodejs-source", () => {

  /** @type {ImageTestRuntime} */
  let runtime;

  beforeAll(async () => {
    runtime = await ImageTestRuntime.getInstance({});
  });

  it("starts with a default watch", async () => {
    expect(runtime).toBeTruthy();
    const container = await runtime.start({
      image: 'ghcr.io/turbokube/nodejs-watch'
    });
    console.log('logs', await container.logs());
  }, 60000);

});
