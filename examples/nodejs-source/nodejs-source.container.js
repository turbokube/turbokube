
import ImageTestRuntime from '../ImageTestRuntime';

describe("nodejs-source", () => {

  /** @type {ImageTestRuntime} */
  let runtime;

  /** @type {string} */
  let image;

  beforeAll(async () => {
    runtime = await ImageTestRuntime.getInstance({});
    image = await runtime.getTestImage('nodejs-watch');
  });

  afterAll(async () => {
    ImageTestRuntime.stopAll();
  });

  describe("default sync watch", () => {

    let container;

    it("starts with a default watch", async () => {
      expect(runtime).toBeTruthy();
      container = await runtime.start({ image });
      const logs1 = await container.logs({
        stdout: /waiting for replacement at \/app\/main.js/,
        timeout: 100,
      });
    });

    it("picks up changes to main", async () => {
      expect('filesync').to.equal('impolemented');
    });

  });

});
