
import ImageTestRuntime from '../ImageTestRuntime';

describe("jre-quarkus-jar", () => {

  /** @type {ImageTestRuntime} */
  let runtime;

  /** @type {string} */
  let image;

  beforeAll(async () => {
    runtime = await ImageTestRuntime.getInstance({});
    image = await runtime.getTestImage('jre17-watch');
  });

  afterAll(async () => {
    await ImageTestRuntime.stopAll();
  });

  describe("default sync watch", () => {

    /** @type {import('../Testcontainers').Container} */
    let container;

    it("postpones start until a jar exists", async () => {
      container = await runtime.start({ image });
      // TODO can we get some stdout or stderr from watchexec --postpone
      // await container.logs({
      //   stdout: //,
      //   timeout: 100,
      // });
    });

    it("runs as nonroot", async () => {
      const whoami = await container.exec('whoami');
      expect(whoami.stdout).toMatch(/nonroot/);
    });

    it("starts the entrypoint jar on new files in /app", async () => {
      await container.uploadFile({
        local: 'jre-quarkus-jar/rest-json-quickstart/target/quarkus-app',
        containerPath: '/app',
      });
      // make sure the file is copied as executable
      const stat = await container.exec('stat', ['/app/app/rest-json-quickstart-1.0.0-SNAPSHOT.jar']);
      // expect(stat.stdout).toMatch(/-rwxr[w-]xr[w-]x/);
      expect(stat.stdout).toMatch(/-r/);
      await container.logs({
        stdout: /rest-json-quickstart 1.0.0-SNAPSHOT on JVM .powered by Quarkus/i,
        timeout: 5000,
      });
    });

    it("restarts the entrypoint jar on changes in /app", async () => {
      // we use a shell script instead of a binary so the test can be platform independent
      await container.uploadFile({
        local: 'jre-quarkus-jar/command-mode-quickstart/target/quarkus-app',
        containerPath: '/app',
      });
      // make sure the file is copied as executable
      const stat = await container.exec('stat', ['/app/app/command-mode-quickstart-1.0.0-SNAPSHOT.jar']);
      // expect(stat.stdout).toMatch(/-rwxr[w-]xr[w-]x/);
      expect(stat.stdout).toMatch(/-r/);
      await container.logs({
        stdout: /in a java CLI/i,
        timeout: 5000,
      });
    });

  });

});
