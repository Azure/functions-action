package wincon;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.*;
import com.microsoft.azure.functions.annotation.*;
import com.microsoft.azure.functions.*;

public class Function {
    @FunctionName("HttpTrigger")
    public HttpResponseMessage run(@HttpTrigger(name = "req", methods = { HttpMethod.GET,
            HttpMethod.POST }, authLevel = AuthorizationLevel.ANONYMOUS) HttpRequestMessage<Optional<String>> request,
            final ExecutionContext context) {

        String file = "/home/site/wwwroot/sha.txt";
        String currentLine = "";
        try {
            BufferedReader reader = new BufferedReader(new FileReader(file));
            currentLine = reader.readLine();
            reader.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return request.createResponseBuilder(HttpStatus.OK).body(currentLine).build();
    }
}
