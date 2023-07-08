
import ImageTestRuntime from '../ImageTestRuntime';

describe("static-watch with single binary", () => {

  /** @type {ImageTestRuntime} */
  let runtime;

  /** @type {string} */
  let image;

  beforeAll(async () => {
    runtime = await ImageTestRuntime.getInstance({});
    image = await runtime.getTestImage('static-watch');
  });

  afterAll(async () => {
    await ImageTestRuntime.stopAll();
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
        local: 'single-binary/testmain-exit.sh',
        containerPath: '/app/main',
      });
      // make sure the file is copied as executable
      const stat = await container.exec('stat', ['/app/main']);
      expect(stat.stdout).toMatch(/-rwxr[w-]xr[w-]x/);
      // make sure the file was actually synchronized
      const cat = await container.exec('cat', ['/app/main']);
      expect(cat.stdout).toMatch(/in testmain-exit at/i);
      await container.logs({
        stdout: /in testmain-exit at \/app\/main/i,
        timeout: 1000,
      });
    });

    it("continues to pick up changes after main has exited", async () => {
      await container.uploadFile({
        local: 'single-binary/testmain-running.sh',
        containerPath: '/app/main',
      });
      await container.logs({
        stdout: /testmain-running wait 1 for replacement at \/app\/main/i,
        timeout: 1000,
      });
      await container.logs({
        stdout: /testmain-running wait 2 for replacement at \/app\/main/i,
        timeout: 300,
      });
    });

    it("continues to pick up changes after exit + still running", async () => {
      await container.uploadFile({
        local: 'single-binary/testmain-anotherexit.sh',
        containerPath: '/app/main',
      });
      await container.logs({
        stdout: /in testmain-anotherexit at \/app\/main/i,
        timeout: 1000,
      });
    });

  });

});
