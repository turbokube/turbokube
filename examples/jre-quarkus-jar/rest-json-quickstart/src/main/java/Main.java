import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;

@Path("")
public class Main {
  @GET
  public String hello() {
    return "in java REST";
  }
}
