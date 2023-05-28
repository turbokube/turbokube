
import ImageTestRuntime from '../ImageTestRuntime';

describe("nodejs-source", () => {

  /** @type {ImageTestRuntime} */
  let runtime;

  /** @type {string} */
  let image;

  beforeAll(async () => {
    runtime = await ImageTestRuntime.getInstance({});
    image = await runtime.getTestImage('static-watch');
  });

  afterAll(async () => {
    ImageTestRuntime.stopAll();
  });

  describe("default sync watch", () => {

    /** @type {import('../Testcontainers').Container} */
    let container;

    it("starts with a default watch", async () => {
      container = await runtime.start({ image });
      await container.logs({
        stdout: /Waiting for replacement at \/app\/main/,
        timeout: 100,
      });
    });

    it("runs as nonroot", async () => {
      const whoami = await container.exec('whoami');
      expect(whoami.stdout).toMatch(/nonroot/);
    });

    it("picks up changes to main", async () => {
      // we use a shell script instead of a binary so the test can be platform independent
      await container.uploadFile({
        local: 'static-build/testmain2.sh',
        containerPath: '/app/main',
      });
      // make sure the file is copied as executable
      const stat = await container.exec('stat', ['/app/main']);
      expect(stat.stdout).toMatch(/-rwxr[w-]xr[w-]x/);
      await container.logs({
        stdout: /in testmain2 at \/app\/main/,
        timeout: 1000,
      });
    });

  });

});
