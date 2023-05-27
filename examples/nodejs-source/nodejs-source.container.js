
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

    /** @type {import('../Testcontainers').Container} */
    let container;

    it("starts with a default watch", async () => {
      expect(runtime).toBeTruthy();
      container = await runtime.start({ image });
      await container.logs({
        stdout: /waiting for replacement at \/app\/main.js/,
        timeout: 100,
      });
    });

    it("picks up changes to main", async () => {
      await container.uploadFile({
        local: 'nodejs-source/testmain2.js',
        containerPath: '/app/main.js',
      });
      await container.logs({
        stdout: /in testmain2 at \/app\/main.js/,
        timeout: 1000,
      });
    });

  });

});
