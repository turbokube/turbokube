
import ImageTestRuntime from '../ImageTestRuntime';

describe("nodejs-source", () => {

  /** @type {ImageTestRuntime} */
  let runtime;

  beforeAll(async () => {
    runtime = await ImageTestRuntime.getInstance({});
  });

  afterAll(async () => {
    ImageTestRuntime.stopAll();
  });

  describe("default sync watch", () => {

    let container;

    it("starts with a default watch", async () => {
      expect(runtime).toBeTruthy();
      container = await runtime.start({
        image: 'ghcr.io/turbokube/nodejs-watch'
      });
      const logs1 = await container.logs({
        stdout: /waiting for replacement at \/app\/main.js/,
        timeout: 100,
      });
      console.log('logs1', logs1);
    });

    it("picks up changes to main", async () => {
      expect('filesync').to.equal('impolemented');
    });

  });

});
